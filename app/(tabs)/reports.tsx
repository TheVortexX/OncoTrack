import { theme } from '@/constants/theme';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// TODO

const Reports = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Reports Screen Placeholder</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colours.gray99,
    },
    text: {
        fontSize: 20,
        color: '#333',
    },
});

export default Reports;