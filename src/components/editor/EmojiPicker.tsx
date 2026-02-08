import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const emojiCategories = {
  "Smileys": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘"],
  "Objects": ["📚", "📖", "📝", "✏️", "📌", "📎", "🔗", "💡", "🔬", "🧪", "🧬", "💻", "🖥️", "⌨️", "🖱️"],
  "Symbols": ["✅", "❌", "⭐", "🌟", "💫", "🔥", "⚡", "💯", "🎯", "🏆", "🥇", "🎓", "📊", "📈", "📉"],
  "Nature": ["🌲", "🌳", "🌴", "🌱", "🌿", "☘️", "🍀", "🌸", "🌺", "🌻", "🌼", "🌷", "🌹", "🥀", "💐"],
  "Flags": ["🏁", "🚩", "🎌", "🏴", "🏳️", "🇺🇸", "🇬🇧", "🇨🇦", "🇦🇺", "🇯🇵", "🇰🇷", "🇨🇳", "🇮🇳", "🇩🇪", "🇫🇷"],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  children: React.ReactNode;
}

export function EmojiPicker({ onSelect, children }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const allEmojis = Object.values(emojiCategories).flat();
  const filteredEmojis = search
    ? allEmojis.filter(() => true) // In a real app, you'd filter by emoji name
    : null;

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <Input
          placeholder="Search emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <ScrollArea className="h-60">
          {filteredEmojis ? (
            <div className="grid grid-cols-8 gap-1">
              {filteredEmojis.map((emoji, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-lg"
                  onClick={() => handleSelect(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          ) : (
            Object.entries(emojiCategories).map(([category, emojis]) => (
              <div key={category} className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-1 px-1">
                  {category}
                </p>
                <div className="grid grid-cols-8 gap-1">
                  {emojis.map((emoji, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg"
                      onClick={() => handleSelect(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
