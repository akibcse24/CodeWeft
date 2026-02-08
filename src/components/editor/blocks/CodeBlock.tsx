import React, { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { Block } from '@/types/editor.types';
import { CodeLanguageSelector } from '../CodeLanguageSelector';
import { Copy, Check, ChevronDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CodeBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onFocus?: () => void;
    isFocused?: boolean;
}

// Language extensions mapping
const getLanguageExtension = (language: string) => {
    switch (language) {
        case 'javascript':
        case 'jsx':
            return javascript({ jsx: true });
        case 'typescript':
        case 'tsx':
            return javascript({ jsx: true, typescript: true });
        case 'python':
            return python();
        default:
            return javascript();
    }
};

const languageDisplayNames: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    jsx: 'JSX',
    tsx: 'TSX',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    markdown: 'Markdown',
    sql: 'SQL',
    bash: 'Bash',
    plaintext: 'Plain Text',
};

export const CodeBlock: React.FC<CodeBlockProps> = ({
    block,
    onUpdate,
    onFocus,
    isFocused,
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const [showLanguageSelector, setShowLanguageSelector] = useState(false);
    const [showCaption, setShowCaption] = useState(!!block.metadata?.caption);

    const language = (block.metadata?.language as string) || 'javascript';
    const caption = (block.metadata?.caption as string) || '';
    const wrapCode = block.metadata?.wrapCode !== false;

    const handleCodeChange = (value: string) => {
        onUpdate({ content: value });
    };

    const handleLanguageChange = (newLanguage: string) => {
        onUpdate({
            metadata: {
                ...block.metadata,
                language: newLanguage,
            },
        });
        setShowLanguageSelector(false);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(block.content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({
            metadata: {
                ...block.metadata,
                caption: e.target.value,
            },
        });
    };

    const toggleWrap = () => {
        onUpdate({
            metadata: {
                ...block.metadata,
                wrapCode: !wrapCode,
            },
        });
    };

    return (
        <div className="my-2 rounded-lg overflow-hidden bg-[#1e1e1e] dark:bg-[#0d0d0d] border border-[#2d2d2d]">
            {/* Code Editor - Dark theme */}
            <div className="relative group/code">
                <CodeMirror
                    value={block.content}
                    height="auto"
                    minHeight="80px"
                    maxHeight="500px"
                    extensions={[getLanguageExtension(language)]}
                    onChange={handleCodeChange}
                    onFocus={onFocus}
                    className="text-sm [&_.cm-editor]:bg-transparent [&_.cm-gutters]:bg-[#1e1e1e] [&_.cm-gutters]:border-r-0 [&_.cm-activeLineGutter]:bg-[#2d2d2d] [&_.cm-activeLine]:bg-[#2d2d2d]/50"
                    theme="dark"
                    basicSetup={{
                        lineNumbers: true,
                        highlightActiveLineGutter: true,
                        foldGutter: true,
                        dropCursor: true,
                        indentOnInput: true,
                        bracketMatching: true,
                        closeBrackets: true,
                        autocompletion: true,
                        highlightSelectionMatches: true,
                    }}
                />

                {/* Floating toolbar - top right inside code block */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/code:opacity-100 transition-opacity">
                    {/* Language Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#cccccc] transition-colors"
                        >
                            {languageDisplayNames[language] || language}
                            <ChevronDown className="h-3 w-3" />
                        </button>
                        <CodeLanguageSelector
                            selectedLanguage={language}
                            onSelectLanguage={handleLanguageChange}
                            isOpen={showLanguageSelector}
                            onClose={() => setShowLanguageSelector(false)}
                        />
                    </div>

                    {/* Copy Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-7 px-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#cccccc] border-0"
                    >
                        {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                            <Copy className="h-3.5 w-3.5" />
                        )}
                    </Button>

                    {/* More Options */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#cccccc] border-0"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={toggleWrap}>
                                {wrapCode ? 'Disable wrap' : 'Enable wrap'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowCaption(!showCaption)}>
                                {showCaption ? 'Hide caption' : 'Add caption'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Caption */}
            {showCaption && (
                <div className="px-4 py-2 border-t border-[#2d2d2d] bg-[#1a1a1a]">
                    <input
                        type="text"
                        value={caption}
                        onChange={handleCaptionChange}
                        placeholder="Add a caption..."
                        className="w-full bg-transparent border-0 focus:outline-none text-xs text-[#888888] placeholder:text-[#555555]"
                    />
                </div>
            )}
        </div>
    );
};
