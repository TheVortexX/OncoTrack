import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, Pressable, Animated, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { theme } from '@/constants/theme';

interface PickerItem {
    label: string;
    value: string | number;
}

interface PickerModalProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: (value: string) => void;
    value: string;
    items: PickerItem[];
    title?: string;
}

const { height } = Dimensions.get('window');

const PickerModal: React.FC<PickerModalProps> = ({
    isVisible,
    onClose,
    onConfirm,
    value,
    items,
    title = "Select an option"
}) => {
    const [tempValue, setTempValue] = useState<string>(value);
    const [modalVisible, setModalVisible] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;

    // Handle showing and hiding with animations
    useEffect(() => {
        if (isVisible) {
            setModalVisible(true);

            // Reset values before animating
            fadeAnim.setValue(0);
            slideAnim.setValue(height);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            // Animate out first, then hide modal
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start(() => {
                // Hide modal after animation completes
                setModalVisible(false);
            });
        }
    }, [isVisible, fadeAnim, slideAnim]);

    const handleConfirm = () => {
        onConfirm(tempValue);
        onClose();
    };

    const handleCancel = () => {
        setTempValue(value); // Reset to original value
        onClose();
    };

    return (
        <Modal
            visible={modalVisible}
            transparent={true}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.modalOuterContainer}>
                {/* Background overlay with fade animation */}
                <Animated.View
                    style={[
                        styles.overlay,
                        { opacity: fadeAnim }
                    ]}
                >
                    <Pressable
                        style={styles.pressableOverlay}
                        onPress={handleConfirm}
                    />
                </Animated.View>

                {/* Animated modal content */}
                <Animated.View
                    style={[
                        styles.modalContainer,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={handleCancel}>
                            <Text style={styles.cancelButton}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={handleConfirm}>
                            <Text style={styles.confirmButton}>Confirm</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={tempValue}
                            onValueChange={(itemValue: string) => setTempValue(itemValue)}
                            dropdownIconColor="black"
                            itemStyle={styles.pickerItem}
                        >
                            {items.map((item) => (
                                <Picker.Item
                                    key={String(item.value)}
                                    label={item.label}
                                    value={item.value}
                                    color="black"
                                />
                            ))}
                        </Picker>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOuterContainer: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    pressableOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
    },
    cancelButton: {
        fontSize: 16,
        color: theme.colours.textSecondary,
        fontFamily: theme.fonts.ubuntu.regular,
    },
    confirmButton: {
        fontSize: 16,
        color: theme.colours.blue20,
        fontFamily: theme.fonts.ubuntu.regular,
    },
    pickerWrapper: {
        backgroundColor: 'white',
        padding: 10,
    },
    pickerItem: {
        color: 'black',
        fontSize: 16,
    },
});

export default PickerModal;