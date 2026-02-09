import React, { useCallback, useRef } from 'react';

// Mobile swipe gesture hook for navigating between blocks
export function useSwipeNavigation(
    blocks: Array<{ id: string }>, 
    currentBlockId: string | null, 
    onNavigate: (id: string) => void
) {
    const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
    const MIN_SWIPE_DISTANCE = 50;
    const MAX_SWIPE_TIME = 300;
    
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now(),
        };
    }, []);
    
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const time = Date.now() - touchStartRef.current.time;
        
        // Check if it's a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && 
            Math.abs(deltaX) > MIN_SWIPE_DISTANCE && 
            time < MAX_SWIPE_TIME) {
            
            const currentIndex = blocks.findIndex(b => b.id === currentBlockId);
            
            if (deltaX > 0 && currentIndex > 0) {
                // Swipe right - go to previous block
                onNavigate(blocks[currentIndex - 1].id);
            } else if (deltaX < 0 && currentIndex < blocks.length - 1) {
                // Swipe left - go to next block
                onNavigate(blocks[currentIndex + 1].id);
            }
        }
        
        touchStartRef.current = null;
    }, [blocks, currentBlockId, onNavigate]);
    
    return {
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
    };
}

// Rich text formatting utilities (for use with contentEditable)
export const TextFormat = {
    bold: () => document.execCommand('bold'),
    italic: () => document.execCommand('italic'),
    underline: () => document.execCommand('underline'),
    strikethrough: () => document.execCommand('strikeThrough'),
    code: () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            const code = document.createElement('code');
            code.textContent = selectedText;
            range.deleteContents();
            range.insertNode(code);
        }
    },
    subscript: () => document.execCommand('subscript'),
    superscript: () => document.execCommand('superscript'),
    heading1: () => document.execCommand('formatBlock', false, 'h1'),
    heading2: () => document.execCommand('formatBlock', false, 'h2'),
    heading3: () => document.execCommand('formatBlock', false, 'h3'),
    paragraph: () => document.execCommand('formatBlock', false, 'p'),
    quote: () => document.execCommand('formatBlock', false, 'blockquote'),
    bulletList: () => document.execCommand('insertUnorderedList'),
    numberedList: () => document.execCommand('insertOrderedList'),
    leftAlign: () => document.execCommand('justifyLeft'),
    centerAlign: () => document.execCommand('justifyCenter'),
    rightAlign: () => document.execCommand('justifyRight'),
    justify: () => document.execCommand('justifyFull'),
    link: (url: string) => document.execCommand('createLink', false, url),
    unlink: () => document.execCommand('unlink'),
};

// Keyboard shortcut handler for text formatting
export function useTextFormattingShortcuts(
    onFormat: (format: string) => void
) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const isMod = e.metaKey || e.ctrlKey;
        
        if (isMod && e.key === 'b') {
            e.preventDefault();
            onFormat('bold');
        } else if (isMod && e.key === 'i') {
            e.preventDefault();
            onFormat('italic');
        } else if (isMod && e.key === 'u') {
            e.preventDefault();
            onFormat('underline');
        } else if (isMod && e.shiftKey && e.key === 's') {
            e.preventDefault();
            onFormat('strikethrough');
        } else if (isMod && e.key === 'e') {
            e.preventDefault();
            onFormat('code');
        } else if (isMod && e.key === '\\') {
            e.preventDefault();
            onFormat('subscript');
        } else if (isMod && e.key === '=') {
            e.preventDefault();
            onFormat('superscript');
        }
    }, [onFormat]);
    
    return handleKeyDown;
}

// Hook to track active formatting
export function useActiveFormats() {
    const [formats, setFormats] = React.useState<Set<string>>(new Set());
    
    React.useEffect(() => {
        const updateFormats = () => {
            const newFormats = new Set<string>();
            if (document.queryCommandState('bold')) newFormats.add('bold');
            if (document.queryCommandState('italic')) newFormats.add('italic');
            if (document.queryCommandState('underline')) newFormats.add('underline');
            if (document.queryCommandState('strikeThrough')) newFormats.add('strikethrough');
            if (document.queryCommandState('subscript')) newFormats.add('subscript');
            if (document.queryCommandState('superscript')) newFormats.add('superscript');
            setFormats(newFormats);
        };
        
        document.addEventListener('selectionchange', updateFormats);
        return () => document.removeEventListener('selectionchange', updateFormats);
    }, []);
    
    return formats;
}
