import { useState } from "react";
import { LayoutTemplate, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { ELITE_TEMPLATES, Template } from "@/lib/templates";
import { useToast } from "@/hooks/use-toast";
import { useTemplates } from "@/hooks/useTemplates";
import { Block } from "@/types/editor.types";

interface TemplatePickerProps {
    onSelect: (template: { name: string; blocks: Block[] }) => void;
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const { defaultTemplates, templates, incrementUsage } = useTemplates();

    const handleSelect = async (template: { id: string; name: string; content: unknown }) => {
        const templateContent = template.content as { blocks?: Block[] };
        await incrementUsage(template.id);
        onSelect({
            name: template.name,
            blocks: templateContent.blocks || [],
        });
        setOpen(false);
        toast({
            description: `Applied ${template.name} template`,
        });
    };

    // Convert database templates to compatible format
    const dbTemplates = defaultTemplates?.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description || '',
        icon: t.icon || '📄',
        content: t.content,
    })) || [];

    // Merge with elite templates
    const allTemplates = [
        ...dbTemplates.map(t => ({ ...t, type: 'db' as const })),
        ...ELITE_TEMPLATES.map(t => ({ ...t, type: 'elite' as const })),
    ];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                    <LayoutTemplate className="h-4 w-4" />
                    <span className="text-xs">Templates</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search templates..." />
                    <CommandList>
                        <CommandEmpty>No templates found.</CommandEmpty>
                        
                        <CommandGroup heading="Recommended">
                            {dbTemplates.slice(0, 4).map((template) => (
                                <CommandItem
                                    key={template.id}
                                    onSelect={() => handleSelect(template)}
                                    className="flex items-start gap-2 py-3 cursor-pointer"
                                >
                                    <span className="text-xl leading-none pt-0.5">{template.icon}</span>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-medium text-sm">{template.name}</span>
                                        <span className="text-xs text-muted-foreground line-clamp-2">
                                            {template.description}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        {templates && templates.length > 0 && (
                            <CommandGroup heading="Your Templates">
                                {templates.slice(0, 5).map((template) => (
                                    <CommandItem
                                        key={template.id}
                                        onSelect={() => handleSelect(template)}
                                        className="flex items-start gap-2 py-2 cursor-pointer"
                                    >
                                        <span className="text-lg leading-none">{template.icon || '📄'}</span>
                                        <span className="text-sm">{template.name}</span>
                                        {template.usage_count && template.usage_count > 0 && (
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {template.usage_count} uses
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        <CommandGroup heading="All Templates">
                            {ELITE_TEMPLATES.map((template) => (
                                <CommandItem
                                    key={template.id}
                                    onSelect={() => {
                                        onSelect({
                                            name: template.name,
                                            blocks: template.blocks,
                                        });
                                        setOpen(false);
                                        toast({
                                            description: `Applied ${template.name} template`,
                                        });
                                    }}
                                    className="flex items-start gap-2 py-2 cursor-pointer"
                                >
                                    <span className="text-lg leading-none">{template.icon}</span>
                                    <span className="text-sm">{template.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
