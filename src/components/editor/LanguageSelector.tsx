import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Copy, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

import { LANGUAGES } from "@/constants/languages";

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  onCopy: () => void;
  disabled?: boolean;
}

export function LanguageSelector({
  value,
  onChange,
  onCopy,
  disabled = false,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedLanguage = LANGUAGES.find((lang) => lang.value === value);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    toast({
      description: "Code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Group languages by category
  const groupedLanguages = LANGUAGES.reduce((acc, lang) => {
    if (!acc[lang.category]) {
      acc[lang.category] = [];
    }
    acc[lang.category].push(lang);
    return acc;
  }, {} as Record<string, typeof LANGUAGES>);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            role="combobox"
            aria-expanded={open}
            className="h-7 justify-between gap-1 text-xs font-normal"
            disabled={disabled}
          >
            {selectedLanguage?.label || "Select language"}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search for a language..." className="h-9" />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No language found.</CommandEmpty>
              {Object.entries(groupedLanguages).map(([category, langs]) => (
                <CommandGroup key={category} heading={category}>
                  {langs.map((lang) => (
                    <CommandItem
                      key={lang.value}
                      value={lang.label}
                      onSelect={() => {
                        onChange(lang.value);
                        setOpen(false);
                      }}
                      className="text-sm"
                    >
                      {lang.label}
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          value === lang.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 px-2 text-xs"
        disabled={disabled}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={disabled}
      >
        <MoreHorizontal className="h-3 w-3" />
      </Button>
    </div>
  );
}
