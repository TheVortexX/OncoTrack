import { collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where, Timestamp, serverTimestamp } from '@firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import moment from 'moment';
import { medicationDueOnDate, timestampToMoment } from '@/utils/dateUtils';

const db = firestore;

export const getUserMedications = async (userId: string) => {
    try {
        const medicationsRef = collection(db, 'users', userId, 'medications');
        const snapshot = await getDocs(medicationsRef);
        return snapshot.docs;
    } catch (error) {
        console.error('Error getting medications:', error);
        return [];
    }
};

export const getDayMedications = async (userId: string, day?: moment.Moment) => {
    if (!day) {
        day = moment().startOf('day');
    }
    const medications = await getUserMedications(userId);

    const dayMedications = medications.filter((medication) => {
        const startDate = timestampToMoment(medication.data().startDate)
        const endDate = timestampToMoment(medication.data().endDate)
        const frequency = medication.data().frequency
        
        return medicationDueOnDate(startDate, endDate, frequency)
    })

    return dayMedications.map((medication) => {return medication.data()});
}

export const getUserMedicationTimes = async (userId: string) => {
    try {
        const userSettingsRef = doc(db, 'users', userId, 'settings', 'medications');
        const docSnap = await getDoc(userSettingsRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return [data.morningTime, data.afternoonTime, data.eveningTime]
        } else {
            console.log('No such document, returning defaults');
            return ['08:00', '12:00', '18:00'] // default times
        }
    } catch (error) {
        console.error('Error getting medication times:', error);
        return null;
    }
}

export const saveMedication = async (userId: string, medication: any) => {
    try {
        const medicationsRef = collection(db, 'users', userId, 'medications');
        const docRef = await addDoc(medicationsRef, medication);
        return docRef.id;
    } catch (error) {
        console.error('Error saving medication:', error);
        return null;
    }
};

export const updateMedication = async (userId: string, medicationId: string, medication: any) => {
    try {
        const medicationRef = doc(db, 'users', userId, 'medications', medicationId);
        await updateDoc(medicationRef, medication);
        return true;
    } catch (error) {
        console.error('Error updating medication:', error);
        return false;
    }
};

export const deleteMedication = async (userId: string, medicationId: string) => {
    try {
        const medicationRef = doc(db, 'users', userId, 'medications', medicationId);
        await deleteDoc(medicationRef);
        return true;
    } catch (error) {
        console.error('Error deleting medication:', error);
        return false;
    }
};

export const logMedicationAdherence = async (userId: string, info: any) => {
    try {
        const logRef = collection(db, 'users', userId, 'appointments');
        const data = {
            ...info,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }
        const docRef = await addDoc(logRef, data);
        return docRef.id;
    } catch (error) {
        console.error('Error logging medication adherence:', error);
        return null;
    }
}