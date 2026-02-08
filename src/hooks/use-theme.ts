import { createContext, useContext } from "react";

export type Theme = "dark" | "light" | "system" | "cyberpunk" | "professional" | "nature";

export type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme?: "dark" | "light"; // Optional to avoid breaking if not provided immediately
};

export const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export const useTheme = () => {
    const context = useContext(ThemeProviderContext);

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");

    return context;
};

