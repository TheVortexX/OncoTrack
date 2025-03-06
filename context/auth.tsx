import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

type AuthContextType = {
    user: { token: string} | null;
    loading: boolean;
    setToken: (token: string) => Promise<void>;
    authenticateToken: (token: string) => Promise<boolean>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ token: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    const publicRoutes = ['/_sitemap'];

    useEffect(() => {
        if (loading) return;
        const inAuthFlow = segments[0] === '(auth)';
        const currentRoute = `/${segments.join('/')}`;
        console.log('currentRoute: ', currentRoute);

        if (!user && !inAuthFlow && !publicRoutes.includes(currentRoute)) { // User is not authenticated and not in the auth flow or public route
            router.replace('/(auth)');
        } else if (user && inAuthFlow) { // User is authenticated and in the auth flow
            router.replace('/(tabs)');
        }
    }, [loading, user, segments]);

    const setToken = async (token: string) => {
        await SecureStore.setItemAsync('userToken', token);
        setUser({ token });
    };

    const authenticateToken = async (token: string) => {
        setLoading(true);
        try {
            const response = await fetch('https://api.example.com/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (response.ok) {
                setUser({ token });
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error authenticating token: ', error);
            return false;
        }
    }

    const signOut = async () => {
        await SecureStore.deleteItemAsync('userToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, setToken, authenticateToken, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}