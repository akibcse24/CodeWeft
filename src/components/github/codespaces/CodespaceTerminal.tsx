/**
 * CodespaceTerminal Component
 * 
 * An in-browser terminal emulator that connects to GitHub Codespaces via WebSocket proxy
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal as Xterm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { TerminalErrorOverlay } from './TerminalErrorOverlay';
import '@xterm/xterm/css/xterm.css';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface CodespaceTerminalProps {
    codespaceName: string;
    githubToken: string;
    webUrl?: string;
    onStatusChange?: (status: ConnectionStatus) => void;
    onError?: (error: string) => void;
}

export function CodespaceTerminal({
    codespaceName,
    githubToken,
    webUrl,
    onStatusChange,
    onError,
}: CodespaceTerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminalInstance = useRef<Xterm | null>(null);
    const fitAddon = useRef<FitAddon | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<number | null>(null);
    const connectAttemptRef = useRef(0);
    const onDataDisposableRef = useRef<{ dispose: () => void } | null>(null);

    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [lastError, setLastError] = useState<string | null>(null);
    const [showErrorOverlay, setShowErrorOverlay] = useState(false);

    const updateStatus = useCallback((newStatus: ConnectionStatus, errorMsg?: string) => {
        setStatus(newStatus);
        onStatusChange?.(newStatus);

        if (newStatus === 'error' && errorMsg) {
            setLastError(errorMsg);
            if (connectAttemptRef.current >= 2) {
                setShowErrorOverlay(true);
            }
        } else if (newStatus === 'connected') {
            setLastError(null);
            setShowErrorOverlay(false);
        }
    }, [onStatusChange]);

    const establishWebSocketConnection = useCallback(() => {
        if (!terminalInstance.current) return;

        const term = terminalInstance.current;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
        const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

        if (!supabaseUrl || !apikey) {
            const missing = !supabaseUrl ? 'VITE_SUPABASE_URL' : 'VITE_SUPABASE_PUBLISHABLE_KEY';
            term.writeln(`\x1b[31m✗ Missing ${missing}\x1b[0m`);
            updateStatus('error', `Missing ${missing}`);
            onError?.(`Missing ${missing}`);
            return;
        }

        // Cleanup previous
        onDataDisposableRef.current?.dispose();
        onDataDisposableRef.current = null;
        if (wsRef.current) {
            try {
                wsRef.current.close();
            } catch (err) {
                console.warn("[CodespaceTerminal] Failed to close previous socket:", err);
            }
            wsRef.current = null;
        }

        updateStatus('connecting');

        const wsProtocol = supabaseUrl.startsWith('https') ? 'wss' : 'ws';
        const wsHost = supabaseUrl.replace(/^https?:\/\//, '');
        const params = new URLSearchParams({ codespace: codespaceName, apikey });
        const wsUrl = `${wsProtocol}://${wsHost}/functions/v1/codespace-shell?${params.toString()}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        let everOpened = false;

        ws.onopen = () => {
            everOpened = true;
            term.writeln('\x1b[32m✓ Connected to proxy\x1b[0m');
            term.writeln('\x1b[90mAuthenticating with GitHub...\x1b[0m');
            ws.send(JSON.stringify({ type: 'auth', token: githubToken }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'auth_success':
                        term.writeln('\x1b[32m✓ Authenticated\x1b[0m');
                        term.writeln('\x1b[90mEstablishing session...\x1b[0m');
                        break;
                    case 'connected':
                        term.writeln('\x1b[32m✓ Session established\x1b[0m');
                        term.writeln('');
                        updateStatus('connected');
                        connectAttemptRef.current = 0; // Reset on success
                        break;
                    case 'output':
                        term.write(data.data);
                        break;
                    case 'error':
                        term.writeln(`\x1b[31mError: ${data.message}\x1b[0m`);
                        updateStatus('error', data.message);
                        onError?.(data.message);
                        break;
                    case 'disconnected':
                        term.writeln('\x1b[33mDisconnected from codespace\x1b[0m');
                        updateStatus('disconnected');
                        break;
                }
            } catch {
                term.write(event.data);
            }
        };

        ws.onclose = () => {
            updateStatus('disconnected');
            wsRef.current = null;

            if (!everOpened && connectAttemptRef.current < 2) {
                const delay = 1000 * (connectAttemptRef.current + 1);
                connectAttemptRef.current++;
                term.writeln(`\r\n\x1b[33mConnection lost. Retrying in ${delay / 1000}s...\x1b[0m`);
                reconnectTimerRef.current = window.setTimeout(establishWebSocketConnection, delay);
            }
        };

        onDataDisposableRef.current = term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'input', data }));
            }
        });
    }, [codespaceName, githubToken, updateStatus, onError]);

    // Handle Retry from overlay
    const handleRetry = useCallback(() => {
        setShowErrorOverlay(false);
        setLastError(null);
        connectAttemptRef.current = 0;
        if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        if (terminalInstance.current) {
            terminalInstance.current.writeln('\r\n\x1b[90mManually retrying connection...\x1b[0m');
            establishWebSocketConnection();
        }
    }, [establishWebSocketConnection]);

    // Initialize Terminal
    useEffect(() => {
        if (!terminalRef.current || terminalInstance.current) return;

        const terminal = new Xterm({
            cursorBlink: true,
            cursorStyle: 'block',
            fontFamily: '"Fira Code", "JetBrains Mono", monospace',
            fontSize: 14,
            theme: {
                background: '#0a0a0a',
                foreground: '#e4e4e7',
                cursor: '#a855f7',
                black: '#18181b',
                red: '#ef4444',
                green: '#22c55e',
                yellow: '#eab308',
                blue: '#3b82f6',
                magenta: '#a855f7',
                cyan: '#06b6d4',
                white: '#e4e4e7',
            },
        });

        fitAddon.current = new FitAddon();
        terminal.loadAddon(fitAddon.current);
        terminal.loadAddon(new WebLinksAddon());
        terminal.open(terminalRef.current);

        setTimeout(() => fitAddon.current?.fit(), 10);
        terminalInstance.current = terminal;

        terminal.writeln('\x1b[1;35m╔════════════════════════════════════════════════════════════╗\x1b[0m');
        terminal.writeln('\x1b[1;35m║\x1b[0m  \x1b[1;36mCodespace Terminal V2\x1b[0m                                     \x1b[1;35m║\x1b[0m');
        terminal.writeln('\x1b[1;35m╚════════════════════════════════════════════════════════════╝\x1b[0m');
        terminal.writeln(`\x1b[33mCodespace:\x1b[0m ${codespaceName}`);

        return () => {
            terminal.dispose();
            terminalInstance.current = null;
        };
    }, [codespaceName]);

    // Connect on mount / change
    useEffect(() => {
        const timer = window.setTimeout(() => {
            establishWebSocketConnection();
        }, 500);

        return () => {
            window.clearTimeout(timer);
            if (reconnectTimerRef.current) {
                window.clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            onDataDisposableRef.current?.dispose();
            onDataDisposableRef.current = null;
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [establishWebSocketConnection]);

    // Resize Handling
    useEffect(() => {
        const handleResize = () => {
            if (fitAddon.current && terminalInstance.current) {
                fitAddon.current.fit();
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'resize',
                        cols: terminalInstance.current.cols,
                        rows: terminalInstance.current.rows,
                    }));
                }
            }
        };

        let resizeTimer: number;
        const debouncedResize = () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(handleResize, 150);
        };

        window.addEventListener('resize', debouncedResize);
        const resizeObserver = new ResizeObserver(debouncedResize);
        if (terminalRef.current) resizeObserver.observe(terminalRef.current);

        return () => {
            window.removeEventListener('resize', debouncedResize);
            resizeObserver.disconnect();
            window.clearTimeout(resizeTimer);
        };
    }, []);

    return (
        <div className="relative w-full h-full min-h-[300px]">
            <div
                ref={terminalRef}
                className="w-full h-full bg-[#0a0a0a] rounded-md overflow-hidden"
                style={{ padding: '8px' }}
            />
            {showErrorOverlay && (
                <TerminalErrorOverlay
                    codespaceName={codespaceName}
                    webUrl={webUrl}
                    errorMessage={lastError || undefined}
                    onRetry={handleRetry}
                    isRetrying={status === 'connecting'}
                />
            )}
        </div>
    );
}

export function useCodespaceTerminal(codespaceName: string | null) {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);

    const reconnect = useCallback(() => {
        setError(null);
        setStatus('disconnected');
    }, []);

    return {
        status,
        error,
        setStatus,
        setError,
        reconnect,
        isConnected: status === 'connected',
        isConnecting: status === 'connecting',
        hasError: status === 'error',
    };
}
