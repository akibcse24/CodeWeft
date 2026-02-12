import { createContext, useContext, useState, ReactNode } from "react";

interface FocusContextType {
    isFocusMode: boolean;
    setFocusMode: (value: boolean) => void;
    toggleFocusMode: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: ReactNode }) {
    const [isFocusMode, setFocusMode] = useState(false);

    const toggleFocusMode = () => setFocusMode((prev) => !prev);

    return (
        <FocusContext.Provider value={{ isFocusMode, setFocusMode, toggleFocusMode }}>
            {children}
        </FocusContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFocusMode() {
    const context = useContext(FocusContext);
    if (context === undefined) {
        throw new Error("useFocusMode must be used within a FocusProvider");
    }
    return context;
}
