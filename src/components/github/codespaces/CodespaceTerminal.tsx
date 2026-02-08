/**
 * CodespaceTerminal Component
 * 
 * An in-browser terminal emulator that connects to GitHub Codespaces via WebSocket proxy
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface CodespaceTerminalProps {
    codespaceName: string;
    githubToken: string;
    webUrl?: string;
    onStatusChange?: (status: ConnectionStatus) => void;
    onError?: (error: string) => void;
}

import { TerminalErrorOverlay } from './TerminalErrorOverlay';

export function CodespaceTerminal({ 
    codespaceName, 
    githubToken,
    webUrl,
    onStatusChange,
    onError,
}: CodespaceTerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminalInstance = useRef<Terminal | null>(null);
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
            // Show overlay after max retries are exhausted
            if (connectAttemptRef.current >= 2) {
                setShowErrorOverlay(true);
            }
        } else if (newStatus === 'connected') {
            setLastError(null);
            setShowErrorOverlay(false);
        }
    }, [onStatusChange]);

    // Initialize terminal
    useEffect(() => {
        if (!terminalRef.current || terminalInstance.current) return;

        const terminal = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", Menlo, Monaco, "Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.2,
            theme: {
                background: '#0a0a0a',
                foreground: '#e4e4e7',
                cursor: '#a855f7',
                cursorAccent: '#0a0a0a',
                selectionBackground: '#3f3f46',
                selectionForeground: '#fafafa',
                black: '#18181b',
                red: '#ef4444',
                green: '#22c55e',
                yellow: '#eab308',
                blue: '#3b82f6',
                magenta: '#a855f7',
                cyan: '#06b6d4',
                white: '#e4e4e7',
                brightBlack: '#52525b',
                brightRed: '#f87171',
                brightGreen: '#4ade80',
                brightYellow: '#facc15',
                brightBlue: '#60a5fa',
                brightMagenta: '#c084fc',
                brightCyan: '#22d3ee',
                brightWhite: '#fafafa',
            },
        });

        fitAddon.current = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        terminal.loadAddon(fitAddon.current);
        terminal.loadAddon(webLinksAddon);
        terminal.open(terminalRef.current);
        
        // Initial fit
        setTimeout(() => {
            fitAddon.current?.fit();
        }, 10);

        terminalInstance.current = terminal;

        // Welcome message
        terminal.writeln('\x1b[1;35m╔════════════════════════════════════════════════════════════╗\x1b[0m');
        terminal.writeln('\x1b[1;35m║\x1b[0m  \x1b[1;36mCodespace Terminal\x1b[0m                                        \x1b[1;35m║\x1b[0m');
        terminal.writeln('\x1b[1;35m╚════════════════════════════════════════════════════════════╝\x1b[0m');
        terminal.writeln('');
        terminal.writeln(`\x1b[33mConnecting to codespace:\x1b[0m ${codespaceName}`);
        terminal.writeln('');

        return () => {
            terminal.dispose();
            terminalInstance.current = null;
        };
    }, [codespaceName]);

    // Connect to WebSocket proxy
    const connect = useCallback(() => {
        if (!terminalInstance.current) return;

        const terminal = terminalInstance.current;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
        const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

        if (!supabaseUrl) {
            terminal.writeln('\x1b[31m✗ Missing backend URL (VITE_SUPABASE_URL)\x1b[0m');
            updateStatus('error', 'Missing backend URL');
            onError?.('Missing backend URL');
            return;
        }

        if (!apikey) {
            terminal.writeln('\x1b[31m✗ Missing publishable key (VITE_SUPABASE_PUBLISHABLE_KEY)\x1b[0m');
            updateStatus('error', 'Missing publishable key');
            onError?.('Missing publishable key');
            return;
        }

        // Avoid multiple listeners across reconnects
        onDataDisposableRef.current?.dispose();
        onDataDisposableRef.current = null;

        // Close any previous socket
        try {
            wsRef.current?.close();
        } catch {
            // ignore
        }
        wsRef.current = null;

        updateStatus('connecting');

        // Build WebSocket URL for the backend function
        const wsProtocol = supabaseUrl.startsWith('https') ? 'wss' : 'ws';
        const wsHost = supabaseUrl.replace(/^https?:\/\//, '');

        const params = new URLSearchParams({
            codespace: codespaceName,
            apikey,
        });

        const wsUrl = `${wsProtocol}://${wsHost}/functions/v1/codespace-shell?${params.toString()}`;

        const scheduleReconnect = (reason: string) => {
            // Prevent infinite retry loops (the dialog already has a manual Reconnect button)
            const maxAutoRetries = 2;
            if (connectAttemptRef.current >= maxAutoRetries) return;

            connectAttemptRef.current += 1;
            const delay = 600 * connectAttemptRef.current;

            terminal.writeln(`\r\n\x1b[33mRetrying in ${Math.round(delay / 100) / 10}s (${connectAttemptRef.current}/${maxAutoRetries})…\x1b[0m`);

            if (reconnectTimerRef.current) {
                window.clearTimeout(reconnectTimerRef.current);
            }

            reconnectTimerRef.current = window.setTimeout(() => {
                terminal.writeln(`\x1b[90mReconnecting (${reason})…\x1b[0m`);
                connect();
            }, delay);
        };

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;
            let everOpened = false;

            ws.onopen = () => {
                everOpened = true;
                terminal.writeln('\x1b[32m✓ Connected to proxy\x1b[0m');
                terminal.writeln('\x1b[90mAuthenticating with GitHub...\x1b[0m');

                ws.send(JSON.stringify({
                    type: 'auth',
                    token: githubToken,
                }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'auth_success':
                            terminal.writeln('\x1b[32m✓ Authenticated\x1b[0m');
                            terminal.writeln('\x1b[90mEstablishing session...\x1b[0m');
                            break;
                        case 'connected':
                            terminal.writeln('\x1b[32m✓ Session established\x1b[0m');
                            terminal.writeln('');
                            updateStatus('connected');
                            break;
                        case 'output':
                            terminal.write(data.data);
                            break;
                        case 'error':
                            terminal.writeln(`\x1b[31mError: ${data.message}\x1b[0m`);
                            updateStatus('error', data.message);
                            onError?.(data.message);
                            break;
                        case 'disconnected':
                            terminal.writeln('\x1b[33mDisconnected from codespace\x1b[0m');
                            updateStatus('disconnected');
                            break;
                    }
                } catch {
                    // Raw data from terminal
                    terminal.write(event.data);
                }
            };

            ws.onerror = () => {
                terminal.writeln('\r\n\x1b[31m✗ WebSocket connection error\x1b[0m');
                updateStatus('error', 'WebSocket connection failed');
                onError?.('WebSocket connection failed');
            };

            ws.onclose = () => {
                updateStatus('disconnected');
                wsRef.current = null;

                // If we never opened successfully, auto-retry a couple of times
                if (!everOpened) {
                    scheduleReconnect('initial connect failed');
                }
            };

            // Handle terminal input
            onDataDisposableRef.current = terminal.onData((data) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'input', data }));
                }
            });

        } catch (err) {
            terminal.writeln(`\x1b[31mFailed to connect: ${err}\x1b[0m`);
            updateStatus('error', `Connection failed: ${err}`);
            onError?.(`Connection failed: ${err}`);
        }
    }, [codespaceName, githubToken, updateStatus, onError]);

    // Connect on mount
    useEffect(() => {
        connectAttemptRef.current = 0;
        if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }

        const timer = window.setTimeout(() => {
            connect();
        }, 250);

        return () => {
            window.clearTimeout(timer);
            if (reconnectTimerRef.current) {
                window.clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            onDataDisposableRef.current?.dispose();
            onDataDisposableRef.current = null;
            wsRef.current?.close();
        };
    }, [connect]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (fitAddon.current && terminalInstance.current) {
                fitAddon.current.fit();
                
                // Send resize event to server
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'resize',
                        cols: terminalInstance.current.cols,
                        rows: terminalInstance.current.rows,
                    }));
                }
            }
        };

        // Debounce resize
        let resizeTimer: ReturnType<typeof setTimeout>;
        const debouncedResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(handleResize, 100);
        };

        window.addEventListener('resize', debouncedResize);
        
        // Also observe container size changes
        const resizeObserver = new ResizeObserver(debouncedResize);
        if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
        }

        return () => {
            window.removeEventListener('resize', debouncedResize);
            resizeObserver.disconnect();
            clearTimeout(resizeTimer);
        };
    }, []);

    const handleRetry = useCallback(() => {
        setShowErrorOverlay(false);
        setLastError(null);
        connectAttemptRef.current = 0;
        // Force a reconnect by clearing state then calling connect
        if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        // Small delay to let state update
        window.setTimeout(() => {
            if (terminalInstance.current) {
                terminalInstance.current.writeln('\r\n\x1b[90mRetrying connection...\x1b[0m');
            }
            // Trigger connection by calling connect directly
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
            const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
            if (supabaseUrl && apikey && terminalInstance.current) {
                const terminal = terminalInstance.current;
                onDataDisposableRef.current?.dispose();
                onDataDisposableRef.current = null;
                try { wsRef.current?.close(); } catch { /* ignore */ }
                wsRef.current = null;
                updateStatus('connecting');

                const wsProtocol = supabaseUrl.startsWith('https') ? 'wss' : 'ws';
                const wsHost = supabaseUrl.replace(/^https?:\/\//, '');
                const params = new URLSearchParams({ codespace: codespaceName, apikey });
                const wsUrl = `${wsProtocol}://${wsHost}/functions/v1/codespace-shell?${params.toString()}`;

                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                ws.onopen = () => {
                    terminal.writeln('\x1b[32m✓ Connected to proxy\x1b[0m');
                    terminal.writeln('\x1b[90mAuthenticating with GitHub...\x1b[0m');
                    ws.send(JSON.stringify({ type: 'auth', token: githubToken }));
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        switch (data.type) {
                            case 'auth_success':
                                terminal.writeln('\x1b[32m✓ Authenticated\x1b[0m');
                                terminal.writeln('\x1b[90mEstablishing session...\x1b[0m');
                                break;
                            case 'connected':
                                terminal.writeln('\x1b[32m✓ Session established\x1b[0m');
                                terminal.writeln('');
                                updateStatus('connected');
                                break;
                            case 'output':
                                terminal.write(data.data);
                                break;
                            case 'error':
                                terminal.writeln(`\x1b[31mError: ${data.message}\x1b[0m`);
                                updateStatus('error', data.message);
                                onError?.(data.message);
                                break;
                            case 'disconnected':
                                terminal.writeln('\x1b[33mDisconnected from codespace\x1b[0m');
                                updateStatus('disconnected');
                                break;
                        }
                    } catch {
                        terminal.write(event.data);
                    }
                };

                ws.onerror = () => {
                    terminal.writeln('\r\n\x1b[31m✗ WebSocket connection error\x1b[0m');
                    updateStatus('error', 'WebSocket connection failed');
                    onError?.('WebSocket connection failed');
                };

                ws.onclose = () => {
                    updateStatus('disconnected');
                    wsRef.current = null;
                };

                onDataDisposableRef.current = terminal.onData((data) => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'input', data }));
                    }
                });
            }
        }, 100);
    }, [codespaceName, githubToken, updateStatus, onError]);

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
        // Component will reconnect on status change
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
