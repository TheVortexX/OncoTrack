import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

const InputField = ({
    label,
    value,
    onChangeText,
    placeholder,
    placeholderTextColor = '#808080',
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    autoComplete = 'off',
    multiline = false,
    numberOfLines = 1,
    autoCorrect = false,
    required = false,
    errorMessage = "Invalid input",
    validate = (text) => '',
    validateOnBlur = false,
    style = {}

}) => {
    const [error, setError] = useState('');
    const [touched, setTouched] = useState(false);

    const handleTextChange = (text) => {
        onChangeText(text);
        if (error && text) {
            setError('');
        }
    }

    const handleBlur = () => {
        setTouched(true);
        if (validateOnBlur) {
            var validationError = validate(value);
            setError(validationError || '');
        }
    }

    return (
        <View style={style.container}>
            {label && <Text style={style.label}>{label}{required ? '*': ''}</Text>}
            <View style={styles.inputContainer}>
                <TextInput
                    style={[
                        style.input,
                        error ? style.errorInput : {},
                        multiline && { height: 24*numberOfLines, textAlignVertical: 'top' }
                    ]}
                    value={value}
                    placeholder={placeholder}
                    placeholderTextColor={placeholderTextColor}
                    onChangeText={handleTextChange}
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    onBlur={handleBlur}
                    autoCapitalize={autoCapitalize}
                    multiline={multiline}
                    numberOfLines={multiline ? numberOfLines : undefined}
                    autoCorrect={autoCorrect}
                    autoComplete={autoComplete}
                />
                {touched && error ? (
                    <View style={styles.errorIconContainer}>
                        <Text style={styles.errorIcon}>!</Text>
                    </View>
                ) : null}
            </View>
            {touched && error ?(
                <Text style={style.errorText}>{error || errorMessage}</Text>
            ) : null}
        </View>
    );
};


const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        position: 'relative',
        alignItems: 'center',
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
        fontSize: 14,
    }
});

export default InputField;