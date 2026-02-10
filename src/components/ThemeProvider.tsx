import { useEffect, useState } from "react";
import { Theme, ThemeProviderContext } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    const { toast } = useToast();
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );

    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);

    // Initial hydration and auth check
    useEffect(() => {
        setMounted(true);

        const fetchUserTheme = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('theme')
                    .eq('user_id', session.user.id)
                    .single();

                if (data?.theme && data.theme !== theme) {
                    setTheme(data.theme as Theme);
                    localStorage.setItem(storageKey, data.theme);
                }
            }
        };

        fetchUserTheme();

        // Listen for auth changes to sync theme
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('theme')
                    .eq('user_id', session.user.id)
                    .single();

                if (data?.theme) {
                    setTheme(data.theme as Theme);
                    localStorage.setItem(storageKey, data.theme);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const reducedMotion = localStorage.getItem("reduced_motion") === "true";
        if (reducedMotion) {
            document.documentElement.classList.add("reduced-motion");
        } else {
            document.documentElement.classList.remove("reduced-motion");
        }
    }, [mounted]);

    useEffect(() => {
        if (!mounted) return;

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
            setResolvedTheme(resolved === "light" ? "light" : "dark");

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
    }, [theme, mounted]);

    const handleSetTheme = async (newTheme: Theme) => {
        // Optimistic update
        localStorage.setItem(storageKey, newTheme);
        setTheme(newTheme);

        // Sync with Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { error } = await supabase
                .from('profiles')
                .update({ theme: newTheme })
                .eq('user_id', session.user.id);

            if (error) {
                console.error("Failed to sync theme:", error);
                toast({
                    title: "Theme Sync Failed",
                    description: "Could not save your theme preference to the cloud.",
                    variant: "destructive",
                });
            }
        }
    };

    const value = {
        theme,
        setTheme: handleSetTheme,
        resolvedTheme,
    };

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}
