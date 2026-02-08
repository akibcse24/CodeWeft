import { useEffect, useState } from "react";
import { Theme, ThemeProviderContext } from "@/hooks/use-theme";

type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );

    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

    useEffect(() => {
        const reducedMotion = localStorage.getItem("reduced_motion") === "true";
        if (reducedMotion) {
            document.documentElement.classList.add("reduced-motion");
        } else {
            document.documentElement.classList.remove("reduced-motion");
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const getResolvedTheme = (): string => {
            if (theme === "system") {
                return mediaQuery.matches ? "dark" : "light";
            }
            return theme;
        };

        const updateTheme = () => {
            const resolved = getResolvedTheme();
            // Default query for "dark" mode if the theme is "dark" or "cyberpunk" or "professional" (assuming they are dark based)
            // But actually, the CSS variables handle the colors. We just need to ensure the class is present.
            // For system consistency, we might want to check if the theme is "dark-subvariant".
            // Here we simply apply the class.

            // Set resolved theme for UI consumers
            setResolvedTheme(resolved === "light" ? "light" : "dark"); // This might be simplistic for other themes

            root.classList.remove("light", "dark", "cyberpunk", "professional", "nature");
            root.classList.add(resolved);
        };

        updateTheme();

        const handleChange = () => {
            if (theme === "system") {
                updateTheme();
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
        },
        resolvedTheme,
    };

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}
