import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

import { PageWidth, getPageWidthClass } from '@/lib/page-layout';

interface PageWidthSelectorProps {
    value: PageWidth;
    onChange: (width: PageWidth) => void;
}

const widthOptions = [
    { value: 'full' as const, label: 'Full width', description: 'Use entire screen' },
    { value: 'default' as const, label: 'Default', description: 'Optimal reading width' },
    { value: 'narrow' as const, label: 'Narrow', description: 'Focused reading' },
];

export function PageWidthSelector({ value, onChange }: PageWidthSelectorProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" title="Page width">
                    <Maximize2 className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {widthOptions.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className="flex flex-col items-start"
                    >
                        <div className="flex items-center gap-2">
                            {value === option.value && <span className="text-primary">✓</span>}
                            <span className="font-medium">{option.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

