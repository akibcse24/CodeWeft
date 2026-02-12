import { useState } from "react";
import { Check, Copy, Globe, Link as LinkIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SharePopoverProps {
    pageId: string;
    isPublic: boolean;
    onPublicChange: (isPublic: boolean) => void;
}

export function SharePopover({ pageId, isPublic, onPublicChange }: SharePopoverProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Use window.location.origin to construct the full URL
    // We'll assume the public route is /share/:pageId or just /:pageId if using special routing
    // For this implementation, let's use /share/:pageId
    const shareUrl = `${window.location.origin}/#/share/${pageId}`;

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from("pages")
                .update({ is_public: checked })
                .eq("id", pageId);

            if (error) throw error;

            onPublicChange(checked);
            toast({
                description: checked ? "Page published to web" : "Page is now private",
            });
        } catch (error) {
            console.error("Error updating page visibility:", error);
            toast({
                variant: "destructive",
                description: "Failed to update page visibility",
            });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast({
                description: "Link copied to clipboard",
            });
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
            // Fallback for older browsers or non-secure contexts
            try {
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast({
                        description: "Link copied to clipboard",
                    });
                } else {
                    throw new Error("execCommand was unsuccessful");
                }
            } catch (fallbackError) {
                toast({
                    variant: "destructive",
                    description: "Failed to copy link to clipboard",
                });
            }
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                    {isPublic ? (
                        <>
                            <Globe className="h-4 w-4 text-sky-500" />
                            <span className="text-sky-500 font-medium">Published</span>
                        </>
                    ) : (
                        <>
                            <span className="flex items-center gap-2">
                                Share
                            </span>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="font-medium text-sm leading-none flex items-center gap-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                Publish to Web
                            </h4>
                            <p className="text-xs text-muted-foreground">
                                Make this page visible to anyone with the link
                            </p>
                        </div>
                        <Switch
                            checked={isPublic}
                            onCheckedChange={handleToggle}
                            disabled={loading}
                            className="data-[state=checked]:bg-sky-500"
                        />
                    </div>

                    {isPublic && (
                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center gap-2">
                                <Input
                                    value={shareUrl}
                                    readOnly
                                    className="h-8 text-xs font-mono bg-muted/50"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 shrink-0"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="w-full h-8 text-xs"
                                onClick={() => window.open(shareUrl, '_blank')}
                            >
                                Open in new tab
                            </Button>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
