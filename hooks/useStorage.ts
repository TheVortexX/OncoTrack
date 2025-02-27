import { MMKV } from 'react-native-mmkv';
import React from 'react';

// Create a single instance
const storage = new MMKV();

export const useStorage = (key: string, defaultValue: any) => {
    const [value, setValue] = React.useState(() => {
        const storedValue = storage.getString(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
    });

    const setStoredValue = React.useCallback((newValue: any) => {
        setValue(newValue);
        storage.set(key, JSON.stringify(newValue));
    }, [key]);

    return [value, setStoredValue];
};

export const setValue = (key: string, value: any) => {
    storage.set(key, JSON.stringify(value));
}

export { storage as MMKV };