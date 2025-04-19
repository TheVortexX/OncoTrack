import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


interface HeaderProps {
    title: string;
    subtitle: string;
    colour?: string;
    leftButtonType? : 'back' | 'close' | 'none';
    rightButtonIcon?: React.ReactNode;
    onRightButtonPress?: () => void;
    rightButtonText?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, colour = theme.colours.header, leftButtonType='none', rightButtonIcon = null, onRightButtonPress = () => {}, rightButtonText = "" }) => {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleLeftButtonPress = () => {
        if (leftButtonType === 'close' && router.canDismiss()) {
            router.dismiss();
            return;
        }
        if (leftButtonType === 'back' && router.canGoBack()) {
            router.back();
            return;
        }
        router.navigate('/(tabs)');
    }

    return (
    <>
        {/* Status Bar */}
        < View style={{backgroundColor: colour, height: Platform.OS === 'ios' ? insets.top : 0}} >
            <StatusBar
                backgroundColor={colour}
                barStyle="light-content"
            />
        </View >
        <View style={[styles.header, {backgroundColor: colour, paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
            <Text style={styles.headerText}>{title}</Text>
            <Text style={styles.subHeaderText}>{subtitle}</Text>
            {leftButtonType !== 'none' && (
                <TouchableOpacity
                        style={[styles.backButton, { top: Platform.OS === 'android' ? insets.top + 5 : 5 }]}
                    onPress={handleLeftButtonPress}
                >
                    {leftButtonType === 'close' ? (
                        <FontAwesome5 name="times" size={24} color="white" />
                    ) : (
                        <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                        
                    )}
                </TouchableOpacity>    
            )}
            {rightButtonIcon && (
                <TouchableOpacity
                    style={[styles.rightButton, {top: Platform.OS === 'android' ? insets.top + 5 : 5}]}
                    onPress={onRightButtonPress}
                >
                    {rightButtonIcon}
                    <Text style={styles.rightButtonText}>{rightButtonText}</Text>
                </TouchableOpacity>
            )}
        </View>
    </>
)};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.background,
    },
    header: {
        padding: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        position: 'relative',
    },
    headerText: {
        fontSize: 24,
        fontFamily: theme.fonts.openSans.semiBold || theme.fonts.ubuntu?.bold,
        color: theme.colours.textOnBlue,
        textAlign: 'center',
    },
    subHeaderText: {
        fontSize: 14,
        fontFamily: theme.fonts.openSans.regular || theme.fonts.ubuntu?.regular,
        color: theme.colours.textOnBlue,
        textAlign: 'center',
        marginTop: 4,
    },
    backButton: {
        position: 'absolute',
        left: 16,
        padding: 5,
    },
    rightButton: {
        position: 'absolute',
        right: 20,
        padding: 8,
        alignItems: 'center',
    },
    rightButtonText: {
        color: 'white',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 2,
    },
});

export default Header;