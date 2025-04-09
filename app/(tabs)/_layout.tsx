import NavBar from "@/components/navbar";
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
        >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
          />
        <Tabs.Screen
          name="track"
          options={{
            title: "Track",
            tabBarIcon: ({ color }) => <Ionicons name="analytics" size={24} color={color} />,
          }}
          />
        <Tabs.Screen
          name="schedule"
          options={{
            title: "Schedule",
            tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
          }}
          />
        <Tabs.Screen
          name="reports"
          options={{
            title: "Reports",
            tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />,
          }}
          />
        <Tabs.Screen
          name="account"
          options={{
            title: "Account",
            tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
          }}
          />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
          }}
          />
        <Tabs.Screen
          name="emergencyContacts"
          options={{
            title: "Emergency",
            tabBarIcon: ({ color }) => <Ionicons name="alert-circle" size={24} color={color} />,
            href: null, // Hide this tab from the tab bar if you want
          }}
          />
      </Tabs>
      <NavBar />
    </>
  );
}