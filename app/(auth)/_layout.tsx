import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function AuthLayout() {
    return(
        <View style={styles.container}>
            <Stack 
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
                initialRouteName="index"
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    }
})