/**
 * GitHubCodespaceTerminal Page
 * 
 * Full-page access panel for GitHub Codespaces
 * Shows codespace details and clear access methods
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Monitor, Terminal } from 'lucide-react';
import { CodespaceAccessPanel } from '@/components/github/codespaces/CodespaceAccessPanel';
import { useCodespaces } from '@/hooks/github/useCodespacesOperations';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function GitHubCodespaceTerminal() {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const { data: codespaces, isLoading: loadingCodespaces } = useCodespaces();

    const [loadingToken, setLoadingToken] = useState(true);
    const [hasToken, setHasToken] = useState(false);

    const codespace = codespaces?.find(cs => cs.name === name);

    // Check GitHub token exists
    useEffect(() => {
        async function checkToken() {
            setLoadingToken(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('github_settings')
                    .select('github_token')
                    .eq('user_id', user.id)
                    .maybeSingle();
                setHasToken(!!data?.github_token);
            }
            setLoadingToken(false);
        }
        checkToken();
    }, []);

    const isLoading = loadingCodespaces || loadingToken;

    if (isLoading) {
        return (
            <div className="container mx-auto py-6 max-w-4xl">
                <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="h-8 w-8" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <Skeleton className="h-48 w-full mb-4" />
                <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            </div>
        );
    }

    if (!codespace) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                    <Terminal className="h-16 w-16 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Codespace not found</h2>
                    <p className="text-muted-foreground">The codespace "{name}" could not be found.</p>
                    <Button onClick={() => navigate('/github/codespaces')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Codespaces
                    </Button>
                </div>
            </div>
        );
    }

    if (!hasToken) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                    <Terminal className="h-16 w-16 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">GitHub token required</h2>
                    <p className="text-muted-foreground">Please add your GitHub token in Settings.</p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => navigate('/github/codespaces')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <Button onClick={() => navigate('/settings')}>
                            Go to Settings
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/github/codespaces')}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Monitor className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Codespace Access</h1>
                        <p className="text-muted-foreground">{codespace.repository.full_name}</p>
                    </div>
                </div>
            </div>

            {/* Access Panel */}
            <CodespaceAccessPanel codespace={codespace} />
        </div>
    );
}
