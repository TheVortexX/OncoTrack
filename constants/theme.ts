export const theme = {
    colours: {
        // Existing colors
        buttonBlue: "#3D5A80",
        blue0: "#293241",
        blue20: "#3D5A80",
        blue50: "#255EAA",
        blue80: "#98C1D9",
        blue99: "#E0FBFC",
        primary: "#EE6C4D",
        primaryLight75: "#F1876C",
        primaryLight50: "#F5A18D",
        primaryLight25: "#FACCC1",
        white: "#FFFFFF",
        black: "#000000",
        lightGray: "#B2BEB5",
        gray: "#818589",
        gray0: "#000000",
        gray20: "#666666",
        gray50: "#F0F0F0",
        gray80: "#F5F5F5",
        gray99: "#FAFAFA",
        gray100: "#FFFFFF",

        // Status colors using blue and primary palette
        success: "#4CAF50",      // Green for success states
        successLight: "#E8F5E9", // Light background for success
        warning: "#FF9800",      // Orange for warnings
        warningLight: "#FFF3E0", // Light background for warnings
        danger: "#EE6C4D",        // Using primary for danger buttons
        darkDanger: "#8B0000", // Dark red for critical errors
        error: "#EE6C4D",        // Using primary for errors/alerts
        errorLight: "#FACCC1",   // Using primaryLight25 for error backgrounds
        purple: "#5D3FD3",

        // Surface and text colors
        background: "#E0FBFC",   // blue99 as the main background
        surface: "#FFFFFF",      // White surface for cards, etc.
        textOnPrimary: "#FFFFFF", // Text on primary color
        textOnBlue: "#FFFFFF",   // Text on blue colors
        textPrimary: "#293241",  // Primary text
        textSecondary: "#3D5A80", // Secondary text

        // UI element colors
        border: "#98C1D9",       // blue80 as border color
        divider: "#98C1D9",      // blue80 for dividers

        // Calendar and chart colors
        calendar: {
            today: "#EE6C4D",     // Primary for today's date
            selected: "#3D5A80",  // Blue20 for selected date
            appointment: "#98C1D9", // Blue80 for appointment indicators
        },

        chart: {
            line1: "#3D5A80",     // Blue20
            line2: "#EE6C4D",     // Primary
            line3: "#98C1D9",     // Blue80
            line4: "#F5A18D",     // PrimaryLight50
            line5: "#255EAA",     // Blue50
        }
    },
    fonts: {
        openSans: {
            regular: "OpenSans_400Regular",
            semiBold: "OpenSans_600SemiBold",
            bold: "OpenSans_700Bold",
        },
        roboto: {
            regular: "Roboto_400Regular",
            medium: "Roboto_500Medium",
        },
        ubuntu: {
            regular: "Ubuntu_400Regular",
            bold: "Ubuntu_700Bold",
        }
    },
}