
import { useState, useEffect, useCallback } from 'react';
import { TerminalDialog } from './TerminalDialog';
import { eventBus } from '@/services/event-bus.service';
import { useCodespaces } from '@/hooks/github/useCodespacesOperations';
import { supabase } from '@/integrations/supabase/client';
import type { GitHubCodespace } from '@/services/github/codespaces.service';

export function GlobalCodespaceTerminal() {
    const [open, setOpen] = useState(false);
    const [selectedCodespace, setSelectedCodespace] = useState<GitHubCodespace | null>(null);
    const [githubToken, setGithubToken] = useState<string | null>(null);
    const [pendingCodespaceName, setPendingCodespaceName] = useState<string | null>(null);
    const { data: codespaces, isLoading } = useCodespaces();

    useEffect(() => {
        async function fetchToken() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('github_settings')
                    .select('github_token')
                    .eq('user_id', user.id)
                    .maybeSingle();
                if (data?.github_token) {
                    setGithubToken(data.github_token);
                }
            }
        }
        fetchToken();
    }, []);

    // Handle incoming terminal open events
    const handleOpenTerminal = useCallback((event: { data: { codespaceName: string } }) => {
        const { codespaceName } = event.data;
        setPendingCodespaceName(codespaceName);
    }, []);

    // Effect to match pending request with loaded codespaces
    useEffect(() => {
        if (pendingCodespaceName && codespaces) {
            const cs = codespaces.find(c => c.name === pendingCodespaceName);
            if (cs) {
                setSelectedCodespace(cs);
                setOpen(true);
                setPendingCodespaceName(null);
            }
        }
    }, [pendingCodespaceName, codespaces]);

    useEffect(() => {
        const unsubscribe = eventBus.subscribe('open_codespace_terminal', handleOpenTerminal);
        return () => unsubscribe();
    }, [handleOpenTerminal]);

    if (!githubToken || !selectedCodespace) return null;

    return (
        <TerminalDialog
            open={open}
            onOpenChange={setOpen}
            codespace={selectedCodespace}
            githubToken={githubToken}
        />
    );
}
