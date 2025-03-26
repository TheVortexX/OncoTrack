import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar, Dimensions} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';

// TypeScript interfaces
interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: any; // Firestore timestamp
    userId: string;
}

const { width } = Dimensions.get('window');

const ChatScreen = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const flatListRef = useRef<FlatList>(null);

    // Listen for messages from Firestore
    useEffect(() => {
        if (!user?.uid) return;

        const messagesRef = collection(firestore, 'chatMessages');
        const q = query(
            messagesRef,
            where('userId', '==', user.uid),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messageList: Message[] = [];
            snapshot.forEach((doc) => {
                messageList.push({ id: doc.id, ...doc.data() } as Message);
            });
            setMessages(messageList);
        });

        return () => unsubscribe();
    }, [user]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!message.trim() || !user?.uid) return;

        const userMessage = {
            text: message,
            sender: 'user',
            timestamp: serverTimestamp(),
            userId: user.uid
        };

        // Add user message to Firestore
        try {
            setIsLoading(true);
            // await addDoc(collection(firestore, 'chatMessages'), userMessage);

            setMessages((prevMessages) => [...prevMessages, { id: 'temp-user-id', ...userMessage, sender: 'user' }]);

            // Clear input field
            setMessage('');

            // Simulate AI response (would be replaced by actual AI API call)
            setTimeout(async () => {
                const aiResponse = {
                    text: generateAIResponse(message),
                    sender: 'ai',
                    timestamp: serverTimestamp(),
                    userId: user.uid
                };

                // await addDoc(collection(firestore, 'chatMessages'), aiResponse);
                setMessages((prevMessages) => [...prevMessages, { id: 'temp-ai-id', ...aiResponse, sender: 'ai' }]);

                setIsLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error sending message:', error);
            setIsLoading(false);
        }
    };

    // TODO Replace with actual API call to an AI service
    const generateAIResponse = (userMessage: string): string => {
        const lowerCaseMessage = userMessage.toLowerCase();

        if (lowerCaseMessage.includes('side effect') || lowerCaseMessage.includes('side-effect')) {
            return "Side effects vary by treatment. Common ones include fatigue, nausea, and hair loss. It's important to report all side effects to your healthcare team. Would you like more specific information about side effects for a particular treatment?";
        } else if (lowerCaseMessage.includes('appointment') || lowerCaseMessage.includes('schedule')) {
            return "I see you're asking about appointments. You can view and manage your appointments in the Schedule tab. Would you like me to help you understand your upcoming treatment schedule?";
        } else if (lowerCaseMessage.includes('pain') || lowerCaseMessage.includes('hurt')) {
            return "I'm sorry to hear you're experiencing pain. This should be reported to your healthcare team immediately. Would you like information about pain management techniques or help contacting your medical team?";
        } else {
            return "Thank you for your message. As an AI assistant, I'm here to provide general information about cancer treatments, help you understand your care plan, and answer questions. For medical advice specific to your condition, please consult your healthcare team.";
        }
    };

    const renderMessageItem = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';

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

            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>Treatment Assistant</Text>
                    <Text style={styles.subHeaderText}>Chat with your AI assistant</Text>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessageItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messageList}
                />

                {isLoading && (
                    <View style={styles.typingIndicator}>
                        <Text style={styles.typingText}>AI is typing...</Text>
                    </View>
                )}

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ width: '100%' }}
                >
                    <View style={styles.inputContainer}>
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
                </KeyboardAvoidingView>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e6f7f7',
        marginBottom: 70,
        paddingBottom: 20,
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
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: "#B8D6D7",
        borderTopWidth: 1,
        borderTopColor: theme.colours.divider,
        marginBottom: 70,
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
    sendButtonDisabled: {
        backgroundColor: theme.colours.gray50,
    },
});

export default ChatScreen;