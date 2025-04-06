import { firestore } from '@/services/firebaseConfig';
import {doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, collection, query, orderBy} from 'firebase/firestore';

const db = firestore;

export const createUserProfile = async (uid?: string, initialData = {}) => {
    if (!uid) return false; // Ensure uid is provided
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

export const getUserProfile = async (uid?: string) => {
    if (!uid) return null; // Ensure uid is provided
    try {
        const document = await getDoc(doc(db, 'users', uid));
        return document.data();
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
};

    export const getUserAppointments = async (uid?: string) => {
        if (!uid) return []; // Ensure uid is provided
        try {
            const appointmentsCollection = collection(db, 'users', uid, 'appointments');
            const q = query(appointmentsCollection, orderBy('startTime', 'asc'));
            const snapshot = await getDocs(q);
            return snapshot.docs;
        } catch (error) {
            console.error('Error fetching user appointments:', error);
            return [];
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

export const deleteUserProfile = async (uid?: string) => {
    if (!uid) return null; // Ensure uid is provided
    try {
        await deleteDoc(doc(db, 'users', uid));
        return true;
    } catch (error) {
        console.error('Error deleting user profile:', error);
        return false;
    }
};