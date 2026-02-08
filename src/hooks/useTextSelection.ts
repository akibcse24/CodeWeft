import { useState, useEffect, useCallback } from 'react';

interface SelectionState {
    text: string;
    position: { x: number; y: number } | null;
    isVisible: boolean;
    range: Range | null;
}

export function useTextSelection(containerRef: React.RefObject<HTMLElement>) {
    const [selection, setSelection] = useState<SelectionState>({
        text: '',
        position: null,
        isVisible: false,
        range: null,
    });

    const handleSelectionChange = useCallback(() => {
        const activeSelection = window.getSelection();

        // Basic validation
        if (
            !activeSelection ||
            activeSelection.isCollapsed ||
            !activeSelection.rangeCount ||
            !containerRef.current
        ) {
            setSelection({ text: '', position: null, isVisible: false, range: null });
            return;
        }

        const range = activeSelection.getRangeAt(0);
        const text = activeSelection.toString().trim();

        // Check if selection is within our container
        if (!containerRef.current.contains(range.commonAncestorContainer) &&
            range.commonAncestorContainer !== containerRef.current) {
            // Allow if it partially intersects or is inside
            // But for safety, let's strict check if the anchor node is inside
            if (!containerRef.current.contains(activeSelection.anchorNode)) {
                return;
            }
        }

        if (!text) {
            setSelection({ text: '', position: null, isVisible: false, range: null });
            return;
        }

        // Calculate position (centered above selection)
        const rect = range.getBoundingClientRect();
        const position = {
            x: rect.left + rect.width / 2 - 250, // Center the 500px wide menu (approx)
            y: rect.top - 60, // Position above
        };

        // Ensure it doesn't go off screen
        position.x = Math.max(10, Math.min(window.innerWidth - 510, position.x));
        position.y = Math.max(10, position.y + window.scrollY);

        setSelection({
            text,
            position,
            isVisible: true,
            range,
        });
    }, [containerRef]);

    useEffect(() => {
        document.addEventListener('selectionchange', handleSelectionChange);
        // Also listen to mouseup/keyup for more immediate updates
        document.addEventListener('mouseup', handleSelectionChange);
        document.addEventListener('keyup', handleSelectionChange);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('mouseup', handleSelectionChange);
            document.removeEventListener('keyup', handleSelectionChange);
        };
    }, [handleSelectionChange]);

    const clearSelection = useCallback(() => {
        const activeSelection = window.getSelection();
        if (activeSelection) {
            activeSelection.removeAllRanges();
        }
        setSelection({ text: '', position: null, isVisible: false, range: null });
    }, []);

    return { ...selection, clearSelection };
}
