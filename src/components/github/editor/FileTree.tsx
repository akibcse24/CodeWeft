/**
 * FileTree Component - Repository file browser
 * 
 * Browse and select files from a repository
 */

import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { FileNode } from './file-tree-utils';

interface FileTreeProps {
    files: FileNode[];
    onFileSelect: (file: FileNode) => void;
    selectedPath?: string;
}

export function FileTree({ files, onFileSelect, selectedPath }: FileTreeProps) {
    return (
        <ScrollArea className="h-full">
            <div className="p-2">
                {files.map((node) => (
                    <FileTreeNode
                        key={node.path}
                        node={node}
                        level={0}
                        onSelect={onFileSelect}
                        selectedPath={selectedPath}
                    />
                ))}
            </div>
        </ScrollArea>
    );
}

interface FileTreeNodeProps {
    node: FileNode;
    level: number;
    onSelect: (file: FileNode) => void;
    selectedPath?: string;
}

function FileTreeNode({ node, level, onSelect, selectedPath }: FileTreeNodeProps) {
    const [isExpanded, setIsExpanded] = useState(level === 0);
    const isSelected = selectedPath === node.path;
    const isDirectory = node.type === 'dir';

    const handleClick = () => {
        if (isDirectory) {
            setIsExpanded(!isExpanded);
        } else {
            onSelect(node);
        }
    };

    return (
        <div>
            <Button
                variant="ghost"
                className={cn(
                    'w-full justify-start px-2 py-1 h-auto font-normal hover:bg-accent',
                    isSelected && 'bg-accent'
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleClick}
            >
                {isDirectory ? (
                    <>
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4 mr-1 shrink-0" />
                        ) : (
                            <ChevronRight className="h-4 w-4 mr-1 shrink-0" />
                        )}
                        {isExpanded ? (
                            <FolderOpen className="h-4 w-4 mr-2 shrink-0 text-blue-500" />
                        ) : (
                            <Folder className="h-4 w-4 mr-2 shrink-0 text-blue-500" />
                        )}
                    </>
                ) : (
                    <>
                        <span className="w-4 mr-1" /> {/* Spacer for alignment */}
                        <File className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                    </>
                )}
                <span className="truncate text-sm">{node.name}</span>
            </Button>

            {isDirectory && isExpanded && node.children && (
                <div>
                    {node.children.map((child) => (
                        <FileTreeNode
                            key={child.path}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            selectedPath={selectedPath}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
