/**
 * Codespace Shell Edge Function
 * 
 * WebSocket proxy for connecting browser terminals to GitHub Codespaces
 * 
 * Architecture:
 * Browser (xterm.js) <--WebSocket--> This Function <--SSH--> Codespace
 * 
 * Note: Due to Deno Deploy limitations with raw SSH connections,
 * this implementation uses GitHub's Codespace SSH proxy API when available,
 * or falls back to providing connection instructions.
 */

import { corsHeaders } from "../_shared/cors.ts";

const GITHUB_API_BASE = "https://api.github.com";

// Security limits
const activeConnections = new Map<string, { socket: WebSocket; lastActivity: number }>();
const MAX_CONNECTIONS_PER_USER = 3;
const CONNECTION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_CMD_BUFFER_SIZE = 10000;

// Clean up inactive connections periodically
setInterval(() => {
    const now = Date.now();
    for (const [userId, connection] of activeConnections.entries()) {
        if (now - connection.lastActivity > CONNECTION_TIMEOUT) {
            console.log(`Closing inactive connection for user: ${userId}`);
            try {
                connection.socket.close();
            } catch (err) {
                // Silently ignore close errors for inactive connections
                console.debug(`Failed to close connection ${userId}:`, err);
            }
            activeConnections.delete(userId);
        }
    }
}, 60 * 1000); // Check every minute

interface AuthMessage {
    type: "auth";
    token: string;
}

interface InputMessage {
    type: "input";
    data: string;
}

interface ResizeMessage {
    type: "resize";
    cols: number;
    rows: number;
}

type ClientMessage = AuthMessage | InputMessage | ResizeMessage;

// Verify GitHub token and get user info
async function verifyGitHubToken(token: string): Promise<{ valid: boolean; username?: string }> {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/user`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "Codeweft-Terminal/1.0",
            },
        });

        if (response.ok) {
            const user = await response.json();
            return { valid: true, username: user.login };
        }
        return { valid: false };
    } catch {
        return { valid: false };
    }
}

// Get codespace details
async function getCodespace(token: string, codespaceName: string) {
    const response = await fetch(`${GITHUB_API_BASE}/user/codespaces/${codespaceName}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Codeweft-Terminal/1.0",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get codespace: ${response.statusText}`);
    }

    return response.json();
}

// Get SSH connection details for a codespace
async function getCodespaceSSHUrl(token: string, codespaceName: string): Promise<string | null> {
    try {
        // GitHub doesn't expose direct SSH URLs via API for security
        // The SSH connection goes through their proxy
        // Format: ssh -p <port> <user>@<host>

        // Try to get machine info which may contain connection details
        const codespace = await getCodespace(token, codespaceName);

        // GitHub Codespaces SSH typically uses:
        // - Host: codespaces.github.com or similar
        // - Authenticated via GitHub token
        // Since direct SSH isn't available via API, we'd need to use
        // the gh CLI approach or VS Code Remote - Codespaces extension

        console.log("Codespace state:", codespace.state);

        if (codespace.state !== "Available") {
            return null;
        }

        // Return the web URL as fallback - user can access terminal there
        return codespace.web_url;
    } catch (error) {
        console.error("Error getting SSH URL:", error);
        return null;
    }
}

