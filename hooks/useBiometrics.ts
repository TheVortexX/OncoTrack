import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/auth';
import { useRouter } from 'expo-router';

export default function useBiometrics() {
    const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { autenticateToken } = useAuth();
    const router = useRouter();


    useEffect(() => {
        const checkBiometricSupport = async () => {
            const token = await SecureStore.getItemAsync('userToken');
            if (token) {
                setIsLoading(true);
                const compatible = await LocalAuthentication.hasHardwareAsync();
                const usable = await LocalAuthentication.isEnrolledAsync();
                setIsBiometricsAvailable(compatible && usable);
                setIsLoading(false);
            }
        }
        checkBiometricSupport();
    }, []);

    const attemptBiometricLogin = async (selected:boolean = false) => {
        if (isBiometricsAvailable || selected) {
            try {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Login to OncoTrack',
                    cancelLabel: 'Use password instead',
                });
                setIsLoading(true);
                if (result.success) {
                    const token = await SecureStore.getItemAsync('userToken');
                    if (token) {
                        const authSuccess = await autenticateToken(token);
                        if (authSuccess) {
                            router.replace('/(tabs)');
                        }
                    }
                }
            } catch (error) {
                console.error('Error authenticating with biometrics: ', error);
            } finally {
                setIsLoading(false);
                if (selected) {
                    router.push('/(auth)/login');
                }
            }
        } else if (selected) {
            console.log('Biometrics not available');
            router.push('/(auth)/login');
        }
    }
    return { isLoading, attemptBiometricLogin}
}