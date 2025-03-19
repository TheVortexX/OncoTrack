import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { collection, getDocs, query, where, addDoc, orderBy } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';

// Type definitions
export type EmergencyContact = {
    id: string;
    name: string;
    number: string;
    description: string;
    style?: any;
    createdAt?: Date;
};

type EmergencyContactsContextType = {
    contacts: EmergencyContact[];
    loading: boolean;
    fetchContacts: () => Promise<void>;
    addContact: (contact: { name: string; number: string; description: string }) => Promise<boolean>;
    refreshContacts: () => void;
};

// Default contacts
const defaultContacts: EmergencyContact[] = [
    {
        id: 'emergency-services',
        name: 'Emergency Services',
        number: '999',
        description: 'Ambulance, Police, Fire',
        style: {
            contactCard: {
                backgroundColor: theme.colours.primaryLight25,
            },
            name: {
                color: theme.colours.primary,
            },
        },
    },
];

const EmergencyContactsContext = createContext<EmergencyContactsContextType | undefined>(undefined);


export const EmergencyContactsProvider = ({ children }: {children: React.ReactNode}) => {
    const { user } = useAuth();
    const userId = user?.uid || null;

    const [contacts, setContacts] = useState<EmergencyContact[]>(defaultContacts);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const fetchContacts = useCallback(async () => {
        if (!userId) return;
        if (hasFetched) return;
        setLoading(true);
        console.log('Fetching contacts...');
        try {
            const contactRef = collection(firestore, 'contacts');
            const q = query(contactRef, where('userId', '==', userId));
            const snapshot = await getDocs(q);
            setHasFetched(true);

            snapshot as any;
            const usersContacts: EmergencyContact[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                usersContacts.push({
                    id: doc.id,
                    name: data.name,
                    number: data.number,
                    description: data.description,
                    createdAt: data.createdAt.toDate()
                });
            });

            usersContacts.sort((a, b) => {
                return (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime();
            });

            setContacts([...defaultContacts, ...usersContacts]);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            setHasFetched(false);
            Alert.alert('Error', 'Failed to fetch contacts. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const refreshContacts = () => {
        setHasFetched(false);
    };

    const addContact = async (contact: {
        name: string;
        number: string;
        description: string;
    }) => {
        if (!userId) return false;

        try {
            const docref = await addDoc(collection(firestore, 'contacts'), {
                ...contact,
                userId,
                createdAt: new Date()
            });

            const newContact: EmergencyContact = {
                id: docref.id,
                ...contact
            };

            setContacts(prev => [...prev, newContact]);
            return true;
        } catch (error) {
            console.error('Error adding contact:', error);
            return false;
        }
    };

    useEffect(() => {
        if (!hasFetched) {
            fetchContacts();
        }
    }, [hasFetched, fetchContacts]);

    useEffect(() => {
        setHasFetched(false);
    }, [userId]);

    const value = {
        contacts,
        loading,
        fetchContacts,
        addContact,
        refreshContacts
    };

    return (
        <EmergencyContactsContext.Provider value={value}>
            {children}
        </EmergencyContactsContext.Provider>
    );
};

export const useEmergencyContacts = () => {
    const context = useContext(EmergencyContactsContext);
    if (context === undefined) {
        throw new Error('useEmergencyContacts must be used within an EmergencyContactsProvider');
    }
    return context;
};