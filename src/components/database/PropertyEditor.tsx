import React, { useState } from 'react';
import { PropertyConfig, PropertyValue } from '@/lib/page-content';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyEditorProps {
    config: PropertyConfig;
    value: PropertyValue;
    onChange: (val: PropertyValue) => void;
    compact?: boolean;
    readOnly?: boolean;
}

export function PropertyEditor({ config, value, onChange, compact = false, readOnly = false }: PropertyEditorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const renderDisplay = () => {
        if (!value && config.type !== 'checkbox') {
            return (
                <span className="text-muted-foreground/50 italic text-sm">
                    Empty
                </span>
            );
        }

        switch (config.type) {
            case 'text':
            case 'number':
            case 'url':
            case 'email':
                return <span className="text-sm truncate max-w-[200px]">{String(value)}</span>;
            case 'select':
            case 'status': {
                const option = config.options?.find(opt => opt.name === value);
                return (
                    <Badge
                        variant="outline"
                        style={{
                            backgroundColor: option?.color ? `${option.color}20` : undefined,
                            borderColor: option?.color ? option.color : undefined,
                            color: option?.color ? option.color : undefined
                        }}
                        className="font-medium"
                    >
                        {String(value)}
                    </Badge>
                );
            }
            case 'date':
                return (
                    <div className="flex items-center gap-1.5 text-sm">
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{format(new Date(value as string), 'MMM d, yyyy')}</span>
                    </div>
                );
            case 'checkbox':
                return (
                    <div className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                        value ? "bg-primary border-primary" : "border-muted-foreground"
                    )}>
                        {value && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                );
            default:
                return <span>{String(value)}</span>;
        }
    };

    if (readOnly) {
        return <div className="px-2 py-1">{renderDisplay()}</div>;
    }

    switch (config.type) {
        case 'text':
        case 'number':
        case 'url':
        case 'email':
            return (
                <Input
                    type={config.type === 'number' ? 'number' : 'text'}
                    value={String(value || '')}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(
                        "h-8 border-none bg-transparent hover:bg-muted/50 focus-visible:ring-1 focus-visible:bg-background transition-all",
                        compact && "px-1"
                    )}
                />
            );

        case 'select':
        case 'status':
            return (
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <button className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 transition-colors w-full justify-start",
                            compact && "px-1"
                        )}>
                            {renderDisplay()}
                            {!compact && <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground/50" />}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[200px]" align="start">
                        <Command>
                            <CommandInput placeholder={`Search ${config.name}...`} />
                            <CommandList>
                                <CommandEmpty>No options found.</CommandEmpty>
                                <CommandGroup>
                                    {config.options?.map((option) => (
                                        <CommandItem
                                            key={option.id}
                                            onSelect={() => {
                                                onChange(option.name);
                                                setIsOpen(false);
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <div
                                                className="h-2 w-2 rounded-full"
                                                style={{ backgroundColor: option.color }}
                                            />
                                            {option.name}
                                            {value === option.name && <Check className="h-4 w-4 ml-auto" />}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            );

        case 'date':
            return (
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                    <PopoverTrigger asChild>
                        <button className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 transition-colors w-full justify-start",
                            compact && "px-1"
                        )}>
                            {renderDisplay()}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-auto" align="start">
                        <Calendar
                            mode="single"
                            selected={value ? new Date(value as string) : undefined}
                            onSelect={(date) => {
                                if (date) {
                                    onChange(date.toISOString());
                                    setIsOpen(false);
                                }
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            );

        case 'checkbox':
            return (
                <button
                    onClick={() => onChange(!value)}
                    className={cn(
                        "px-2 py-1 rounded hover:bg-muted/50 transition-colors",
                        compact && "px-1"
                    )}
                >
                    {renderDisplay()}
                </button>
            );

        default:
            return <div className="px-2 py-1">{renderDisplay()}</div>;
    }
}
