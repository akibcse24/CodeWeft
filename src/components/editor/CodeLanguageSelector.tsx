import React, { useState, useEffect, useRef } from 'react';
import { Check, Search } from 'lucide-react';
import { SUPPORTED_LANGUAGES, CodeLanguage } from '@/types/editor.types';
import { cn } from '@/lib/utils';

interface CodeLanguageSelectorProps {
    selectedLanguage: string;
    onSelectLanguage: (languageId: string) => void;
    onClose: () => void;
    isOpen: boolean;
}

export const CodeLanguageSelector: React.FC<CodeLanguageSelectorProps> = ({
    selectedLanguage,
    onSelectLanguage,
    onClose,
    isOpen,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const selectedItemRef = useRef<HTMLDivElement>(null);

    // Filter languages based on search query
    const filteredLanguages = React.useMemo(() => {
        if (!searchQuery) return SUPPORTED_LANGUAGES;

        const query = searchQuery.toLowerCase();
        return SUPPORTED_LANGUAGES.filter(
            (lang) =>
                lang.name.toLowerCase().includes(query) ||
                lang.id.toLowerCase().includes(query) ||
                lang.aliases?.some((alias) => alias.toLowerCase().includes(query))
        );
    }, [searchQuery]);

    // Auto-focus search input when opened
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Auto-scroll to selected language
    useEffect(() => {
        if (selectedItemRef.current) {
            selectedItemRef.current.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth',
            });
        }
    }, [selectedIndex]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < filteredLanguages.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredLanguages.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredLanguages[selectedIndex]) {
                        onSelectLanguage(filteredLanguages[selectedIndex].id);
                        onClose();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filteredLanguages, onSelectLanguage, onClose]);

    // Click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[data-language-selector]')) {
                onClose();
            }
        };

        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => document.removeEventListener('click', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            data-language-selector
            className="absolute z-50 mt-2 w-72 rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
        >
            {/* Search Input */}
            <div className="p-2 border-b border-border/50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="search for a language..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSelectedIndex(0);
                        }}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            {/* Language List */}
            <div className="max-h-96 overflow-y-auto p-1">
                {filteredLanguages.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                        No languages found
                    </div>
                ) : (
                    filteredLanguages.map((lang, index) => {
                        const isSelected = lang.id === selectedLanguage;
                        const isFocused = index === selectedIndex;

                        return (
                            <div
                                key={lang.id}
                                ref={isFocused ? selectedItemRef : null}
                                onClick={() => {
                                    onSelectLanguage(lang.id);
                                    onClose();
                                }}
                                className={cn(
                                    'flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors',
                                    isFocused && 'bg-accent',
                                    !isFocused && 'hover:bg-accent/50'
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{lang.name}</span>
                                    {lang.popular && (
                                        <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded">
                                            Popular
                                        </span>
                                    )}
                                </div>
                                {isSelected && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer hint */}
            <div className="p-2 border-t border-border/50 text-xs text-muted-foreground">
                <kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd> to navigate,{' '}
                <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> to select,{' '}
                <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> to close
            </div>
        </div>
    );
};
