import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe,
    Send,
    Play,
    Trash2,
    Plus,
    Clock,
    Shield,
    ChevronRight,
    Code,
    Loader2,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestHistory {
    id: string;
    method: HttpMethod;
    url: string;
    timestamp: string;
    status?: number;
}

export default function ApiClient() {
    const { toast } = useToast();
    const [method, setMethod] = useState<HttpMethod>("GET");
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<{
        status?: number;
        statusText?: string;
        time?: number;
        data?: unknown;
        headers?: Record<string, string>;
        error?: string;
    } | null>(null);
    const [headers, setHeaders] = useState([{ key: "", value: "" }]);
    const [body, setBody] = useState("");
    const [history, setHistory] = useState<RequestHistory[]>([]);

    const addHeader = () => setHeaders([...headers, { key: "", value: "" }]);
    const removeHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index));

    const handleSend = async () => {
        if (!url) {
            toast({ title: "URL Required", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setResponse(null);

        const startTime = Date.now();
        try {
            const headerObj = headers.reduce((acc: Record<string, string>, curr) => {
                if (curr.key) acc[curr.key] = curr.value;
                return acc;
            }, {});

            const fetchOptions: RequestInit = {
                method,
                headers: headerObj,
            };

            if (["POST", "PUT", "PATCH"].includes(method) && body) {
                fetchOptions.body = body;
            }

            const res = await fetch(url, fetchOptions);
            const data = await res.json().catch(() => "No JSON response");
            const duration = Date.now() - startTime;

            setResponse({
                status: res.status,
                statusText: res.statusText,
                time: duration,
                data,
                headers: Object.fromEntries(res.headers.entries()),
            });

            // Add to history
            setHistory(prev => [{
                id: Math.random().toString(36).substr(2, 9),
                method,
                url,
                timestamp: new Date().toLocaleTimeString(),
                status: res.status
            }, ...prev.slice(0, 19)]);

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Request failed";
            toast({
                title: "Request Failed",
                description: message,
                variant: "destructive"
            });
            setResponse({ error: message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Globe className="h-8 w-8 text-indigo-500" />
                    Pocket Postman
                </h1>
                <p className="text-muted-foreground">Lightweight API testing client for your development workflow.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Panel */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="glass-card">
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex gap-2">
                                <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
                                    <SelectTrigger className="w-[120px] font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET" className="text-green-500">GET</SelectItem>
                                        <SelectItem value="POST" className="text-blue-500">POST</SelectItem>
                                        <SelectItem value="PUT" className="text-amber-500">PUT</SelectItem>
                                        <SelectItem value="DELETE" className="text-red-500">DELETE</SelectItem>
                                        <SelectItem value="PATCH" className="text-purple-500">PATCH</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="https://api.example.com/endpoint"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="font-mono"
                                />
                                <Button onClick={handleSend} disabled={isLoading} className="px-8">
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Send
                                </Button>
                            </div>

                            <Tabs defaultValue="headers" className="mt-4">
                                <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 pb-2 gap-6">
                                    <TabsTrigger value="headers" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 h-auto">Headers</TabsTrigger>
                                    <TabsTrigger value="body" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 h-auto">Body</TabsTrigger>
                                    <TabsTrigger value="auth" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 pb-2 h-auto">Auth</TabsTrigger>
                                </TabsList>

                                <TabsContent value="headers" className="space-y-3 pt-4">
                                    {headers.map((h, i) => (
                                        <div key={i} className="flex gap-2">
                                            <Input
                                                placeholder="Key"
                                                value={h.key}
                                                onChange={(e) => {
                                                    const newHeaders = [...headers];
                                                    newHeaders[i].key = e.target.value;
                                                    setHeaders(newHeaders);
                                                }}
                                            />
                                            <Input
                                                placeholder="Value"
                                                value={h.value}
                                                onChange={(e) => {
                                                    const newHeaders = [...headers];
                                                    newHeaders[i].value = e.target.value;
                                                    setHeaders(newHeaders);
                                                }}
                                            />
                                            <Button variant="ghost" size="icon" onClick={() => removeHeader(i)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={addHeader}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Header
                                    </Button>
                                </TabsContent>

                                <TabsContent value="body" className="pt-4">
                                    <Textarea
                                        placeholder="Raw JSON Body..."
                                        className="min-h-[200px] font-mono text-sm bg-muted/30"
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                    />
                                </TabsContent>

                                <TabsContent value="auth" className="pt-4 flex items-center justify-center p-8 border-dashed border rounded-lg">
                                    <div className="text-center space-y-2">
                                        <Shield className="h-10 w-10 text-muted-foreground mx-auto" />
                                        <p className="text-sm text-muted-foreground">Basic/Bearer Auth coming soon.</p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Response Panel */}
                    <AnimatePresence>
                        {response && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        Response
                                        {response.status && (
                                            <Badge variant={response.status < 400 ? "outline" : "destructive"} className={response.status < 400 ? "text-green-500 border-green-500/20" : ""}>
                                                {response.status} {response.statusText}
                                            </Badge>
                                        )}

                                    </h3>
                                    {response.time && <span className="text-xs text-muted-foreground">{response.time}ms</span>}
                                </div>

                                <Card className="glass-card overflow-hidden">
                                    <Tabs defaultValue="response-body">
                                        <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
                                            <TabsList className="bg-transparent h-auto p-0 gap-4">
                                                <TabsTrigger value="response-body" className="data-[state=active]:bg-primary h-7 px-3 text-xs">Body</TabsTrigger>
                                                <TabsTrigger value="response-headers" className="data-[state=active]:bg-primary h-7 px-3 text-xs">Headers</TabsTrigger>
                                            </TabsList>
                                            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(response.data, null, 2))}>
                                                <Code className="h-3 w-3 mr-2" /> Copy
                                            </Button>
                                        </div>
                                        <TabsContent value="response-body" className="m-0">
                                            <pre className="p-4 text-xs font-mono max-h-[500px] overflow-auto bg-slate-950 text-indigo-300">
                                                {JSON.stringify(response.data, null, 2)}
                                            </pre>
                                        </TabsContent>
                                        <TabsContent value="response-headers" className="m-0">
                                            <div className="p-4 space-y-2 max-h-[500px] overflow-auto font-mono text-xs">
                                                {Object.entries(response.headers || {}).map(([k, v]) => (
                                                    <div key={k} className="flex border-b border-muted py-1">
                                                        <span className="font-bold text-muted-foreground min-w-[150px]">{k}:</span>
                                                        <span className="text-primary truncate">{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Sidebar history */}
                <div className="space-y-6">
                    <Card className="glass-card h-full flex flex-col">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Clock className="h-4 w-4" /> History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-auto">
                            {history.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-xs">
                                    No requests yet
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {history.map((h) => (
                                        <button
                                            key={h.id}
                                            className="w-full p-3 text-left hover:bg-muted/50 transition-colors space-y-1 group"
                                            onClick={() => {
                                                setMethod(h.method);
                                                setUrl(h.url);
                                            }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className={`text-[10px] h-4 ${h.method === 'GET' ? 'text-green-500 border-green-500/20' :
                                                    h.method === 'POST' ? 'text-blue-500 border-blue-500/20' :
                                                        'text-amber-500 border-amber-500/20'
                                                    }`}>
                                                    {h.method}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground">{h.timestamp}</span>
                                            </div>
                                            <div className="text-xs font-mono truncate text-slate-400 group-hover:text-primary transition-colors">
                                                {h.url}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
