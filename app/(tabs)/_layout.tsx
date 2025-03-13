import NavBar from "@/components/navbar";
import { Stack } from "expo-router";

export default function MainLayout() {  
  return (
    <>
      <Stack screenOptions= {{headerShown: false}} />
      <NavBar />
    </>
  )
}
