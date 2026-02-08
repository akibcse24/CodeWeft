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

interface TemplatePickerProps {
    onSelect: (template: Template) => void;
}

export function TemplatePicker({ onSelect }: TemplatePickerProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    const handleSelect = (template: Template) => {
        onSelect(template);
        setOpen(false);
        toast({
            description: `Applied ${template.name} template`,
        });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                    <LayoutTemplate className="h-4 w-4" />
                    <span className="text-xs">Templates</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search templates..." />
                    <CommandList>
                        <CommandEmpty>No templates found.</CommandEmpty>
                        <CommandGroup heading="Elite Templates">
                            {ELITE_TEMPLATES.map((template) => (
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
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
