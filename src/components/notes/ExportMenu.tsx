import { Download, FileText, Code, File, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Block } from '@/components/editor/BlockEditor';
import {
    exportToMarkdown,
    exportToHTML,
    exportToJSON,
    exportToPlainText,
    downloadFile,
    copyToClipboard,
} from '@/lib/export';
import { toast } from '@/hooks/use-toast';

interface ExportMenuProps {
    blocks: Block[];
    pageTitle: string;
    pageData?: Record<string, unknown>;
}

export function ExportMenu({ blocks, pageTitle, pageData }: ExportMenuProps) {
    const handleExportMarkdown = () => {
        const markdown = exportToMarkdown(blocks, pageTitle);
        downloadFile(markdown, `${pageTitle}.md`, 'text/markdown');
        toast({ title: 'Exported to Markdown', description: `${pageTitle}.md downloaded` });
    };

    const handleExportHTML = () => {
        const html = exportToHTML(blocks, pageTitle);
        downloadFile(html, `${pageTitle}.html`, 'text/html');
        toast({ title: 'Exported to HTML', description: `${pageTitle}.html downloaded` });
    };

    const handleExportJSON = () => {
        const json = exportToJSON(blocks, pageData);
        downloadFile(json, `${pageTitle}.json`, 'application/json');
        toast({ title: 'Exported to JSON', description: `${pageTitle}.json downloaded` });
    };

    const handleCopyAsText = async () => {
        const text = exportToPlainText(blocks);
        const success = await copyToClipboard(text);

        if (success) {
            toast({ title: 'Copied to clipboard', description: 'Plain text copied' });
        } else {
            toast({
                title: 'Copy failed',
                description: 'Could not copy to clipboard',
                variant: 'destructive'
            });
        }
    };

    const handleCopyAsMarkdown = async () => {
        const markdown = exportToMarkdown(blocks, pageTitle);
        const success = await copyToClipboard(markdown);

        if (success) {
            toast({ title: 'Copied to clipboard', description: 'Markdown copied' });
        } else {
            toast({
                title: 'Copy failed',
                description: 'Could not copy to clipboard',
                variant: 'destructive'
            });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
                <DropdownMenuLabel>Download As</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleExportMarkdown}>
                    <FileText className="h-4 w-4 mr-2" />
                    Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportHTML}>
                    <Code className="h-4 w-4 mr-2" />
                    HTML (.html)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJSON}>
                    <File className="h-4 w-4 mr-2" />
                    JSON (.json)
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Copy</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleCopyAsText}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy as plain text
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyAsMarkdown}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy as Markdown
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
