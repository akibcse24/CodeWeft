import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, MoreHorizontal, Reply, Trash2, Edit2, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

export interface Comment {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    createdAt: string;
    updatedAt?: string;
    resolved?: boolean;
    replies?: Comment[];
}

interface CommentThreadProps {
    comment: Comment;
    onReply: (commentId: string, content: string) => void;
    onResolve: (commentId: string) => void;
    onDelete: (commentId: string) => void;
    onEdit: (commentId: string, content: string) => void;
    currentUserId?: string;
}

export function CommentThread({
    comment,
    onReply,
    onResolve,
    onDelete,
    onEdit,
    currentUserId
}: CommentThreadProps) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showMenu, setShowMenu] = useState(false);
    const replyInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isReplying && replyInputRef.current) {
            replyInputRef.current.focus();
        }
    }, [isReplying]);

    const handleReply = () => {
        if (replyContent.trim()) {
            onReply(comment.id, replyContent.trim());
            setReplyContent('');
            setIsReplying(false);
        }
    };

    const handleEdit = () => {
        if (editContent.trim() && editContent !== comment.content) {
            onEdit(comment.id, editContent.trim());
        }
        setIsEditing(false);
    };

    const isOwner = currentUserId === comment.authorId;
    const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
                "group rounded-lg border p-3 transition-all",
                comment.resolved 
                    ? "bg-muted/30 border-muted-foreground/20" 
                    : "bg-popover border-border hover:border-primary/30"
            )}
        >
            {/* Comment Header */}
            <div className="flex items-start gap-2">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {comment.authorAvatar ? (
                        <img 
                            src={comment.authorAvatar} 
                            alt={comment.authorName}
                            className="w-6 h-6 rounded-full"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                                {comment.authorName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium">{comment.authorName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo}
                        </span>
                        {comment.resolved && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                Resolved
                            </span>
                        )}
                    </div>

                    {/* Comment Text */}
                    {isEditing ? (
                        <div className="flex items-center gap-1 mt-1">
                            <Input
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="h-7 text-sm"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEdit();
                                    if (e.key === 'Escape') setIsEditing(false);
                                }}
                            />
                            <Button size="icon" className="h-7 w-7" onClick={handleEdit}>
                                <Check className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditing(false)}>
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                            {comment.content}
                        </p>
                    )}

                    {/* Actions */}
                    {!isEditing && (
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-xs"
                                onClick={() => setIsReplying(!isReplying)}
                            >
                                <Reply className="h-3 w-3 mr-1" />
                                Reply
                            </Button>
                            {!comment.resolved && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-1.5 text-xs text-green-600 hover:text-green-700"
                                    onClick={() => onResolve(comment.id)}
                                >
                                    Resolve
                                </Button>
                            )}
                            {isOwner && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-1.5 text-xs"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Edit2 className="h-3 w-3 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-1.5 text-xs text-destructive"
                                        onClick={() => onDelete(comment.id)}
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                    </Button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Reply Input */}
                    {isReplying && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 mt-2"
                        >
                            <Input
                                ref={replyInputRef}
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="h-7 text-sm flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleReply();
                                    if (e.key === 'Escape') setIsReplying(false);
                                }}
                            />
                            <Button size="sm" className="h-7" onClick={handleReply}>
                                <Send className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => setIsReplying(false)}>
                                <X className="h-3 w-3" />
                            </Button>
                        </motion.div>
                    )}

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-primary/20 space-y-2">
                            {comment.replies.map((reply) => (
                                <CommentThread
                                    key={reply.id}
                                    comment={reply}
                                    onReply={onReply}
                                    onResolve={onResolve}
                                    onDelete={onDelete}
                                    onEdit={onEdit}
                                    currentUserId={currentUserId}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Menu */}
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <MoreHorizontal className="h-3 w-3" />
                    </Button>
                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 bg-popover border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(comment.content);
                                    setShowMenu(false);
                                }}
                                className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent"
                            >
                                Copy text
                            </button>
                            {isOwner && (
                                <button
                                    onClick={() => {
                                        onDelete(comment.id);
                                        setShowMenu(false);
                                    }}
                                    className="w-full px-3 py-1.5 text-sm text-left text-destructive hover:bg-accent"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

interface CommentPanelProps {
    comments: Comment[];
    onAddComment: (content: string) => void;
    onReply: (commentId: string, content: string) => void;
    onResolve: (commentId: string) => void;
    onDelete: (commentId: string) => void;
    onEdit: (commentId: string, content: string) => void;
    blockContent?: string;
    currentUserId?: string;
    isOpen: boolean;
    onClose: () => void;
}

export function CommentPanel({
    comments,
    onAddComment,
    onReply,
    onResolve,
    onDelete,
    onEdit,
    blockContent,
    currentUserId,
    isOpen,
    onClose
}: CommentPanelProps) {
    const [newComment, setNewComment] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (newComment.trim()) {
            onAddComment(newComment.trim());
            setNewComment('');
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed right-4 top-20 z-40 w-80 bg-popover border rounded-xl shadow-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Comments</h3>
                    {comments.length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {comments.length}
                        </span>
                    )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Block Reference */}
            {blockContent && (
                <div className="px-4 py-2 bg-muted/30 border-b border-border">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                        {blockContent}
                    </p>
                </div>
            )}

            {/* Comments List */}
            <div className="max-h-[400px] overflow-y-auto p-3 space-y-3">
                {comments.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No comments yet</p>
                        <p className="text-xs text-muted-foreground/70">Be the first to comment</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {comments.map((comment) => (
                            <CommentThread
                                key={comment.id}
                                comment={comment}
                                onReply={onReply}
                                onResolve={onResolve}
                                onDelete={onDelete}
                                onEdit={onEdit}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* New Comment Input */}
            <div className="p-3 border-t border-border bg-muted/20">
                <div className="flex items-center gap-2">
                    <Input
                        ref={inputRef}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="h-8 text-sm"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                            if (e.key === 'Escape') {
                                setNewComment('');
                                onClose();
                            }
                        }}
                    />
                    <Button size="sm" className="h-8" onClick={handleSubmit} disabled={!newComment.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
