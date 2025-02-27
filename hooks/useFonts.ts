import { useFonts as useExpoFonts, OpenSans_400Regular, OpenSans_600SemiBold } from "@expo-google-fonts/open-sans";
import { Roboto_500Medium, Roboto_400Regular } from "@expo-google-fonts/roboto";

export function useFonts() {
    const [loaded] = useExpoFonts({
        OpenSans_400Regular,
        OpenSans_600SemiBold,
        Roboto_500Medium,
        Roboto_400Regular
    });

    return { fontsLoaded: loaded };
}