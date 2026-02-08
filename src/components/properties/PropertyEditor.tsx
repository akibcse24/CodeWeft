import { useState } from 'react';
import { PropertyConfig, PropertyValue } from '@/lib/page-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { format } from 'date-fns';
import { CalendarIcon, Plus, X, ChevronDown, Type, AlignLeft, Calendar as CalendarIc, CheckSquare, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useDialogs } from '@/hooks/useDialogs';

interface PropertyEditorProps {
    properties: Record<string, PropertyValue>;
    schema: Record<string, PropertyConfig>;
    onChange: (properties: Record<string, PropertyValue>) => void;
    onSchemaChange?: (schema: Record<string, PropertyConfig>) => void;
    readOnly?: boolean;
}

const PROPERTY_TYPES = [
    { type: 'text', label: 'Text', icon: AlignLeft },
    { type: 'number', label: 'Number', icon: Type },
    { type: 'select', label: 'Select', icon: ChevronDown },
    { type: 'status', label: 'Status', icon: CheckSquare },
    { type: 'date', label: 'Date', icon: CalendarIc },
];

const DEFAULT_STATUS_OPTIONS = [
    { id: 'not-started', name: 'Not Started', color: '#gray' },
    { id: 'in-progress', name: 'In Progress', color: '#blue' },
    { id: 'done', name: 'Done', color: '#green' },
];

export function PropertyEditor({ properties, schema, onChange, onSchemaChange, readOnly }: PropertyEditorProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const { prompt, confirm, Dialogs } = useDialogs();

    const handleAddProperty = async (type: string) => {
        if (!onSchemaChange) return;
        
        const name = await prompt({
            title: "Add Property",
            description: "Enter a name for this property",
            placeholder: "e.g., Priority, Due Date, Status",
            validate: (value) => {
                if (!value.trim()) return "Property name is required";
                if (schema[value.trim()]) return "Property already exists";
                return null;
            }
        });
        
        if (!name) return;

        // For select/status, provide default options
        const options = (type === 'status' || type === 'select')
            ? DEFAULT_STATUS_OPTIONS
            : undefined;

        onSchemaChange({
            ...schema,
            [name]: { id: name, name, type: type as PropertyConfig['type'], options }
        });
    };

    const updateProperty = (key: string, value: PropertyValue) => {
        onChange({ ...properties, [key]: value });
    };

    const handleDeleteProperty = async (key: string) => {
        if (!onSchemaChange) return;
        
        const confirmed = await confirm({
            title: "Delete Property",
            description: `Are you sure you want to delete "${schema[key].name}"? This will remove all values associated with this property.`,
            confirmText: "Delete",
            variant: "destructive"
        });
        
        if (!confirmed) return;

        const newSchema = { ...schema };
        delete newSchema[key];
        onSchemaChange(newSchema);

        const newProps = { ...properties };
        delete newProps[key];
        onChange(newProps);
    };

    return (
        <>
            <Dialogs />
            <div className="flex flex-col gap-2 mb-6 border-b pb-4">
            {Object.entries(schema).map(([key, config]) => (
                <div key={key} className="flex items-center gap-4 text-sm group">
                    <div className="w-32 flex items-center gap-2 text-muted-foreground">
                        {getPropertyIcon(config.type)}
                        <span>{config.name}</span>
                    </div>
                    <div className="flex-1">
                        {renderInput(config, properties[key], (val) => updateProperty(key, val), onSchemaChange)}
                    </div>
                    {!readOnly && onSchemaChange && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => handleDeleteProperty(key)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            ))}

            {!readOnly && onSchemaChange && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-fit text-muted-foreground mt-2">
                            <Plus className="h-4 w-4 mr-2" /> Add Property
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Property Type</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {PROPERTY_TYPES.map(t => (
                            <DropdownMenuItem key={t.type} onClick={() => handleAddProperty(t.type)}>
                                <t.icon className="h-4 w-4 mr-2" />
                                {t.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
        </>
    );
}

function getPropertyIcon(type: string) {
    switch (type) {
        case 'text': return <AlignLeft className="h-4 w-4" />;
        case 'number': return <Type className="h-4 w-4" />;
        case 'date': return <CalendarIc className="h-4 w-4" />;
        case 'status': return <CheckSquare className="h-4 w-4" />;
        case 'select': return <ChevronDown className="h-4 w-4" />;
        default: return <Type className="h-4 w-4" />;
    }
}

function renderInput(
    config: PropertyConfig,
    value: PropertyValue,
    onChange: (val: PropertyValue) => void,
    onSchemaChange?: (schema: Record<string, PropertyConfig>) => void
) {
    switch (config.type) {
        case 'text':
            return <Input
                value={value as string || ''}
                onChange={e => onChange(e.target.value)}
                className="h-8 border-transparent hover:border-border focus:border-border bg-transparent"
                placeholder="Empty"
            />;
        case 'number':
            return <Input
                type="number"
                value={value as number || ''}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="h-8 border-transparent hover:border-border focus:border-border bg-transparent w-full"
                placeholder="Empty"
            />;
        case 'select':
        case 'status':
            return <SelectInput config={config} value={value} onChange={onChange} />;
        case 'date':
            return (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"ghost"}
                            className={cn(
                                "h-8 w-[240px] justify-start text-left font-normal px-2",
                                !value && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {value ? format(new Date(value as string), "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={value ? new Date(value as string) : undefined}
                            onSelect={(date) => onChange(date?.toISOString())}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            );
        default:
            return <span className="text-muted-foreground">Unsupported type</span>;
    }
}

function SelectInput({ config, value, onChange }: { config: PropertyConfig; value: PropertyValue; onChange: (val: PropertyValue) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const options = config.options || DEFAULT_STATUS_OPTIONS;

    const handleSelect = (optionName: string) => {
        onChange(optionName);
        setOpen(false);
    };

    const handleCreateNew = () => {
        if (!search.trim()) return;
        onChange(search.trim());
        setSearch('');
        setOpen(false);
    };

    const filteredOptions = options.filter(opt =>
        opt.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="h-8 justify-start px-2 font-normal hover:bg-muted"
                >
                    {value ? (
                        <Badge variant="secondary" className="font-normal">
                            {value as string}
                        </Badge>
                    ) : (
                        <span className="text-muted-foreground">Select...</span>
                    )}
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search or create..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>
                            <div className="text-sm text-muted-foreground py-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={handleCreateNew}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create "{search}"
                                </Button>
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option.id}
                                    value={option.name}
                                    onSelect={() => handleSelect(option.name)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
