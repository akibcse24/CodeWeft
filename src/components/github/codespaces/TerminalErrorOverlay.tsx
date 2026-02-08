/**
 * TerminalErrorOverlay Component
 * 
 * Shows a clear error message with CTA buttons when terminal connection fails
 */

import { Button } from '@/components/ui/button';
import { 
    AlertTriangle, 
    ExternalLink, 
    Copy, 
    Check,
    RefreshCw,
    Terminal,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface TerminalErrorOverlayProps {
    codespaceName: string;
    webUrl?: string;
    errorMessage?: string;
    onRetry: () => void;
    isRetrying?: boolean;
}

export function TerminalErrorOverlay({
    codespaceName,
    webUrl,
    errorMessage,
    onRetry,
    isRetrying = false,
}: TerminalErrorOverlayProps) {
    const [copied, setCopied] = useState(false);

    const handleCopySSHCommand = async () => {
        const command = `gh codespace ssh --codespace ${codespaceName}`;
        await navigator.clipboard.writeText(command);
        setCopied(true);
        toast.success('SSH command copied!', { description: 'Paste this in your local terminal' });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenInBrowser = () => {
        if (webUrl) {
            window.open(webUrl, '_blank');
        }
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-sm z-10">
            <div className="max-w-md w-full mx-4 p-6 rounded-lg border border-zinc-800 bg-zinc-900/80">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-full bg-red-500/10">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Connection Failed</h3>
                        <p className="text-sm text-zinc-400">Unable to connect to the terminal</p>
                    </div>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-400 font-mono">{errorMessage}</p>
                    </div>
                )}

                <p className="text-sm text-zinc-400 mb-6">
                    The in-browser terminal connection couldn't be established. 
                    You can try reconnecting, or use one of the alternative methods below.
                </p>

                <div className="space-y-3">
                    <Button 
                        className="w-full" 
                        onClick={onRetry}
                        disabled={isRetrying}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Reconnecting...' : 'Try Again'}
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                            variant="outline" 
                            className="border-zinc-700 hover:bg-zinc-800"
                            onClick={handleOpenInBrowser}
                            disabled={!webUrl}
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in Browser
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            className="border-zinc-700 hover:bg-zinc-800"
                            onClick={handleCopySSHCommand}
                        >
                            {copied ? (
                                <>
                                    <Check className="mr-2 h-4 w-4 text-green-500" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy SSH Cmd
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500 flex items-center gap-2">
                        <Terminal className="h-3 w-3" />
                        <span>
                            Run in your local terminal: <code className="text-zinc-400">gh codespace ssh --codespace {codespaceName}</code>
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}
