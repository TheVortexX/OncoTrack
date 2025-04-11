import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar, Dimensions, Keyboard, Alert} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc, getDocs, DocumentReference, updateDoc, Timestamp, FieldValue, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import { getResponseWithHistory, getResponseWithImage } from '@/services/generativeChat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Modal from '@/components/modal'
import moment from 'moment';
import AppointmentForm from '@/components/appointmentFormModal';
import { saveUserAppointment } from '@/services/profileService';
import { useFocusEffect } from 'expo-router';

// TypeScript interfaces
interface Message {
    id?: string;
    text: string;
    imageUrl?: string | null;
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
            endTime: string;
            staff: string | null;
            notes?: string | null;
        }
    } | null;
}

interface Appointment {
    id: string;
    description: string;
    provider: string;
    startTime: moment.Moment;
    endTime: moment.Moment;
    appointmentType: string;
    staff: string;
    travelTime: moment.Duration;
    colour?: string;
    [key: string]: any; // Allow additional properties
}

const ChatScreen = () => {
    const insets =  useSafeAreaInsets()

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [chatRef, setChatRef] = useState<DocumentReference | null>(null);
    const { user } = useAuth();
    const [ selectedImage, setSelectedImage ] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
    const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [extractedAppointment, setExtractedAppointment] = useState<Appointment | null>(null);
    
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const bottomMargin = Platform.OS === 'ios' ?  50 + insets.bottom : 70

    useEffect(() => {
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


    useFocusEffect(
        useCallback(() => {
            if (!user?.uid) return;
            const loadMessages = async () => {
                try {
                    // Get the latest chat document
                    let latestChatDoc = await getLatestChatDoc();

                    if (!latestChatDoc) { //if it doesn't exist create it
                        const ref = await createNewChat();
                        if (!ref) {
                            console.error("Failed to create new chat document");
                            return;
                        }
                        updateLatestChatRef(ref);
                        latestChatDoc = await getLatestChatDoc();
                    }

                    if (!latestChatDoc) {
                        console.error("Document should have been created as it doesn't exist");
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

            // Load messages when
            loadMessages();
        }, [user?.uid])
    );

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

    const momentToTimestamp = (momentObj: moment.Moment) => {
        return Timestamp.fromDate(momentObj.toDate());
    };

    const handleSaveAppointment = (appointment:any) => {
        addNewAppointment(appointment);

        Alert.alert(
            "Appointment Saved",
            "Your appointment has been successfully added to your calendar.",
            [{ text: "OK", onPress: () => setIsFormVisible(false) }]
        );
    };

    const addNewAppointment = (appointment: Appointment) => {
        if (!user) return;

        const appointmentToSave = {
            ...appointment,
            startTime: momentToTimestamp(appointment.startTime),
            endTime: momentToTimestamp(appointment.endTime),
            travelTime: appointment.travelTime ? appointment.travelTime.asMilliseconds() : 0
        };

        saveUserAppointment(user.uid, appointmentToSave);
    }

    const addMessage = async (message: Message) => {
        if (!chatRef) return;
        const messageData = {
            text: message.text,
            role: message.role,
            sentAt: message.sentAt,
            imageUrl: message.imageUrl || null,
        };

        const messageDoc = await addDoc(
            collection(firestore, chatRef.path, 'messages'),
            messageData
        );

        // Update the chat document's updatedAt timestamp
        await updateDoc(chatRef, {
            updatedAt: serverTimestamp()
        });

        setMessages((prevMessages) => [
            ...prevMessages,
            { ...message, id: messageDoc.id }
        ]);

        return messageDoc;
    };

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleImageTap = (imageUri: string) => {
        setPreviewImageUri(imageUri);
        setIsImagePreviewVisible(true);
    };

    const sendMessage = async () => {
        if (!user?.uid) return;

        if (!message.trim() && !selectedImage) return; // Don't send empty messages

        try {
            setIsLoading(true);

            const userMessage: Message = {
                text: message,
                role: 'user',
                sentAt: serverTimestamp(),
                imageUrl: selectedImage || null,
            };

            addMessage(userMessage); // Add user message to Firebase

            // Clear input field
            setMessage('');

            let res:string;
            if (selectedImage) {
                const imagePath = selectedImage
                setSelectedImage(null);
                res = await getResponseWithImage(userMessage.text, imagePath);
                
            } else {
                const messageHist = messages.map((msg) => ({
                    role: msg.role,
                    parts: [{ text: msg.text }]
                }))
                let sliceNo = -20
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
            if (resObj.responseType === 'action' && resObj.action) {
                console.log("Handling Action")
                await handleAction(resObj.action);
            }


            addMessage(aiResponse); // Add AI response to Firebase

        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (action: { type: string; payload: any }) => {
        if (action.type === 'Appointment') {
            const appointmentData = action.payload;

            const startTime = moment(appointmentData.startTime, moment.ISO_8601);
            const endTime = moment(appointmentData.endTime, moment.ISO_8601);

            const appointment = {
                id: "temp-scanned",
                description: appointmentData.description,
                provider: appointmentData.provider,
                startTime: startTime,
                endTime: endTime,
                appointmentType: "Appointment", // Default type TODO CHANGE SCHEMA
                staff: appointmentData.staff || "",
                travelTime: moment.duration({ minutes: 0 }),
                notes: appointmentData.notes || ""
            };

            setExtractedAppointment(appointment);
            setIsFormVisible(true);
        }
    };

    const renderMessageItem = ({ item }: { item: Message }) => {
        const isUser = item.role === 'user';

        return (
            <View style={[
                styles.messageBubble,
                isUser ? styles.userMessage : styles.aiMessage
            ]}>
                {item.imageUrl && (
                    <TouchableOpacity
                        onPress={() => handleImageTap(item.imageUrl!)}
                        activeOpacity={0.9}
                    >
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.messageImage}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                )}
                <Text style={[
                    styles.messageText,
                    isUser ? styles.userMessageText : styles.aiMessageText
                ]}>
                    {item.text}
                </Text>
            </View>
        );
    };

    const attachImage = async () => {
        // Show options to user - take photo or select from library
        const showImageOptions = () => {
            Alert.alert(
                "Add an Image",
                "Choose an option",
                [
                    {
                        text: "Take Photo",
                        onPress: () => pickImageFromCamera(),
                    },
                    {
                        text: "Choose from Library",
                        onPress: () => pickImageFromLibrary(),
                    },
                    {
                        text: "Cancel",
                        style: "cancel"
                    }
                ]
            );
        };

        showImageOptions();
    };

    const pickImageFromCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Sorry, we need camera permissions to make this work!');
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: "images",
                allowsEditing: false,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image from camera:', error);
        }
    };

    const pickImageFromLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            alert('Sorry, we need media library permissions to make this work!');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                allowsEditing: false,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image from library:', error);
        }
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

                <View style={styles.inputArea}>
                    {selectedImage && (
                        <View style={styles.selectedImageContainer}>
                            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => setSelectedImage(null)}
                            >
                                <Ionicons name="close-circle" size={24} color={theme.colours.white} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <TouchableOpacity
                            style={styles.attachButton}
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
                                !message.trim() && !selectedImage ? styles.sendButtonDisabled : {}
                            ]}
                            onPress={sendMessage}
                            disabled={!message.trim() && !selectedImage}
                        >
                            <Ionicons
                                name="send"
                                size={24}
                                color={!message.trim() && !selectedImage ? theme.colours.lightGray : theme.colours.white}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding': undefined}
                    style={[styles.avoidContainer, Platform.OS === 'android' &&  isKeyboardVisible && { marginBottom: -85} ]}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? bottomMargin-15 : 0}
                />

            </View>
            {/* Image Preview Modal */}
            <Modal
                visible={isImagePreviewVisible}
                onClose={() => setIsImagePreviewVisible(false)}
                title="Image"
                leftButtonText="Close"
                rightButtonText=""
                onLeftButtonPress={() => setIsImagePreviewVisible(false)}
                backgroundColor="white"
            >
                <View style={styles.previewImageContainer}>
                    {previewImageUri && (
                        <Image
                            source={{ uri: previewImageUri }}
                            style={styles.previewImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
            {/* Appointment Form Modal */}
            <AppointmentForm
                visible={isFormVisible}
                onClose={() => setIsFormVisible(false)}
                title="Confirm Appointment"
                leftButtonText="Cancel"
                rightButtonText="Save"
                existingAppointment={extractedAppointment}
                initialDate={extractedAppointment?.startTime || moment()}
                onLeftButtonPress={() => setIsFormVisible(false)}
                onRightButtonPress={handleSaveAppointment}
                backgroundColor={theme.colours.surface}
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.blue99,
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
        backgroundColor: theme.colours.blueGray,
    },
    inputArea: {
        backgroundColor: theme.colours.blueGray,
        borderTopWidth: 1,
        borderTopColor: theme.colours.divider,
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        paddingBottom: 0,
        width: '100%',
    },
    selectedImageContainer: {
        padding: 8,
        paddingBottom: 0,
        alignSelf: 'flex-start',
        marginLeft: 16,
    },
    input: {
        flex: 1,
        backgroundColor: theme.colours.gray99,
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
        backgroundColor: theme.colours.gray80,
    },
    selectedImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: theme.colours.primary,
        borderRadius: 12,
    },
    messageImageContainer: {
        width: '100%',
        alignItems: 'center',
    },
    messageImage: {
        width: Dimensions.get('window').width * 0.7,
        height: 200,
        borderRadius: 8,
        marginBottom: 8,
    },
    previewImageContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewImage: {
        width: '140%',
        aspectRatio: 1,
        alignSelf: 'center',
    },
});

export default ChatScreen;