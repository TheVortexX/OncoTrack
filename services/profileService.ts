import { firestore } from '@/services/firebaseConfig';
import {doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, collection, query, orderBy, addDoc, where} from 'firebase/firestore';

const db = firestore;

export const updateSetting = async (uid: string, settingCategory: string, key: string, value:any) => {
    try {
        await updateDoc(doc(db, 'users', uid, 'settings', settingCategory), {
            [key]: value,
        }, )
        return true
    } catch (error) {
        console.error(`Error updating settingCategory: ${settingCategory} with key: ${key} and value ${value}`)
        return false;
    }
} 

export const createUserMedicationSettings = async (uid?: string) => {
    if (!uid) return false;
    try {
        await setDoc(doc(db, 'users', uid, 'settings', 'medications'), {
            morningTime: '08:00',
            afternoonTime: '12:00',
            eveningTime: '18:00',
            updatedAt: serverTimestamp(),
        })
        return true
    } catch (error) {
        console.error('Error creating user medication settings: ', error)
        return false
    }
}

export const createUserNotificationSettings = async (uid?: string) => {
    if (!uid) return false;
    try {
        await setDoc(doc(db, 'users', uid, 'settings', 'notirications'), {
            enabled: true,
            reminderTime: 60,
        })
        return true
    } catch (error){
        console.error('Error creating user notification settings: ', error)
        return false
    }
}

export const createUserQuickTrackSettings = async (uid?: string) => {
    if (!uid) return false;
    try {
        await setDoc(doc(firestore, 'users', uid, 'settings', 'quickTrack'), {
            symptoms: {
                mood: true,
                pain: false,
                energy: false,
                digestive: false,
                skin: false,
                mind: false,
                temperature: true
            }
        });
        return true;
    } catch (error) {
        console.error('Error creating user quick track settings: ', error);
        return false;
    }
};

export const createUserProfile = async (uid?: string, initialData = {}) => {
    if (!uid) return false; // Ensure uid is provided
    try {
        const userData = {
            uid,
            createdAt: serverTimestamp(),
            ...initialData
        };
        
        await setDoc(doc(db, 'users', uid), userData);
        await createUserMedicationSettings(uid);
        await createUserNotificationSettings(uid);
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

export const getTodaysAppointments = async (uid?: string) => {
    if (!uid) return []; // Ensure uid is provided
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const appointmentsCollection = collection(db, 'users', uid, 'appointments');
        const q = query(
            appointmentsCollection,
            where('startTime', '>=', startOfDay),
            where('startTime', '<=', endOfDay),
        );

        const snapshot = await getDocs(q);
        return snapshot.docs

    } catch (error) {
        console.error('Error fetching user appointments:', error);
        return [];
    }
}

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

export const getUserSymptomLogs = async (uid?: string) => {
    if (!uid) return []; // Ensure uid is provided
    try {
        const logColRef = collection(db, 'users', uid, 'symptomLogs');
        const q = query(logColRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs;
    } catch (error) {
        console.error('Error fetching user symptom logs:', error);
    }
}

export const updateUserSymptomLog = async (uid: string, logId: string, updates: any) => {
    if (!uid || !logId) return false;
    try {
        const logRef = doc(db, 'users', uid, 'symptomLogs', logId);
        const updatedLog = updates
        delete updatedLog.date;
        await updateDoc(logRef, {
            symptoms: {
                ...updatedLog,
            },
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating user symptom log:', error);
        return false;
    }
}

export const deleteUserSymptomLog = async (uid: string, logId: string) => {
    if (!uid || !logId) return false;
    try {
        const logRef = doc(db, 'users', uid, 'symptomLogs', logId);
        await deleteDoc(logRef);
        return true;
    } catch (error) {
        console.error('Error deleting user symptom log:', error);
        return false;
    }
};

export const saveUserSymptomLog = async (uid: string, symptomData: any) => {
    if (!uid || !symptomData.date) return false;
    try {
        const logDocRef = doc(db, 'users', uid, 'symptomLogs', symptomData.date);
        const date = symptomData.date;
        const newLog = symptomData;
        delete newLog.date;
        await setDoc(logDocRef, {
            date,
            symptoms: {
                ...newLog,
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error saving user symptom log:', error);
        return false;
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