import { firestore } from '@/services/firebaseConfig';
import {doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, collection, query, orderBy, addDoc} from 'firebase/firestore';

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

export const updateUserAppointment = async (uid: string, appointmentId: string, updates: any) => {
    if (!uid || !appointmentId) return false;
    try {
        const appointmentRef = doc(db, 'users', uid, 'appointments', appointmentId);
        await updateDoc(appointmentRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating user appointment:', error);
        return false;
    }
}

export const deleteUserAppointment = async (uid: string, appointmentId: string) => {
    if (!uid || !appointmentId) return false;
    try {
        const appointmentRef = doc(db, 'users', uid, 'appointments', appointmentId);
        await deleteDoc(appointmentRef);
        return true;
    } catch (error) {
        console.error('Error deleting user appointment:', error);
        return false;
    }
};

export const saveUserAppointment = async (uid: string, appointmentData: any) => {
    if (!uid) return "";
    try {
        const appointmentColRef = collection(db, 'users', uid, 'appointments');
        const docRef = await addDoc(appointmentColRef, {
            ...appointmentData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving user appointment:', error);
        return "";
    }
}

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