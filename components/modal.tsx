// TODO make the modal buttons bigger

import { theme } from '@/constants/theme';
import { normaliseSize } from '@/utils/normaliseSize';
import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, Dimensions, Animated, Pressable, ScrollView } from 'react-native';

interface ModalComponentProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    leftButtonText?: string;
    rightButtonText?: string;
    onLeftButtonPress?: () => void;
    onRightButtonPress?: () => void;
    backgroundColor?: string;
    children: ReactNode;
}

const ModalComponent: React.FC<ModalComponentProps> = ({
    visible,
    onClose,
    title,
    leftButtonText = 'Cancel',
    rightButtonText = 'Done',
    onLeftButtonPress,
    onRightButtonPress,
    backgroundColor = '#FFFFFF',
    children,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [overlayVisible, setOverlayVisible] = useState(visible);

    useEffect(() => {
        if (visible) {
            setOverlayVisible(true);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setOverlayVisible(false);
            });
        }
    }, [visible]);

    const handleLeftButtonPress = () => {
        if (onLeftButtonPress) {
            onLeftButtonPress();
        }
    };

    const handleRightButtonPress = () => {
        if (onRightButtonPress) {
            onRightButtonPress();
        }
    };

    return (
        <>
            {overlayVisible && (
                <Animated.View
                    style={[
                        styles.overlay,
                        { opacity: fadeAnim }
                    ]}
                />
            )}
            <Modal
                animationType="slide"
                transparent={true}
                visible={visible}
                onRequestClose={onClose}
            >
                <View style={styles.container}>
                    {/* Top pressable area */}
                    <Pressable style={styles.outsidePressable} onPress={onClose}>
                        <View style={{ flex: 1 }} />
                    </Pressable>

                    {/* Middle row with left, modal, right */}
                    <View style={styles.middleRow}>
                        {/* Left pressable area */}
                        <Pressable style={styles.outsidePressable} onPress={onClose}>
                            <View style={{ flex: 1 }} />
                        </Pressable>

                        {/* Modal in the center */}
                        <View style={[styles.modalContainer, { backgroundColor }]}>
                            <View style={styles.header}>
                                <TouchableOpacity style={styles.buttonContainer} onPress={handleLeftButtonPress}>
                                    <Text style={styles.leftButton}>{leftButtonText}</Text>
                                </TouchableOpacity>

                                {title && (
                                    <View style={styles.titleContainer}>
                                        <Text style={styles.titleText}>{title}</Text>
                                    </View>
                                )}

                                <TouchableOpacity style={styles.buttonContainer} onPress={handleRightButtonPress}>
                                    <Text style={styles.rightButton}>{rightButtonText}</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView
                                style={styles.scrollView}
                                showsVerticalScrollIndicator={true}
                                contentContainerStyle={styles.contentContainer}
                                nestedScrollEnabled={true}
                            >
                                {children}
                            </ScrollView>
                        </View>

                        {/* Right pressable area */}
                        <Pressable style={styles.outsidePressable} onPress={onClose}>
                            <View style={{ flex: 1 }} />
                        </Pressable>
                    </View>

                    {/* Bottom pressable area */}
                    <Pressable style={styles.outsidePressable} onPress={onClose}>
                        <View style={{ flex: 1 }} />
                    </Pressable>
                </View>
            </Modal>
        </>
    );
}

const { width, height } = Dimensions.get('window');
const modalWidth = width * 0.85;
const modalMaxHeight = height * 0.7;

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1,
    },
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    middleRow: {
        flexDirection: 'row',
        maxHeight: modalMaxHeight,
    },
    outsidePressable: {
        flex: 1,
    },
    modalContainer: {
        width: modalWidth,
        maxHeight: modalMaxHeight,
        borderRadius: 12,
        borderColor: theme.colours.border,
        borderWidth: 1,
        overflow: 'hidden',
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    buttonContainer: {
        minWidth: 60,
    },
    leftButton: {
        color: '#007AFF',
        fontSize: normaliseSize(16),
        textAlign: 'left',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleText: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.textPrimary,
        textAlign: 'center',
    },
    rightButton: {
        color: '#007AFF',
        fontSize: normaliseSize(16),
        fontWeight: 'bold',
        textAlign: 'right',
    },
    scrollView: {
        maxHeight: modalMaxHeight - 50,
    },
    contentContainer: {
        padding: 16,
    },
});

export default ModalComponent;