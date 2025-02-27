import { useCallback, useEffect} from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../context/auth';
import { useFonts } from '../hooks/useFonts';
import { theme } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { fontsLoaded } = useFonts();

  const onFinishDraw = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onFinishDraw}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Slot />
      </AuthProvider>
    </SafeAreaProvider>
  );
}