import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, ExternalLink, Play, FileText, X } from 'lucide-react';
import { Block } from '@/types/editor.types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EmbedBlockProps {
    block: Block;
    onUpdate: (updates: Partial<Block>) => void;
    readOnly?: boolean;
}

type EmbedType = 'youtube' | 'vimeo' | 'figma' | 'twitter' | 'codepen' | 'generic';

export const EmbedBlock: React.FC<EmbedBlockProps> = ({
    block,
    onUpdate,
    readOnly = false,
}) => {
    const [inputUrl, setInputUrl] = useState('');
    const [isEditing, setIsEditing] = useState(!block.linkUrl);

    const embedUrl = block.linkUrl || '';
    const embedType = detectEmbedType(embedUrl);

    const handleSubmit = () => {
        if (inputUrl) {
            onUpdate({ linkUrl: inputUrl, content: inputUrl });
            setIsEditing(false);
        }
    };

    const handleRemove = () => {
        onUpdate({ linkUrl: '', content: '' });
        setIsEditing(true);
    };

    if (isEditing && !readOnly) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border-2 border-dashed border-border/50 bg-muted/20"
            >
                <div className="flex items-center gap-2 mb-3">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Embed Content</span>
                </div>
                <div className="flex gap-2">
                    <Input
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="Paste a YouTube, Figma, or any URL..."
                        className="flex-1"
                    />
                    <Button onClick={handleSubmit} size="sm">
                        Embed
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-muted/50">YouTube</span>
                    <span className="px-2 py-0.5 rounded bg-muted/50">Vimeo</span>
                    <span className="px-2 py-0.5 rounded bg-muted/50">Figma</span>
                    <span className="px-2 py-0.5 rounded bg-muted/50">CodePen</span>
                    <span className="px-2 py-0.5 rounded bg-muted/50">Twitter</span>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative rounded-xl overflow-hidden bg-muted/10 border border-border/30"
        >
            {!readOnly && (
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={() => window.open(embedUrl, '_blank')}
                    >
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={handleRemove}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {embedType === 'youtube' && (
                <div className="aspect-video">
                    <iframe
                        src={getYouTubeEmbedUrl(embedUrl)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            )}

            {embedType === 'vimeo' && (
                <div className="aspect-video">
                    <iframe
                        src={getVimeoEmbedUrl(embedUrl)}
                        className="w-full h-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            )}

            {embedType === 'figma' && (
                <div className="aspect-video">
                    <iframe
                        src={getFigmaEmbedUrl(embedUrl)}
                        className="w-full h-full"
                        allowFullScreen
                    />
                </div>
            )}

            {embedType === 'codepen' && (
                <div className="aspect-video">
                    <iframe
                        src={getCodePenEmbedUrl(embedUrl)}
                        className="w-full h-full"
                        allowFullScreen
                    />
                </div>
            )}

            {embedType === 'generic' && (
                <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{embedUrl}</p>
                        <p className="text-xs text-muted-foreground">External link</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
            )}
        </motion.div>
    );
};

function detectEmbedType(url: string): EmbedType {
    if (!url) return 'generic';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('figma.com')) return 'figma';
    if (url.includes('codepen.io')) return 'codepen';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    return 'generic';
}

function getYouTubeEmbedUrl(url: string): string {
    const videoId = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function getVimeoEmbedUrl(url: string): string {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
}

function getFigmaEmbedUrl(url: string): string {
    return `https://www.figma.com/embed?embed_host=notion&url=${encodeURIComponent(url)}`;
}

function getCodePenEmbedUrl(url: string): string {
    const match = url.match(/codepen\.io\/([^/]+)\/pen\/([^/?]+)/);
    if (match) {
        return `https://codepen.io/${match[1]}/embed/${match[2]}?default-tab=result`;
    }
    return url;
}
