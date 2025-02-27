import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

type AuthContextType = {
    user: { token: string} | null;
    loading: boolean;
    setToken: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ token: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const segments = useSegments();
    const router = useRouter();

    const publicRoutes = ['/_sitemap'];

    useEffect(() => { 
        const checkAuth = async () => {
            try {
                const userToken = await SecureStore.getItemAsync('userToken');
                setUser(userToken ? { token: userToken } : null);
            } catch (error) {
                console.error('Error checking user authentication: ', error);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

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

    const signOut = async () => {
        await SecureStore.deleteItemAsync('userToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, setToken, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}