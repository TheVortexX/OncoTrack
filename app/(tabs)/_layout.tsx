import NavBar from "@/components/navbar";
import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <>
      <Stack screenOptions= {{headerShown: false}}>
        <Stack.Screen name="index" options={{title: "Home"}}/>
        <Stack.Screen name="emergencyContacts" options={{title: "EMERGENCY"}} />
        <Stack.Screen name="account" options={{title: "Your account"}} />
        <Stack.Screen name="track" options={{title: "Track symptoms"}} />
        <Stack.Screen name="schedule" options={{title: "Your schedule"}} />
        <Stack.Screen name="reports" options={{title: "Reports"}} />
      </Stack>
      <NavBar/>
    </>
  )
}