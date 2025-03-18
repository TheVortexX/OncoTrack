import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback } from 'react';

export const useStorage = (key: string, defaultValue: any) => {
    const [value, setValue] = useState(defaultValue);
    
    useEffect(() => {
        const loadValue = async () => {
            try {
                const storedValue = await AsyncStorage.getItem(key);
                if (storedValue !== null) {
                    setValue(JSON.parse(storedValue));
                }
            } catch (error) {
                console.error('Error loading from storage:', error);
            }
        };

        loadValue();
    }, [key]);

    const setStoredValue = useCallback(async (newValue: any) => {
        try {
            setValue(newValue);
            await AsyncStorage.setItem(key, JSON.stringify(newValue));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }, [key]);

    return [value, setStoredValue];
};

export const setStoredValue = async (key: string, value: any) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error setting value:', error);
    }
};

export const getStoredValue = async (key: string, defaultValue: any = null) => {
    try {
        const value = await AsyncStorage.getItem(key);
        return value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error('Error getting value:', error);
        return defaultValue;
    }
};

export const removeStoredValue = async (key: string) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error('Error removing value:', error);
    }
};