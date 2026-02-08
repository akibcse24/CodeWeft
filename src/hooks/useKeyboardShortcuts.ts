import { useEffect, useCallback, useRef } from 'react';
import { KeyboardShortcut } from '@/types/editor.types';

interface UseKeyboardShortcutsOptions {
    shortcuts: KeyboardShortcut[];
    enabled?: boolean;
}

export const useKeyboardShortcuts = ({
    shortcuts,
    enabled = true,
}: UseKeyboardShortcutsOptions) => {
    const shortcutsRef = useRef(shortcuts);

    // Update shortcuts ref when they change
    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return;

        // Check each shortcut
        for (const shortcut of shortcutsRef.current) {
            const modifiersMatch = checkModifiers(event, shortcut.modifiers);
            const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();

            if (modifiersMatch && keyMatches) {
                event.preventDefault();
                event.stopPropagation();
                shortcut.action();
                break;
            }
        }
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown, enabled]);

    return null;
};

// Helper function to check if modifiers match
function checkModifiers(
    event: KeyboardEvent,
    modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[]
): boolean {
    const ctrl = modifiers.includes('ctrl') ? event.ctrlKey : !event.ctrlKey;
    const alt = modifiers.includes('alt') ? event.altKey : !event.altKey;
    const shift = modifiers.includes('shift') ? event.shiftKey : !event.shiftKey;
    const meta = modifiers.includes('meta') ? event.metaKey : !event.metaKey;

    return ctrl && alt && shift && meta;
}

// Predefined keyboard shortcuts
export const createEditorShortcuts = (handlers: {
    onDuplicate?: () => void;
    onDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onCaption?: () => void;
    onMoveTo?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onSuggestEdits?: () => void;
    onAskAI?: () => void;
    onCopyLink?: () => void;
}): KeyboardShortcut[] => {
    return [
        // Undo
        {
            key: 'z',
            modifiers: ['ctrl'],
            description: 'Undo',
            action: handlers.onUndo || (() => { }),
        },
        // Redo
        {
            key: 'y',
            modifiers: ['ctrl'],
            description: 'Redo',
            action: handlers.onRedo || (() => { }),
        },
        // Duplicate
        {
            key: 'd',
            modifiers: ['ctrl'],
            description: 'Duplicate block',
            action: handlers.onDuplicate || (() => { }),
        },
        // Delete
        {
            key: 'Delete',
            modifiers: [],
            description: 'Delete block',
            action: handlers.onDelete || (() => { }),
        },
        // Caption
        {
            key: 'm',
            modifiers: ['ctrl', 'alt'],
            description: 'Add caption',
            action: handlers.onCaption || (() => { }),
        },
        // Move to
        {
            key: 'p',
            modifiers: ['ctrl', 'shift'],
            description: 'Move to',
            action: handlers.onMoveTo || (() => { }),
        },
        // Suggest edits
        {
            key: 'x',
            modifiers: ['ctrl', 'shift', 'alt'],
            description: 'Suggest edits',
            action: handlers.onSuggestEdits || (() => { }),
        },
        // Ask AI
        {
            key: 'j',
            modifiers: ['ctrl'],
            description: 'Ask AI',
            action: handlers.onAskAI || (() => { }),
        },
        // Move block up
        {
            key: 'ArrowUp',
            modifiers: ['alt'],
            description: 'Move block up',
            action: handlers.onMoveUp || (() => { }),
        },
        // Move block down
        {
            key: 'ArrowDown',
            modifiers: ['alt'],
            description: 'Move block down',
            action: handlers.onMoveDown || (() => { }),
        },
        // Copy link to block
        {
            key: 'l',
            modifiers: ['alt', 'shift'],
            description: 'Copy link to block',
            action: handlers.onCopyLink || (() => { }),
        },
    ];
};
