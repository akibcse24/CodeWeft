import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Smile, Coffee, Plane, Activity, Heart, Flag } from 'lucide-react';

const EMOJI_CATEGORIES = [
    { name: 'Smileys', icon: Smile, emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿'] },
    { name: 'Objects', icon: Coffee, emojis: ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩺', '💊', '💉', '🩹', '🧬', '🌡️', '🧹', '🧺', '🧻', '🧼', '🧽', '🪒', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🖼️', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🎊', '🎉', '🎊', '🧧', '🏮', '🎐'] },
    { name: 'Travel', icon: Plane, emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛵', '🚲', '🛴', '🛹', '🛺', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🚲', '🛴', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚋', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🚲', '🛴', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚠', '🚟', '🚋', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🚲', '🛴', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖'] },
    { name: 'Activities', icon: Activity, emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏', '⛳', '🏹', '🎣', '🥊', '🥋', '🎽', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🏋️', '🤺', '🤼', '🤸', '⛹️', '🤽', '🏄', '🏊', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎲', '🧩', '♟️', '🎯', '🎳', '🎮', '🎰'] },
    { name: 'Nature', icon: Heart, emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🐾', '🐉', '🐲', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '🪐', '💫', '⭐️', '🌟', '✨', '⚡️', '☄️', '💥', '🔥', '🌪️', '🌈', '☀️', '🌤️', '⛅️', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄️', '🌬️', '💨', '💧', '💦', '☔️', '☂️', '🌊', '🌫️'] }
];

interface EmojiPickerProps {
    value?: string;
    onSelect: (emoji: string) => void;
    children?: React.ReactNode;
}

export function EmojiPicker({ value, onSelect, children }: EmojiPickerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredEmojis = EMOJI_CATEGORIES.map(category => ({
        ...category,
        emojis: category.emojis.filter(emoji =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(cat => cat.emojis.length > 0);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                {children || (
                    <Button variant="ghost" className="h-8 w-8 p-0 text-xl hover:bg-muted/50 transition-colors">
                        {value || '📄'}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-2xl border-primary/10 backdrop-blur-xl bg-background/80" align="start">
                <div className="p-3 border-b flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search emojis..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8 border-none bg-transparent focus-visible:ring-0 p-0 text-sm"
                        autoFocus
                    />
                </div>
                <Tabs defaultValue="Smileys" className="w-full">
                    <TabsList className="w-full justify-start rounded-none h-10 bg-transparent border-b px-2 gap-1 overflow-x-auto scrollbar-none">
                        {EMOJI_CATEGORIES.map(category => (
                            <TabsTrigger
                                key={category.name}
                                value={category.name}
                                className="h-7 w-7 p-0 data-[state=active]:bg-muted"
                            >
                                <category.icon className="h-4 w-4" />
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {EMOJI_CATEGORIES.map(category => (
                        <TabsContent key={category.name} value={category.name} className="m-0">
                            <ScrollArea className="h-60 p-2">
                                <div className="grid grid-cols-8 gap-1">
                                    {category.emojis.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => {
                                                onSelect(emoji);
                                                setIsOpen(false);
                                            }}
                                            className="h-8 w-8 flex items-center justify-center text-xl hover:bg-muted rounded transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    ))}
                </Tabs>
                <div className="p-2 border-t flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                    <span>Elite Emoji Engine</span>
                    <span>{EMOJI_CATEGORIES.reduce((acc, cat) => acc + cat.emojis.length, 0)} Emojis</span>
                </div>
            </PopoverContent>
        </Popover>
    );
}
