import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AtSign, User, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserMention {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'away';
}

interface UserMentionMenuProps {
    isOpen: boolean;
    searchTerm: string;
    users: UserMention[];
    onSelect: (user: UserMention) => void;
    onCreateUser?: (username: string) => void;
    position: { top: number; left: number };
    selectedIndex: number;
}

export function UserMentionMenu({
    isOpen,
    searchTerm,
    users,
    onSelect,
    onCreateUser,
    position,
    selectedIndex,
}: UserMentionMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const selectedRef = useRef<HTMLButtonElement>(null);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users.slice(0, 10);
        
        const term = searchTerm.toLowerCase();
        return users.filter(user => 
            user.name.toLowerCase().includes(term) ||
            user.username.toLowerCase().includes(term)
        ).slice(0, 10);
    }, [searchTerm, users]);

    const showCreateOption = searchTerm && 
        !filteredUsers.some(u => u.username.toLowerCase() === searchTerm.toLowerCase()) &&
        onCreateUser;

    useEffect(() => {
        if (selectedRef.current) {
            selectedRef.current.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                // Parent component should handle closing
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isOpen) return null;

    return (
        <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] w-64 bg-popover border border-border rounded-lg shadow-xl overflow-hidden"
            style={{
                top: Math.min(position.top + 24, window.innerHeight - 300),
                left: Math.min(position.left, window.innerWidth - 280),
            }}
        >
            {/* Header */}
            <div className="px-3 py-2 border-b border-border bg-muted/30">
                <p className="text-xs text-muted-foreground font-medium">Mention a person</p>
            </div>

            {/* Users List */}
            <div className="max-h-[280px] overflow-y-auto py-1">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => {
                        const Icon = user.avatar ? 'img' : 'user';
                        return (
                            <button
                                key={user.id}
                                ref={index === selectedIndex ? selectedRef : null}
                                onClick={() => onSelect(user)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 transition-colors duration-100 text-left",
                                    index === selectedIndex 
                                        ? "bg-accent text-accent-foreground" 
                                        : "hover:bg-muted/50"
                                )}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    {user.avatar ? (
                                        <img 
                                            src={user.avatar} 
                                            alt={user.name}
                                            className="w-7 h-7 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                    )}
                                    {/* Status indicator */}
                                    {user.status && (
                                        <span className={cn(
                                            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-popover",
                                            user.status === 'online' && "bg-green-500",
                                            user.status === 'away' && "bg-yellow-500",
                                            user.status === 'offline' && "bg-gray-400"
                                        )} />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium truncate block">
                                        {user.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate block">
                                        @{user.username}
                                    </span>
                                </div>
                            </button>
                        );
                    })
                ) : (
                    <div className="px-3 py-4 text-center text-muted-foreground">
                        <User className="h-6 w-6 mx-auto mb-1 opacity-50" />
                        <p className="text-sm">No users found</p>
                    </div>
                )}

                {/* Create New User Option */}
                {showCreateOption && (
                    <button
                        ref={filteredUsers.length === selectedIndex ? selectedRef : null}
                        onClick={() => onCreateUser(searchTerm)}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 transition-colors duration-100 text-left",
                            filteredUsers.length === selectedIndex 
                                ? "bg-accent text-accent-foreground" 
                                : "hover:bg-muted/50 text-primary"
                        )}
                    >
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plus className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                            <span className="text-sm font-medium">
                                Create "{searchTerm}"
                            </span>
                            <span className="text-xs text-muted-foreground block">
                                New user
                            </span>
                        </div>
                    </button>
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="px-1.5 py-0.5 bg-muted rounded border border-border/50">↑↓</span>
                    <span>Navigate</span>
                    <span className="px-1.5 py-0.5 bg-muted rounded border border-border/50">↵</span>
                    <span>Select</span>
                    <span className="px-1.5 py-0.5 bg-muted rounded border border-border/50">esc</span>
                    <span>Close</span>
                </div>
            </div>
        </motion.div>
    );
}

// Hook for managing user mentions
export function useUserMentions(
    users: UserMention[],
    onSelect?: (user: UserMention) => void
) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [selectedIndex, setSelectedIndex] = useState(0);

    const handleTrigger = useCallback((rect: DOMRect) => {
        setIsOpen(true);
        setSearchTerm('');
        setSelectedIndex(0);
        setPosition({
            top: rect.bottom,
            left: rect.left,
        });
    }, []);

    const handleSelect = useCallback((user: UserMention) => {
        onSelect?.(user);
        setIsOpen(false);
        setSearchTerm('');
    }, [onSelect]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setSearchTerm('');
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen) return;

        const filteredUsers = searchTerm 
            ? users.filter(u => 
                u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.username.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : users.slice(0, 10);

        const createOption = searchTerm && 
            !filteredUsers.some(u => u.username.toLowerCase() === searchTerm.toLowerCase());
        const totalItems = filteredUsers.length + (createOption ? 1 : 0);

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % totalItems);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        } else if (e.key === 'Enter' && selectedIndex < filteredUsers.length) {
            e.preventDefault();
            handleSelect(filteredUsers[selectedIndex]);
        } else if (e.key === 'Escape') {
            handleClose();
        }
    }, [isOpen, searchTerm, users, selectedIndex, handleSelect, handleClose]);

    return {
        isOpen,
        searchTerm,
        position,
        selectedIndex,
        users,
        handleTrigger,
        handleSelect,
        handleClose,
        handleKeyDown,
        setSearchTerm,
        setPosition,
        setSelectedIndex,
    };
}
