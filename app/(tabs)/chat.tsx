import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar, Dimensions, Keyboard} from 'react-native';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, getDocs, DocumentReference, updateDoc, Timestamp, FieldValue, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import { getResponseWithHistory, getResponseWithImage } from '@/services/generativeChat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// TypeScript interfaces
interface Message {
    id?: string;
    text: string;
    role: 'user' | 'model';
    sentAt: Timestamp | FieldValue; // Firestore timestamp
}

interface ChatResponse {
    responseType: 'chat' | 'action';
    content: string;
    action?: {
        type: 'Appointment';
        payload: {
            description: string;
            provider: string;
            startTime: string; // ISO date-time format
            endTime: string;   // ISO date-time format
            staff: string | null;
            notes?: string | null;
        }
    } | null;
}


const ChatScreen = () => {
    const insets =  useSafeAreaInsets()

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chatRef, setChatRef] = useState<DocumentReference | null>(null);
    const { user } = useAuth();
    const flatListRef = useRef<FlatList>(null);

    const [isKeyboardVisible, setKeyboardVisible] = React.useState(false);

    React.useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const bottomMargin = Platform.OS === 'ios' ?  50 + insets.bottom : 70

    useEffect(() => {
        if (!user?.uid) return;
        const loadMessages = async () => {
            try {
                // Get the latest chat document
                let latestChatDoc = await getLatestChatDoc();

                if (!latestChatDoc) { //if it does't exist create it
                    const ref = await createNewChat();
                    if (!ref) {
                        console.error("Failed to create new chat document");
                        return;
                    }
                    updateLatestChatRef(ref);
                    latestChatDoc = await getLatestChatDoc();
                }

                if (!latestChatDoc) {
                    console.error("Document should have been created as it doesnt exist");
                    return;
                }

                // Get the chatRef from the document
                const chatRefFromDoc = latestChatDoc.data().chatRef;
                setChatRef(chatRefFromDoc);

                if (!chatRefFromDoc) {
                    console.error("No chat reference found");
                    return;
                }

                // Verify the chat document exists
                const chatDoc = await getDoc(chatRefFromDoc);
                if (!chatDoc.exists()) {
                    console.error("Chat document does not exist");
                    return;
                }

                // Fetch messages from the subcollection
                const messagesSnapshot = await getDocs(
                    query(
                        collection(firestore, chatRefFromDoc.path, 'messages'),
                        orderBy('sentAt', 'asc')
                    )
                );

                const messagesArray: Message[] = [];
                messagesSnapshot.forEach(doc => {
                    const messageData = doc.data() as Message;
                    messagesArray.push({
                        ...messageData,
                        id: doc.id
                    });
                });
                setMessages(messagesArray);
            } catch (error) {
                console.error("Error loading messages:", error);
            }
        };

        // Load messages once when component mounts
        loadMessages();
    }, []);

    const createNewChat = async () => {
        if (!user?.uid) return;
        const docRef = await addDoc(collection(firestore, 'users', user.uid, 'chats'), {
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        setChatRef(docRef);
        updateLatestChatRef(docRef);
        setMessages([]); // Reset messages when creating a new chat
        return docRef;
    }

    const getLatestChatDoc = async () => {
        if (!user?.uid) return;
        const latestChatDocRef = doc(firestore, 'users', user.uid, 'chats', 'latest');
        const latestChatDoc = await getDoc(latestChatDocRef);
        return latestChatDoc.exists() ? latestChatDoc : null;
    }

    const updateLatestChatRef = async (chatRef: DocumentReference) => {
        if (!user?.uid) return;
        const latestChatDocRef = doc(firestore, 'users', user.uid, 'chats', 'latest');
        await setDoc(latestChatDocRef, {
            chatRef: chatRef,
        });
    }

    const addMessage = async (message: Message) => {
        if (!chatRef) return;

        const messageDoc = await addDoc(collection(firestore, chatRef.path, 'messages'), {
            ...message,
        });
        
        // Update the chat documents updatedAt timestamp
        await updateDoc(chatRef, {
            updatedAt: serverTimestamp()
        });

        setMessages((prevMessages) => [...prevMessages, {...message, id: messageDoc.id }]); // Add the message to the local state with the generated ID

        return messageDoc;
    }

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!user?.uid) return;

        const image = false // TODO add image upload logic here

        const userMessage: Message = {
            text: message,
            role: 'user',
            sentAt: serverTimestamp(),
        };

        if (!message.trim() && !image) return; // Don't send empty messages

        try {
            setIsLoading(true);
            addMessage(userMessage); // Add user message to Firebase

            // Clear input field
            setMessage('');

            let res:string;
            if (image) { //if (image) then call the image upload option
                res = await getResponseWithImage(userMessage.text, image);
            } else {
                const messageHist = messages.map((msg) => ({
                    role: msg.role,
                    parts: [{ text: msg.text }]
                }))
                let sliceNo = -6
                let slicedMessages = messageHist.slice(sliceNo); // Get the last 10 messages for context
                while (slicedMessages[0]?.role === 'model'){
                    sliceNo -= 1
                    slicedMessages = messageHist.slice(sliceNo);
                }
                res = await getResponseWithHistory(userMessage.text, slicedMessages);
            }
            const resObj:ChatResponse = JSON.parse(res);

            const aiResponse: Message = {
                text: resObj.content,
                role: 'model',
                sentAt: serverTimestamp(),
            };

            addMessage(aiResponse); // Add AI response to Firebase

        } catch (error) {
            console.error('Error sending message:', error);
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageItem = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';

        return (
            <View style={[
                styles.messageBubble,
                isUser ? styles.userMessage : styles.aiMessage
            ]}>
                <Text style={[
                    styles.messageText,
                    isUser ? styles.userMessageText : styles.aiMessageText
                ]}>
                    {item.text}
                </Text>
            </View>
        );
    };

    const attachImage = async () => {}


    return (
        <>
            <View style={{
                backgroundColor: theme.colours.blue20,
                height: Platform.OS === 'ios' ? 50 : 0
            }}>
                <StatusBar
                    backgroundColor={theme.colours.blue20}
                    barStyle="light-content"
                />
            </View>

            <View style={[styles.container, { marginBottom: bottomMargin }]}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>Treatment Assistant</Text>
                    <Text style={styles.subHeaderText}>Chat with your AI assistant</Text>
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            right: 16,
                            top: Platform.OS === 'android' ? 50 : 16,
                            padding: 8,
                        }}
                        onPress={createNewChat}
                    >
                        <Entypo name="new-message" size={30} color="white" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessageItem}
                    keyExtractor={(item) => {
                        if (!item.id) return "temp";
                        return item.id.toString()
                    }}
                    contentContainerStyle={styles.messageList}
                />

                {isLoading && (
                    <View style={styles.typingIndicator}>
                        <Text style={styles.typingText}>AI is typing...</Text>
                    </View>
                )}

                    <View style={styles.inputContainer}>
                    <TouchableOpacity
                        style={[
                            styles.attachButton,
                        ]}
                        onPress={attachImage}
                        >
                        <Ionicons
                            name="attach"
                            size={30}
                            color={theme.colours.white}
                            />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        value={message}
                        onChangeText={setMessage}
                        placeholder="Ask about your treatment..."
                        placeholderTextColor={theme.colours.gray}
                        multiline
                        />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            !message.trim() ? styles.sendButtonDisabled : {}
                        ]}
                        onPress={sendMessage}
                        disabled={!message.trim()}
                        >
                        <Ionicons
                            name="send"
                            size={24}
                            color={!message.trim() ? theme.colours.lightGray : theme.colours.white}
                            />
                    </TouchableOpacity>
                    </View>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding': undefined}
                    style={[styles.avoidContainer, Platform.OS === 'android' &&  isKeyboardVisible && { marginBottom: -85} ]}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? bottomMargin-15 : 0}
                />

            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e6f7f7',
        marginBottom: 70,
    },
    header: {
        backgroundColor: theme.colours.blue20,
        padding: 16,
        paddingTop: Platform.OS === 'android' ? 50 : 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerText: {
        fontSize: 24,
        fontFamily: theme.fonts.ubuntu.bold,
        color: 'white',
        textAlign: 'center',
    },
    subHeaderText: {
        fontSize: 14,
        fontFamily: theme.fonts.ubuntu.regular,
        color: 'white',
        textAlign: 'center',
        marginTop: 4,
    },
    messageList: {
        padding: 16,
        paddingBottom: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 18,
        marginVertical: 8,
        elevation: 3,
        shadowColor: '#000',
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colours.primary,
        borderBottomRightRadius: 4,
    },
    aiMessage: {
        alignSelf: 'flex-start',
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        fontFamily: theme.fonts.ubuntu.regular,
    },
    userMessageText: {
        color: theme.colours.white,
    },
    aiMessageText: {
        color: theme.colours.blue0,
    },
    typingIndicator: {
        padding: 8,
        marginLeft: 16,
    },
    typingText: {
        color: theme.colours.gray,
        fontStyle: 'italic',
        fontFamily: theme.fonts.ubuntu.regular,
    },
    avoidContainer: {
        width: '100%',
        height: 35,
        backgroundColor: "#B8D6D7",
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        paddingBottom: 0,
        backgroundColor: "#B8D6D7",
        borderTopWidth: 1,
        borderTopColor: theme.colours.divider,
        width: '100%',
    },
    input: {
        flex: 1,
        backgroundColor: theme.colours.gray80,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginRight: 8,
        minHeight: 48,
        maxHeight: 100,
        color: theme.colours.blue0,
        fontFamily: theme.fonts.ubuntu.regular,
        textAlignVertical: 'center',
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        paddingLeft: 4,
        backgroundColor: theme.colours.primary,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    attachButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colours.primary,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginRight: 8,
    },
    sendButtonDisabled: {
        backgroundColor: theme.colours.gray50,
    },
});

export default ChatScreen;