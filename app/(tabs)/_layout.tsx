import NavBar from "@/components/navbar";
import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <NavBar />
    </>
  );
}