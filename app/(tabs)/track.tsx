import React from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { theme } from '@/constants/theme';

const Track = () => {
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
                    <Text style={styles.headerText}>Track</Text>
                    <Text style={styles.subHeaderText}>Add a symptom, appointment or medication</Text>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.background,
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
});

export default Track;