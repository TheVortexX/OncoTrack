import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const setStoredValue = (key: string, value: any) => {
    storage.set(key, JSON.stringify(value));
}

export const getStoredValue = (key: string, defaultValue?: any) => {
    return JSON.parse(storage.getString(key) || defaultValue || 'null');
}

export { storage as MMKV };