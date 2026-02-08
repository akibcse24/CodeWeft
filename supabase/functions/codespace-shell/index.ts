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

Deno.serve(async (req) => {
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
    const { socket, response } = Deno.upgradeWebSocket(req);

    let authenticated = false;
    let githubToken: string | null = null;
    let username: string | null = null;

    socket.onopen = () => {
        console.log(`WebSocket opened for codespace: ${codespaceName}`);
    };

    socket.onmessage = async (event) => {
        try {
            const message: ClientMessage = JSON.parse(event.data);

            switch (message.type) {
                case "auth": {
                    const authResult = await verifyGitHubToken(message.token);
                    
                    if (authResult.valid) {
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
                                    "\x1b[90mTip: Use the 'Copy SSH Command' button to run locally\x1b[0m",
                                    "",
                                ].join("\r\n");
                                
                                socket.send(JSON.stringify({ 
                                    type: "output", 
                                    data: helpMessage,
                                }));
                            }, 500);

                        } catch (error) {
                            socket.send(JSON.stringify({
                                type: "error",
                                message: `Failed to access codespace: ${error.message}`,
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
                    
                    // Echo back input for now (simulated shell)
                    // In a full implementation, this would forward to the SSH connection
                    // For demo purposes, we'll just echo and provide some basic responses
                    
                    const input = message.data;
                    
                    // Handle some basic commands
                    if (input === "\r" || input === "\n") {
                        socket.send(JSON.stringify({ 
                            type: "output", 
                            data: "\r\n$ ",
                        }));
                    } else if (input === "\x03") {
                        // Ctrl+C
                        socket.send(JSON.stringify({ 
                            type: "output", 
                            data: "^C\r\n$ ",
                        }));
                    } else {
                        // Echo the character
                        socket.send(JSON.stringify({ 
                            type: "output", 
                            data: input,
                        }));
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

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
        console.log(`WebSocket closed for codespace: ${codespaceName}`);
    };

    return response;
});
