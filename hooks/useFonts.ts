import { useFonts as useExpoFonts, OpenSans_400Regular, OpenSans_600SemiBold, OpenSans_700Bold } from "@expo-google-fonts/open-sans";
import { Roboto_500Medium, Roboto_400Regular } from "@expo-google-fonts/roboto";
import {Ubuntu_400Regular, Ubuntu_700Bold} from "@expo-google-fonts/ubuntu";

export function useFonts() {
    const [loaded] = useExpoFonts({
        OpenSans_400Regular,
        OpenSans_600SemiBold,
        OpenSans_700Bold,
        Roboto_500Medium,
        Roboto_400Regular,
        Ubuntu_400Regular,
        Ubuntu_700Bold,
    });

    return { fontsLoaded: loaded };
}