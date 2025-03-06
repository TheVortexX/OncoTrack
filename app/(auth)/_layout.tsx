import { Stack } from "expo-router";

export default function AuthLayout() {
    return(
        <Stack 
            screenOptions={{headerShown: false}}
            initialRouteName="index"
        >
            <Stack.Screen name="index" options={{title: "Welcome"}} />
            <Stack.Screen name="login" options={{title: "Log in"}} />
            <Stack.Screen name="register" options={{title: "Create account"}} />
            <Stack.Screen name="forgot" options={{title: "Forgot Password"}} />
        </Stack>
    )
}