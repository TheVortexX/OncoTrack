import { firestore } from '@/services/firebaseConfig';
import {doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp} from 'firebase/firestore';

const db = firestore;

export const createUserProfile = async (uid: string, initialData = {}) => {
    try {
        const userData = {
            uid,
            createdAt: serverTimestamp(),
            ...initialData
        };
        
        await setDoc(doc(db, 'users', uid), userData);
        return true;
    } catch (error) {
        console.error('Error creating user profile:', error);
        return false;
    }
};

export const getUserProfile = async (uid: string) => {
    try {
        const document = await getDoc(doc(db, 'users', uid));
        return document.data();
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

export const updateUserProfile = async (uid: string, updates:any) => {
    try {
        await updateDoc(doc(db, 'users', uid), {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating user profile:', error);
        return false;
    }
};

export const deleteUserProfile = async (uid: string) => {
    try {
        await deleteDoc(doc(db, 'users', uid));
        return true;
    } catch (error) {
        console.error('Error deleting user profile:', error);
        return false;
    }
};