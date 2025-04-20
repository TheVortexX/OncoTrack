import React, { useState, useEffect } from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@/constants/theme';

const InputField = ({
    label = "",
    value,
    onChangeText,
    placeholder,
    placeholderTextColor = theme.colours.gray50,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    autoComplete = 'off',
    multiline = false,
    numberOfLines = 1,
    editable = true,
    autoCorrect = false,
    required = false,
    errorMessage = "Invalid input",
    validate = (text) => '',
    validateOnBlur = false,
    validateOnChange = false,
    clearErrorOnChange = true,
    returnKeyType = 'default',
    style = {}
}) => {
    const [error, setError] = useState('');
    const [touched, setTouched] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Update error when errorMessage prop changes
    useEffect(() => {
        if (errorMessage && touched) {
            setError(errorMessage);
        }
    }, [errorMessage]);

    const handleTextChange = (text) => {
        onChangeText(text);

        if (clearErrorOnChange && error) {
            setError('');
        }

        if (validateOnChange) {
            const validationError = validate(text);
            setError(validationError || '');
        }
    };

    const handleBlur = () => {
        setTouched(true);
        setIsFocused(false);

        if (validateOnBlur) {
            const validationError = validate(value);
            setError(validationError || '');
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    return (
        <View style={[
            styles.container,
            style.container
        ]}>
            {label && (
                <View style={styles.labelContainer}>
                    <Text style={[styles.label, style.label]}>
                        {label}
                        {required && <Text style={styles.requiredAsterisk}>*</Text>}
                    </Text>
                </View>
            )}

            <View style={[
                styles.inputContainer,
                isFocused && styles.focusedInputContainer,
                error && styles.errorInputContainer,
                style.inputContainer
            ]}>
                <TextInput
                    style={[
                        styles.input,
                        error ? styles.errorInput : {},
                        multiline && {
                            height: 24 * numberOfLines,
                            textAlignVertical: 'top'
                        },
                        style.input
                    ]}
                    value={value}
                    placeholder={placeholder}
                    placeholderTextColor={placeholderTextColor}
                    onChangeText={handleTextChange}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    autoCapitalize={autoCapitalize}
                    multiline={multiline}
                    numberOfLines={multiline ? numberOfLines : undefined}
                    autoCorrect={autoCorrect}
                    autoComplete={autoComplete}
                    editable={editable}
                    returnKeyType={returnKeyType}
                    allowFontScaling={false}
                />

                {touched && error ? (
                    <View style={styles.errorIconContainer}>
                        <Text style={styles.errorIcon}>!</Text>
                    </View>
                ) : null}
            </View>

            {touched && error ? (
                <Text style={[styles.errorText, style.errorText]}>
                    {error || errorMessage}
                </Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 5,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    label: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.medium,
        color: theme.colours.textPrimary,
    },
    requiredAsterisk: {
        color: theme.colours.primary,
        fontSize: normaliseSize(16),
        marginLeft: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        position: 'relative',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: theme.colours.surface,
    },
    errorInputContainer: {
        borderWidth: 1,
        borderColor: theme.colours.primary,
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
    },
    errorInput: {
    },
    errorIconContainer: {
        position: 'absolute',
        right: 10,
        height: 20,
        width: 20,
        borderRadius: 10,
        backgroundColor: theme.colours.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorIcon: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: normaliseSize(14),
    },
    errorText: {
        marginTop: 5,
        color: theme.colours.primary,
        fontSize: normaliseSize(14),
        fontFamily: theme.fonts.ubuntu.regular,
    }
});

export default InputField;