import React, { SyntheticEvent } from 'react';
import { StyleSheet, Pressable, Platform, ColorValue, NativeSyntheticEvent, ViewProps, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

type CheckboxEvent = {
    target: any;
    value: boolean;
};

type CheckboxProps = ViewProps & {
    value?: boolean;
    disabled?: boolean;
    color?: ColorValue;
    onChange?: (
        event: NativeSyntheticEvent<CheckboxEvent> | SyntheticEvent<HTMLInputElement, CheckboxEvent>
    ) => void;
    onValueChange?: (value: boolean) => void;
};

export default function ExpoCheckbox({
    color,
    disabled,
    onChange,
    onValueChange,
    style,
    value,
    ...other
}: CheckboxProps) {
    const handleChange = () => {
        onValueChange?.(!value);
    };

    // Calculate icon size based on style width or fallback to default
    const getIconSize = () => {
        let boxSize = 20; // Default size

        if (style && typeof style === 'object') {
            // Try to extract width from style object or array
            if (Array.isArray(style)) {
                for (const styleItem of style) {
                    if (styleItem && typeof styleItem === 'object' && 'width' in styleItem) {
                        boxSize = Number(styleItem.width);
                        break;
                    }
                }
            } else if ('width' in style) {
                boxSize = Number(style.width);
            }
        }

        return boxSize * 0.9;
    };

    const iconSize = getIconSize();

    return (
        <Pressable
            {...other}
            disabled={disabled}
            accessibilityRole="checkbox"
            accessibilityState={{ disabled, checked: value }}
            style={[
                styles.root,
                style,
                value && styles.checked,
                !!color && { backgroundColor: value ? color : undefined, borderColor: color },
                disabled && styles.disabled,
                value && disabled && styles.checkedAndDisabled,
            ]}
            onPress={handleChange}>
            {value && (
                <View style={styles.iconContainer}>
                    <Feather
                        name="check"
                        size={iconSize}
                        color="white"
                    />
                </View>
            )}
        </Pressable>
    );
}

const defaultEnabledColor = Platform.select({
    ios: '#007AFF',
    android: '#009688',
});
const defaultGrayColor = '#657786';
const disabledGrayColor = '#CCD6DD';
const disabledCheckedGrayColor = '#AAB8C2';

const styles = StyleSheet.create({
    root: {
        height: 20,
        width: 20,
        borderRadius: 2,
        borderWidth: 2,
        borderColor: defaultGrayColor,
    },
    checked: {
        backgroundColor: defaultEnabledColor,
        borderColor: defaultEnabledColor,
    },
    disabled: {
        borderColor: disabledGrayColor,
        backgroundColor: 'transparent',
    },
    checkedAndDisabled: {
        backgroundColor: disabledCheckedGrayColor,
        borderColor: disabledCheckedGrayColor,
    },
    iconContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});