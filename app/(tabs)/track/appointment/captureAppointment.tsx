import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { getResponseWithImage } from '@/services/generativeChat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import moment from 'moment';
import { Timestamp } from 'firebase/firestore';
import { saveUserAppointment } from '@/services/profileService';
import AppointmentForm from '@/components/appointmentFormModal';

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


const AppointmentScanScreen = () => {
    const { user } = useAuth();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const insets = useSafeAreaInsets()
    const bottomMargin = Platform.OS === 'ios' ? 50 + insets.bottom : 70

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [extractedAppointment, setExtractedAppointment] = useState<Appointment | null>(null);

    const facing: CameraType = "back";

    if (!permission) {
        return <View style={styles.grantPermissionContainer}><ActivityIndicator size="large" color={theme.colours.primary} /></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.grantPermissionContainer}>
                <Text style={styles.permissionText}>
                    We need camera permission to scan your appointment letters
                </Text>
                <Pressable
                    style={styles.permissionButton}
                    onPress={requestPermission}
                >
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </Pressable>
            </View>
        );
    }

    const takePicture = async () => {
        try {
            const photo = await cameraRef.current?.takePictureAsync({
                quality: 1,
                skipProcessing: false
            });

            if (photo?.uri) {
                setCapturedImage(photo.uri);
            }
        } catch (error) {
            console.error('Error taking picture:', error);
            Alert.alert('Error', 'Failed to capture image. Please try again.');
        }
    };

    const handleSaveAppointment = (appointment:any) => {
        addNewAppointment(appointment);

        Alert.alert(
            "Appointment Saved",
            "Your appointment has been successfully added to your calendar.",
            [{ text: "OK", onPress: () => router.replace('/(tabs)/schedule') }]
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

    const momentToTimestamp = (momentObj: moment.Moment) => {
        return Timestamp.fromDate(momentObj.toDate());
    };
    

    const discardImage = () => {
        setCapturedImage(null);
    };

    const submitImage = async () => {
        if (!capturedImage || !user?.uid) return;

        try {
            setIsSubmitting(true);
            const curDate = moment().format("YYYY-MM-DD HH:mm:ss");

            const aiResponse = await getResponseWithImage(
                "Extract appointment details from this letter including date, time, location, department, and doctor name if available. The current date is " + curDate,
                capturedImage
            );

            const responseObj = JSON.parse(aiResponse);

            if (responseObj.action && responseObj.action.type === "Appointment") {
                const appointmentData = responseObj.action.payload;

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
            } else {
                Alert.alert(
                    "Extraction Failed",
                    "We couldn't accurately extract appointment details from this image. Please try again or enter details manually.",
                    [
                        { text: "OK", onPress: () => discardImage() }
                    ]
                );
            }

        } catch (error) {
            console.error('Error processing appointment scan:', error);
            Alert.alert('Error', 'Failed to process the appointment letter. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderImagePreview = () => {
        if (!capturedImage) return null;
        return (
            <View style={styles.previewContainer}>
                <Image
                    source={{ uri: capturedImage }}
                    style={styles.previewImage}
                    resizeMode='cover'
                />

                <View style={styles.previewOverlay}>
                    <Text style={styles.previewText}>
                        Is the entire appointment letter clearly visible?
                    </Text>
                </View>

                <View style={styles.previewControls}>
                    <Pressable
                        style={[styles.previewButton, styles.discardButton]}
                        onPress={discardImage}
                    >
                        <Ionicons name="refresh" size={24} color={theme.colours.textPrimary} />
                        <Text style={styles.cancelButtonText}>Retake</Text>
                    </Pressable>

                    <Pressable
                        style={[styles.previewButton, styles.submitButton, isSubmitting && styles.disabledButton]}
                        onPress={submitImage}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <ActivityIndicator size="small" color="white" />
                                <Text style={styles.buttonText}>Processing...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={24} color="white" />
                                <Text style={styles.buttonText}>Confirm</Text>
                            </>
                        )}
                    </Pressable>
                </View>
            </View>
        );
    };

    const renderCamera = () => {
        return (
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    ref={cameraRef}
                    facing={facing}
                    mode="picture"
                    enableTorch={false}
                    autofocus='on'
                >
                    {/* Document frame overlay */}
                    <View style={styles.documentFrame}>
                        <View style={styles.cornerTL} />
                        <View style={styles.cornerTR} />
                        <View style={styles.cornerBL} />
                        <View style={styles.cornerBR} />
                    </View>

                    <View style={styles.cameraOverlay}>
                        <Text style={styles.cameraOverlayText}>
                            Position your appointment letter within the frame
                        </Text>
                    </View>

                    <View style={styles.controlsContainer}>
                        <Pressable style={styles.backButton} onPress={() => router.back()}>
                            <AntDesign name="arrowleft" size={30} color="white" />
                        </Pressable>

                        <View style={styles.shutterContainer}>
                            <Pressable onPress={takePicture}>
                                {({ pressed }) => (
                                    <View
                                        style={[
                                            styles.shutterBtn,
                                            {
                                                opacity: pressed ? 0.5 : 1,
                                            },
                                        ]}
                                    >
                                        <View style={styles.shutterBtnInner} />
                                    </View>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </CameraView>
            </View>
        );
    };

    return (
        <View style={[styles.container, { marginBottom: bottomMargin }]}>
            {capturedImage ? renderImagePreview() : renderCamera()}

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.blue0,
    },
    grantPermissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colours.blue0,
    },
    cameraContainer: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        position: 'absolute',
        top: '10%',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    cameraOverlayText: {
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 12,
        borderRadius: 8,
        fontFamily: theme.fonts.ubuntu.regular,
        textAlign: 'center',
        fontSize: 16,
    },
    // Document frame styling
    documentFrame: {
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '80%',
        height: '60%',
        borderColor: 'rgba(255,255,255,0.5)',
        borderWidth: 1,
    },
    cornerTL: {
        position: 'absolute',
        top: -2,
        left: -2,
        width: 20,
        height: 20,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: 'white',
    },
    cornerTR: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 20,
        height: 20,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: 'white',
    },
    cornerBL: {
        position: 'absolute',
        bottom: -2,
        left: -2,
        width: 20,
        height: 20,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: 'white',
    },
    cornerBR: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: 'white',
    },
    controlsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 20,
        zIndex: 10,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterContainer: {
        width: '100%',
        paddingBottom: 40,
        alignItems: 'center',
    },
    shutterBtn: {
        backgroundColor: 'transparent',
        borderWidth: 5,
        borderColor: 'white',
        width: 85,
        height: 85,
        borderRadius: 42.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shutterBtnInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'white',
    },
    permissionText: {
        fontSize: 18,
        textAlign: 'center',
        margin: 20,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.white,
    },
    permissionButton: {
        backgroundColor: theme.colours.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 20,
    },
    cancelButtonText: {
        color: theme.colours.textPrimary,
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 20,
    },
    previewContainer: {
        flex: 1,
        backgroundColor: theme.colours.blue0,
    },
    previewImage: {
        flex: 1,
        width: '100%',
    },
    previewOverlay: {
        position: 'absolute',
        top: 80,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    previewText: {
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 12,
        borderRadius: 8,
        fontFamily: theme.fonts.ubuntu.bold,
        textAlign: 'center',
        fontSize: 16,
    },
    previewControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        paddingBottom: 40,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    previewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        flex: 0.48,
    },
    discardButton: {
        backgroundColor: theme.colours.gray50,
    },
    submitButton: {
        backgroundColor: theme.colours.primary,
    },
    disabledButton: {
        backgroundColor: theme.colours.gray20,
        opacity: 0.7,
    }
});

export default AppointmentScanScreen;