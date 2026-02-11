import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function NetworkTest() {
    const [status, setStatus] = useState<string>('Idle');

    const testDirect = async () => {
        setStatus('Testing Direct Fetch...');
        try {
            const start = Date.now();
            const res = await fetch('https://api.github.com/zen');
            const text = await res.text();
            const time = Date.now() - start;
            setStatus(`Direct Success (${time}ms): ${text}`);
            toast.success('Direct fetch worked!');
        } catch (e) {
            setStatus(`Direct Failed: ${e}`);
            toast.error('Direct fetch failed');
        }
    };

    const testProxied = async () => {
        setStatus('Testing Proxied Fetch...');
        try {
            const start = Date.now();
            const { data, error } = await supabase.functions.invoke('github-api', {
                body: { action: 'proxy', path: '/zen' }
            });

            if (error) throw error;

            const time = Date.now() - start;
            setStatus(`Proxy Success (${time}ms): ${data}`);
            toast.success('Proxied fetch worked!');
        } catch (e: any) {
            setStatus(`Proxy Failed: ${e.message || e}`);
            toast.error('Proxied fetch failed');
        }
    };

    return (
        <div className="p-4 border rounded bg-card space-y-4">
            <h3 className="font-bold">Network Diagnostic</h3>
            <div className="text-sm font-mono bg-muted p-2 rounded">Status: {status}</div>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={testDirect}>Test Direct GitHub</Button>
                <Button onClick={testProxied}>Test Proxied GitHub</Button>
            </div>
        </div>
    );
}
