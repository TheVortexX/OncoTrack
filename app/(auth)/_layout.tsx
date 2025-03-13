import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function AuthLayout() {
    return(
        <View style={styles.container}>
            <Stack 
                screenOptions={{headerShown: false}}
                initialRouteName="index"
            >
                <Stack.Screen name="index" options={{title: "Welcome"}} />
                <Stack.Screen name="login" options={{title: "Log in"}} />
                <Stack.Screen name="register" options={{title: "Create account"}} />
                <Stack.Screen name="registerDetails" options={{ title: "Profile Details" }} />
                <Stack.Screen name="forgot" options={{title: "Forgot Password"}} />
            </Stack>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    }
})