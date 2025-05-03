export const theme = {
    colours: {
        buttonBlue: "#3D5A80",
        blue0: "#293241",
        blue20: "#3D5A80",
        blue50: "#255EAA",
        blue80: "#98C1D9",
        blue99: "#E0FBFC",
        paleBlue: "#a0c4ff",

        primary: "#6495ED",
        primaryLight75: "#83AAEF",
        primaryLight50: "#A2BFF2",
        primaryLight25: "#C1D4F6",

        // Keep orange as attention color
        accentOrange: "#EE6C4D",
        accentOrangeLight75: "#F1876C",
        accentOrangeLight50: "#F5A18D",
        accentOrangeLight25: "#FACCC1",

        blueGray: "#c7e7e8",
        darkBlueGray: "#5b697a",
        white: "#FFFFFF",
        black: "#000000",
        lightGray: "#B2BEB5",
        gray: "#818589",
        gray0: "#000000",
        gray20: "#666666",
        gray50: "#7F7F7F",
        gray60: "#a0a0a0",
        gray80: "#CCCCCC",
        gray90: "#E6E6E6",
        gray99: "#F2F2F2",
        gray100: "#FFFFFF",

        red: "#ff4d4d",

        // Status colors using blue and primary palette
        success: "#4CAF50",      // Green for success states
        successLight: "#E8F5E9", // Light background for success
        warning: "#FF9800",      // Orange for warnings
        warningLight: "#FFF3E0", // Light background for warnings
        danger: "#EE6C4D",       // Using accent orange for danger buttons
        darkDanger: "#8B0000",   // Dark red for critical errors
        error: "#EE6C4D",        // Using accent orange for errors/alerts
        errorLight: "#FACCC1",   // Using accentOrangeLight25 for error backgrounds
        purple: "#5D3FD3",

        // Surface and text colors
        background: "#E0FBFC",   // blue99 as the main background
        surface: "#FFFFFF",      // White surface for cards, etc.
        header: "#3D5A80",       // blue20 for headers
        textOnPrimary: "#FFFFFF", // Text on primary color
        textOnBlue: "#FFFFFF",   // Text on blue colors
        textPrimary: "#293241",  // Primary text
        textSecondary: "#3D5A80", // Secondary text

        // UI element colors
        border: "#98C1D9",       // blue80 as border color
        divider: "#98C1D9",      // blue80 for dividers

        // Calendar and chart colors
        calendar: {
            today: "#6495ED",     // Primary for today's date
            selected: "#3D5A80",  // Blue20 for selected date
            appointment: "#98C1D9", // Blue80 for appointment indicators
        },

        chart: {
            line1: "#6495ED",     // Primary
            line2: "#EE6C4D",     // Accent Orange
            line3: "#98C1D9",     // Blue80
            line4: "#F5A18D",     // AccentOrangeLight50
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