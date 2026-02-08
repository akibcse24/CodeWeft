/**
 * CodeEditor Component - Monaco Editor Integration
 * 
 * Features:
 * - Syntax highlighting for all languages
 * - IntelliSense and autocomplete
 * - Keyboard shortcuts (Cmd+S, Cmd+F, etc.)
 * - Theme support (light/dark)
 * - Diff view support
 */

import { useEffect, useRef, useState } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import { useTheme } from "@/hooks/use-theme";
import { Skeleton } from '@/components/ui/skeleton';
import { getLanguageFromFilename } from "@/lib/editor-utils";
// Monaco editor types are provided by @monaco-editor/react

interface CodeEditorProps {
    value: string;
    language?: string;
    onChange?: (value: string | undefined) => void;
    onSave?: (value: string) => void;
    readOnly?: boolean;
    height?: string;
    options?: Record<string, unknown>;
}

export function CodeEditor({
    value,
    language = 'javascript',
    onChange,
    onSave,
    readOnly = false,
    height = '100%',
    options = {},
}: CodeEditorProps) {
    const { theme } = useTheme();
    const editorRef = useRef<unknown>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const [isReady, setIsReady] = useState(false);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        setIsReady(true);

        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            if (onSave) {
                const currentValue = editor.getValue();
                onSave(currentValue);
            }
        });

        // Focus editor
        editor.focus();
    };

    const handleChange = (value: string | undefined) => {
        if (onChange) {
            onChange(value);
        }
    };

    // Configure editor options
    const editorOptions = {
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        readOnly,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        quickSuggestions: true,
        parameterHints: { enabled: true },
        ...options,
    };

    return (
        <div className="w-full h-full relative">
            <Editor
                height={height}
                language={language}
                value={value}
                onChange={handleChange}
                onMount={handleEditorDidMount}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                options={editorOptions}
                loading={
                    <div className="w-full h-full p-4">
                        <Skeleton className="w-full h-8 mb-2" />
                        <Skeleton className="w-3/4 h-8 mb-2" />
                        <Skeleton className="w-full h-8 mb-2" />
                        <Skeleton className="w-2/3 h-8 mb-2" />
                        <Skeleton className="w-full h-8 mb-2" />
                    </div>
                }
            />
        </div>
    );
}

