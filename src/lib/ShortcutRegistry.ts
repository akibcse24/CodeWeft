
export interface Shortcut {
    id: string;
    label: string;
    fullLabel?: string;
    keys: string; // Display string, e.g. "Ctrl+D"
    keyBinding: {
        key: string;
        ctrlKey?: boolean;
        metaKey?: boolean;
        shiftKey?: boolean;
        altKey?: boolean;
    };
    description: string;
}

export const EDITOR_SHORTCUTS: Record<string, Shortcut> = {
    DUPLICATE: {
        id: 'duplicate',
        label: 'Duplicate',
        keys: 'Ctrl+D',
        keyBinding: { key: 'd', ctrlKey: true, metaKey: true }, // supports both
        description: 'Duplicate selection'
    },
    DELETE: {
        id: 'delete',
        label: 'Delete',
        keys: 'Del',
        keyBinding: { key: 'Delete' },
        description: 'Delete selection'
    },
    COPY_LINK: {
        id: 'copyLink',
        label: 'Copy Link',
        keys: 'Alt+Shift+L',
        keyBinding: { key: 'l', altKey: true, shiftKey: true },
        description: 'Copy link to block'
    },
    ASK_AI: {
        id: 'askAI',
        label: 'Ask AI',
        keys: 'Ctrl+J',
        keyBinding: { key: 'j', ctrlKey: true, metaKey: true },
        description: 'Ask AI to edit or generate text'
    },
    BOLD: {
        id: 'bold',
        label: 'Bold',
        keys: 'Ctrl+B',
        keyBinding: { key: 'b', ctrlKey: true, metaKey: true },
        description: 'Toggle bold'
    },
    ITALIC: {
        id: 'italic',
        label: 'Italic',
        keys: 'Ctrl+I',
        keyBinding: { key: 'i', ctrlKey: true, metaKey: true },
        description: 'Toggle italic'
    },
    UNDERLINE: {
        id: 'underline',
        label: 'Underline',
        keys: 'Ctrl+U',
        keyBinding: { key: 'u', ctrlKey: true, metaKey: true },
        description: 'Toggle underline'
    },
    TURN_INTO_TEXT: {
        id: 'turnIntoText',
        label: 'Turn into Text',
        fullLabel: 'Turn into Text',
        keys: 'Ctrl+Alt+0',
        keyBinding: { key: '0', ctrlKey: true, altKey: true },
        description: 'Turn block into paragraph'
    },
    TURN_INTO_H1: {
        id: 'turnIntoH1',
        label: 'Turn into H1',
        fullLabel: 'Turn into Heading 1',
        keys: 'Ctrl+Alt+1',
        keyBinding: { key: '1', ctrlKey: true, altKey: true },
        description: 'Turn block into Heading 1'
    },
    TURN_INTO_H2: {
        id: 'turnIntoH2',
        label: 'Turn into H2',
        fullLabel: 'Turn into Heading 2',
        keys: 'Ctrl+Alt+2',
        keyBinding: { key: '2', ctrlKey: true, altKey: true },
        description: 'Turn block into Heading 2'
    },
    TURN_INTO_H3: {
        id: 'turnIntoH3',
        label: 'Turn into H3',
        fullLabel: 'Turn into Heading 3',
        keys: 'Ctrl+Alt+3',
        keyBinding: { key: '3', ctrlKey: true, altKey: true },
        description: 'Turn block into Heading 3'
    },
    TURN_INTO_TODO: {
        id: 'turnIntoTodo',
        label: 'Turn into Checkbox',
        fullLabel: 'Turn into To-do List',
        keys: 'Ctrl+Alt+4',
        keyBinding: { key: '4', ctrlKey: true, altKey: true },
        description: 'Turn block into checkbox'
    },
    TURN_INTO_BULLET: {
        id: 'turnIntoBullet',
        label: 'Turn into Bullet List',
        fullLabel: 'Turn into Bulleted List',
        keys: 'Ctrl+Alt+5',
        keyBinding: { key: '5', ctrlKey: true, altKey: true },
        description: 'Turn block into bullet list'
    },
    TURN_INTO_NUMBER: {
        id: 'turnIntoNumber',
        label: 'Turn into Number List',
        fullLabel: 'Turn into Numbered List',
        keys: 'Ctrl+Alt+6',
        keyBinding: { key: '6', ctrlKey: true, altKey: true },
        description: 'Turn block into numbered list'
    },
    TURN_INTO_TOGGLE: {
        id: 'turnIntoToggle',
        label: 'Turn into Toggle',
        fullLabel: 'Turn into Toggle List',
        keys: 'Ctrl+Alt+7',
        keyBinding: { key: '7', ctrlKey: true, altKey: true },
        description: 'Turn block into toggle list'
    },
    TURN_INTO_CODE: {
        id: 'turnIntoCode',
        label: 'Turn into Code',
        fullLabel: 'Turn into Code Block',
        keys: 'Ctrl+Alt+8',
        keyBinding: { key: '8', ctrlKey: true, altKey: true },
        description: 'Turn block into code block'
    },
    TURN_INTO_QUOTE: {
        id: 'turnIntoQuote',
        label: 'Turn into Quote',
        fullLabel: 'Turn into Quote',
        keys: 'Ctrl+Alt+9',
        keyBinding: { key: '9', ctrlKey: true, altKey: true },
        description: 'Turn block into quote'
    },
    QUICK_FIND: {
        id: 'quickFind',
        label: 'Quick Find',
        fullLabel: 'Quick Find',
        keys: 'Ctrl+P',
        keyBinding: { key: 'p', ctrlKey: true, metaKey: true },
        description: 'Open quick find to search pages'
    },
    INLINE_CODE: {
        id: 'inlineCode',
        label: 'Inline Code',
        keys: 'Ctrl+E',
        keyBinding: { key: 'e', ctrlKey: true, metaKey: true },
        description: 'Toggle inline code'
    },
    ADD_LINK: {
        id: 'addLink',
        label: 'Add Link',
        keys: 'Ctrl+K',
        keyBinding: { key: 'k', ctrlKey: true, metaKey: true },
        description: 'Add or edit link'
    },
    SLASH_MENU: {
        id: 'slashMenu',
        label: 'Slash Menu',
        keys: 'Ctrl+/',
        keyBinding: { key: '/', ctrlKey: true, metaKey: true },
        description: 'Open block type menu'
    },
    MOVE_UP: {
        id: 'moveUp',
        label: 'Move Up',
        keys: 'Alt+↑',
        keyBinding: { key: 'ArrowUp', altKey: true },
        description: 'Move block up'
    },
    MOVE_DOWN: {
        id: 'moveDown',
        label: 'Move Down',
        keys: 'Alt+↓',
        keyBinding: { key: 'ArrowDown', altKey: true },
        description: 'Move block down'
    },
    UNDO: {
        id: 'undo',
        label: 'Undo',
        keys: 'Ctrl+Z',
        keyBinding: { key: 'z', ctrlKey: true, metaKey: true },
        description: 'Undo last action'
    },
    REDO: {
        id: 'redo',
        label: 'Redo',
        keys: 'Ctrl+Shift+Z',
        keyBinding: { key: 'z', ctrlKey: true, metaKey: true, shiftKey: true },
        description: 'Redo last undone action'
    },
    SELECT_ALL: {
        id: 'selectAll',
        label: 'Select All',
        keys: 'Ctrl+A',
        keyBinding: { key: 'a', ctrlKey: true, metaKey: true },
        description: 'Select all blocks or text'
    },
    INDENT: {
        id: 'indent',
        label: 'Indent',
        keys: 'Tab',
        keyBinding: { key: 'Tab' },
        description: 'Indent block'
    },
    OUTDENT: {
        id: 'outdent',
        label: 'Outdent',
        keys: 'Shift+Tab',
        keyBinding: { key: 'Tab', shiftKey: true },
        description: 'Outdent block'
    },
};

export function matchesShortcut(e: React.KeyboardEvent, shortcut: Shortcut): boolean {
    if (e.key.toLowerCase() !== shortcut.keyBinding.key.toLowerCase()) return false;
    if (!!shortcut.keyBinding.ctrlKey !== (e.ctrlKey || e.metaKey)) return false; // Treat meta as ctrl for Mac
    if (!!shortcut.keyBinding.shiftKey !== e.shiftKey) return false;
    if (!!shortcut.keyBinding.altKey !== e.altKey) return false;
    return true;
}
