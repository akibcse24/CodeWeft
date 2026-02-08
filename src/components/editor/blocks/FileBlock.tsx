import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, X, MoreVertical, File, FileCode, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Block } from '../BlockEditor';

interface FileBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    onFocus: () => void;
    isFocused: boolean;
    readOnly?: boolean;
}

export function FileBlock({
    block,
    onUpdate,
    onFocus,
    isFocused,
    readOnly = false
}: FileBlockProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const fileUrl = block.metadata?.url as string;
    const fileName = block.metadata?.fileName as string || "Untitled File";
    const fileSize = block.metadata?.fileSize as number;
    const fileType = block.metadata?.fileType as string;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simulate upload
        setIsUploading(true);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setUploadProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    setIsUploading(false);
                    onUpdate({
                        metadata: {
                            ...block.metadata,
                            url: URL.createObjectURL(file), // Local preview for now
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type
                        }
                    });
                }, 500);
            }
        }, 100);
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const getFileIcon = (type?: string) => {
        if (type?.includes('image')) return <FileImage className="h-8 w-8 text-blue-500" />;
        if (type?.includes('code') || type?.includes('javascript') || type?.includes('json')) return <FileCode className="h-8 w-8 text-orange-500" />;
        return <FileText className="h-8 w-8 text-muted-foreground" />;
    };

    return (
        <div
            className={cn(
                "my-4 group relative",
                isFocused && "ring-2 ring-primary/20 rounded-lg p-1 -m-1"
            )}
            onFocus={onFocus}
            tabIndex={0}
        >
            {!fileUrl && !isUploading ? (
                <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer relative overflow-hidden">
                    <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                        disabled={readOnly}
                    />
                    <div className="p-4 rounded-full bg-background shadow-sm mb-4">
                        <File className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Click or drag a file to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">Maximum file size: 50MB</p>
                </div>
            ) : isUploading ? (
                <div className="border rounded-xl p-6 bg-card shadow-sm space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="animate-pulse h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <File className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">Uploading file...</p>
                            <Progress value={uploadProgress} className="h-1.5" />
                        </div>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-xl p-4 bg-card hover:shadow-md transition-shadow flex items-center gap-4 group/file shadow-sm"
                >
                    <div className="p-2 rounded-lg bg-muted flex items-center justify-center">
                        {getFileIcon(fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate pr-8">{fileName}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{formatFileSize(fileSize)}</span>
                            {fileType && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                    <span className="uppercase">{fileType.split('/')[1]}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover/file:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={fileUrl} download={fileName}>
                                <Download className="h-4 w-4" />
                            </a>
                        </Button>
                        {!readOnly && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => onUpdate({ metadata: { ...block.metadata, url: undefined } })}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