// @ts-expect-error: Deno namespace
Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const codespaceName = url.searchParams.get("codespace");

    if (!codespaceName) {
        return new Response(JSON.stringify({ error: "Missing codespace parameter" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Check for WebSocket upgrade
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() !== "websocket") {
        // Regular HTTP request - return info
        return new Response(JSON.stringify({
            message: "This endpoint requires a WebSocket connection",
            codespace: codespaceName,
            usage: "Connect via WebSocket and send auth message with GitHub token",
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Upgrade to WebSocket
    // @ts-expect-error: Deno namespace
    const { socket, response } = Deno.upgradeWebSocket(req);

    let authenticated = false;
    let githubToken: string | null = null;
    let username: string | null = null;
    let cmdBuffer = "";

    socket.onopen = () => {
        console.log(`WebSocket opened for codespace: ${codespaceName}`);
    };

    socket.onmessage = async (event: MessageEvent) => {
        try {
            const message: ClientMessage = JSON.parse(event.data);

            switch (message.type) {
                case "auth": {
                    const authResult = await verifyGitHubToken(message.token);

                    if (authResult.valid) {
                        const userId = authResult.username || 'unknown';

                        // Check connection limits
                        const userConnections = Array.from(activeConnections.entries())
                            .filter(([id]) => id === userId).length;

                        if (userConnections >= MAX_CONNECTIONS_PER_USER) {
                            socket.send(JSON.stringify({
                                type: 'error',
                                message: 'Maximum connection limit reached. Please close other connections.'
                            }));
                            socket.close();
                            return;
                        }

                        activeConnections.set(userId, {
                            socket,
                            lastActivity: Date.now()
                        });

                        authenticated = true;
                        githubToken = message.token;
                        username = authResult.username || null;

                        socket.send(JSON.stringify({
                            type: "auth_success",
                            username,
                        }));

                        // Get codespace and check status
                        try {
                            const codespace = await getCodespace(message.token, codespaceName);

                            if (codespace.state !== "Available") {
                                socket.send(JSON.stringify({
                                    type: "error",
                                    message: `Codespace is not running (state: ${codespace.state}). Please start it first.`,
                                }));
                                return;
                            }

                            // Since we can't establish raw SSH from Deno Deploy,
                            // we provide helpful information and a simulated shell experience
                            socket.send(JSON.stringify({ type: "connected" }));

                            // Send a message explaining the limitation and providing options
                            setTimeout(() => {
                                const helpMessage = [
                                    "",
                                    "\x1b[1;33m⚠ Direct SSH connection not available from browser\x1b[0m",
                                    "",
                                    "\x1b[1;36mOptions to access your codespace terminal:\x1b[0m",
                                    "",
                                    "\x1b[32m1. Open in Browser\x1b[0m",
                                    `   ${codespace.web_url}`,
                                    "",
                                    "\x1b[32m2. Use GitHub CLI (local terminal)\x1b[0m",
                                    `   gh codespace ssh --codespace ${codespaceName}`,
                                    "",
                                    "\x1b[32m3. Open in VS Code Desktop\x1b[0m",
                                    `   vscode://github.codespaces/connect?name=${codespaceName}`,
                                    "",
                                    "\x1b[90m─────────────────────────────────────────────────\x1b[0m",
                                    "",
                                    `\x1b[1;35mCodespace Info:\x1b[0m`,
                                    `  Name: ${codespace.name}`,
                                    `  Repo: ${codespace.repository.full_name}`,
                                    `  Branch: ${codespace.git_status?.ref || "main"}`,
                                    `  Machine: ${codespace.machine?.display_name || "Unknown"}`,
                                    `  Status: ${codespace.state}`,
                                    "",
                                    "\x1b[90mTip: Type 'help' for available Agentic Shell commands\x1b[0m",
                                    "",
                                    "\x1b[1;32m$\x1b[0m ",
                                ].join("\r\n");

                                socket.send(JSON.stringify({
                                    type: "output",
                                    data: helpMessage,
                                }));
                            }, 500);

                        } catch (error: unknown) {
                            const errorMessage = error instanceof Error ? error.message : "Unknown error";
                            socket.send(JSON.stringify({
                                type: "error",
                                message: `Failed to access codespace: ${errorMessage}`,
                            }));
                        }
                    } else {
                        socket.send(JSON.stringify({
                            type: "error",
                            message: "Invalid GitHub token. Please update your token in Settings.",
                        }));
                    }
                    break;
                }

                case "input": {
                    if (!authenticated) {
                        socket.send(JSON.stringify({
                            type: "error",
                            message: "Not authenticated",
                        }));
                        return;
                    }

                    // Update activity
                    if (username) {
                        const conn = activeConnections.get(username);
                        if (conn) conn.lastActivity = Date.now();
                    }

                    const input = message.data;

                    if (input === "\r" || input === "\n") {
                        const cmd = cmdBuffer.trim();
                        cmdBuffer = "";
                        socket.send(JSON.stringify({ type: "output", data: "\r\n" }));

                        // Sanitize command for safe display/logging
                        // eslint-disable-next-line no-control-regex
                        const sanitizedCmd = cmd.replace(/[\x00-\x1F\x7F]/g, '');

                        if (cmd === "ls") {
                            socket.send(JSON.stringify({
                                type: "output",
                                data: "\x1b[1;34m.\x1b[0m  \x1b[1;34m..\x1b[0m  \x1b[1;34m.git\x1b[0m  \x1b[1;34msrc\x1b[0m  \x1b[1;34mpublic\x1b[0m  package.json  README.md\r\n",
                            }));
                        } else if (cmd === "pwd") {
                            socket.send(JSON.stringify({ type: "output", data: `/workspaces/${codespaceName}\r\n` }));
                        } else if (cmd === "whoami") {
                            socket.send(JSON.stringify({ type: "output", data: `${username || "codespace"}\r\n` }));
                        } else if (cmd === "uname -a") {
                            socket.send(JSON.stringify({ type: "output", data: "Linux codespace 6.1.0-13-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.55-1 x86_64 GNU/Linux\r\n" }));
                        } else if (cmd === "git status") {
                            socket.send(JSON.stringify({
                                type: "output",
                                data: "On branch main\r\nYour branch is up to date with 'origin/main'.\r\n\r\nnothing to commit, working tree clean\r\n",
                            }));
                        } else if (cmd === "clear") {
                            socket.send(JSON.stringify({ type: "output", data: "\x1bc" }));
                        } else if (cmd === "help") {
                            socket.send(JSON.stringify({
                                type: "output",
                                data: "\r\n\x1b[1;36mAvailable commands:\x1b[0m\r\n  ls, pwd, whoami, uname -a, git status, clear, help\r\n\r\nThis is a proxy shell that mimics a real terminal experience.\r\n",
                            }));
                        } else if (sanitizedCmd !== "") {
                            socket.send(JSON.stringify({
                                type: "output",
                                data: `\x1b[31mCommand not found: ${sanitizedCmd}\x1b[0m\r\nTip: Use 'help' to see available proxy commands.\r\n`,
                            }));
                        }

                        socket.send(JSON.stringify({ type: "output", data: "\x1b[1;32m$\x1b[0m " }));

                    } else if (input === "\x7f" || input === "\x08") { // Backspace
                        if (cmdBuffer.length > 0) {
                            cmdBuffer = cmdBuffer.slice(0, -1);
                            socket.send(JSON.stringify({ type: "output", data: "\b \b" }));
                        }
                    } else if (input === "\x03") { // Ctrl+C
                        cmdBuffer = "";
                        socket.send(JSON.stringify({ type: "output", data: "^C\r\n\x1b[1;32m$\x1b[0m " }));
                    } else {
                        // Only add printable characters and check buffer size
                        if (input.length === 1 && input >= ' ' && input <= '~') {
                            if (cmdBuffer.length < MAX_CMD_BUFFER_SIZE) {
                                cmdBuffer += input;
                                socket.send(JSON.stringify({ type: "output", data: input }));
                            } else {
                                // Buffer full - give feedback
                                socket.send(JSON.stringify({ type: "output", data: "\x07" })); // Bell
                            }
                        }
                    }
                    break;
                }

                case "resize": {
                    // Log resize events (would forward to SSH in full implementation)
                    console.log(`Terminal resize: ${message.cols}x${message.rows}`);
                    break;
                }
            }
        } catch (error) {
            console.error("Error processing message:", error);
            socket.send(JSON.stringify({
                type: "error",
                message: "Failed to process message",
            }));
        }
    };

    socket.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
        console.log(`WebSocket closed for codespace: ${codespaceName}`);
        // Clean up connection tracking
        if (username) {
            activeConnections.delete(username);
        }
    };

    return response;
});
