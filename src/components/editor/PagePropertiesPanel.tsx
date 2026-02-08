import React from 'react';
import { PropertyConfig, PropertyValue } from '@/lib/page-content';
import { PropertyEditor } from '@/components/properties/PropertyEditor';
import { Button } from '@/components/ui/button';
import { Plus, X, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useDialogs } from '@/hooks/useDialogs';

interface PagePropertiesPanelProps {
    properties: Record<string, PropertyValue>;
    schema: Record<string, PropertyConfig>;
    onChange: (properties: Record<string, PropertyValue>) => void;
    onSchemaChange: (schema: Record<string, PropertyConfig>) => void;
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    lastEdited?: string;
}

export function PagePropertiesPanel({
    properties,
    schema,
    onChange,
    onSchemaChange,
    tags,
    onTagsChange,
    lastEdited
}: PagePropertiesPanelProps) {
    const [newTag, setNewTag] = React.useState('');
    const { prompt, Dialogs } = useDialogs();

    const handleAddProperty = async () => {
        const name = await prompt({
            title: "Add Property",
            description: "Enter a name for this page property",
            placeholder: "e.g., Status, Priority, Due Date",
            validate: (value) => {
                if (!value.trim()) return "Property name is required";
                if (schema[value.toLowerCase()]) return "Property already exists";
                return null;
            }
        });
        if (!name) return;
        onSchemaChange({
            ...schema,
            [name.toLowerCase()]: { id: name.toLowerCase(), name, type: 'text' }
        });
    };

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            onTagsChange([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        onTagsChange(tags.filter(t => t !== tag));
    };

    return (
        <>
            <Dialogs />
            <div className="space-y-4 py-6 border-b border-primary/5 animate-in fade-in slide-in-from-top-2 duration-500">
                {/* Tags Row */}
                <div className="flex items-start gap-4 group">
                    <div className="w-32 flex items-center gap-2 text-muted-foreground/50 h-8">
                        <Tag className="h-4 w-4" />
                        <span className="text-sm font-medium">Tags</span>
                    </div>
                    <div className="flex-1 flex flex-wrap items-center gap-1.5 min-h-[32px]">
                        {tags.map(tag => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-muted/50 hover:bg-destructive/10 transition-colors cursor-pointer group/badge px-2 py-0.5"
                                onClick={() => handleRemoveTag(tag)}
                            >
                                {tag}
                                <X className="h-3 w-3 ml-1.5 opacity-0 group-hover/badge:opacity-100 transition-opacity" />
                            </Badge>
                        ))}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Input
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                placeholder="Add tag..."
                                className="h-6 w-24 text-xs bg-transparent border-dashed ring-offset-transparent focus-visible:ring-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Dynamic Properties */}
                <PropertyEditor
                    properties={properties}
                    schema={schema}
                    onChange={onChange}
                    onSchemaChange={onSchemaChange}
                />

                <div className="flex items-center gap-4 pt-2">
                    <div className="w-32" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground/50 hover:text-foreground font-medium transition-colors"
                        onClick={handleAddProperty}
                    >
                        <Plus className="h-3.5 w-3.5 mr-2" />
                        Add Property
                    </Button>
                </div>

                {lastEdited && (
                    <div className="pt-4 mt-2 border-t border-primary/5">
                        <span className="text-[11px] font-bold text-muted-foreground/20 uppercase tracking-[0.2em]">
                            Last Edited: {lastEdited}
                        </span>
                    </div>
                )}
            </div>
        </>
    );
}