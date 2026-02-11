import { useState, useEffect, useCallback, useRef } from "react";
import {
    Tldraw,
    Editor,
    TLStoreSnapshot,
    TLRecord
} from "tldraw";
import "tldraw/tldraw.css";
import {
    MoveLeft,
    LayoutTemplate,
    Server,
    Database,
    Globe,
    Smartphone,
    Shield,
    Zap,
    Network
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const TEMPLATES = [
    {
        name: "Microservices",
        icon: Network,
        desc: "API Gateway pattern with multiple services",
        json: `{"store":{"document":{"store":{"pages":{"page:page":{"id":"page:page","typeName":"page","name":"Page 1","index":"a1","meta":{}}},"shapes":{"shape:gate":{"x":200,"y":200,"type":"geo","props":{"geo":"rectangle","w":100,"h":60,"text":"API Gateway"},"typeName":"shape"},"shape:s1":{"x":400,"y":100,"type":"geo","props":{"geo":"rectangle","w":100,"h":60,"text":"Auth Service"},"typeName":"shape"},"shape:s2":{"x":400,"y":300,"type":"geo","props":{"geo":"rectangle","w":100,"h":60,"text":"User Service"},"typeName":"shape"},"shape:db":{"x":600,"y":300,"type":"geo","props":{"geo":"cylinder","w":80,"h":80,"text":"DB"},"typeName":"shape"}},"schema":{"schemaVersion":1,"storeVersion":4,"recordVersions":{"asset":1,"camera":1,"document":2,"instance":24,"instance_page_state":5,"page":1,"shape":3,"user":1,"user_document":1,"user_presence":5}}}}}`
    },
    {
        name: "Load Balancer",
        icon: Zap,
        desc: "Horizontal scaling setup",
        json: `{"store":{"document":{"store":{"pages":{"page:page":{"id":"page:page","typeName":"page","name":"Page 1","index":"a1","meta":{}}},"shapes":{"shape:lb":{"x":300,"y":200,"type":"geo","props":{"geo":"rhombus","w":100,"h":100,"text":"Load Balancer"},"typeName":"shape"},"shape:s1":{"x":500,"y":100,"type":"geo","props":{"geo":"rectangle","w":100,"h":60,"text":"Server 1"},"typeName":"shape"},"shape:s2":{"x":500,"y":300,"type":"geo","props":{"geo":"rectangle","w":100,"h":60,"text":"Server 2"},"typeName":"shape"}},"schema":{"schemaVersion":1,"storeVersion":4,"recordVersions":{"asset":1,"camera":1,"document":2,"instance":24,"instance_page_state":5,"page":1,"shape":3,"user":1,"user_document":1,"user_presence":5}}}}}`
    }
];

const STICKERS = [
    { name: "Server", icon: Server },
    { name: "Database", icon: Database },
    { name: "Client", icon: Smartphone },
    { name: "Firewall", icon: Shield },
    { name: "Cache", icon: Zap },
];

export default function Whiteboard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { session } = useAuth();
    const [editor, setEditor] = useState<Editor>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [snapshot, setSnapshot] = useState<TLStoreSnapshot | null>(null);
    const dbRecordIdRef = useRef<string | null>(null);

    // Load initial data
    useEffect(() => {
        if (!session?.user?.id) {
            setIsLoading(false);
            return;
        }

        const loadWhiteboard = async () => {
            try {

                const { data, error } = await supabase
                    .from('whiteboards')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('updated_at', { ascending: false })
                    .limit(1)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error loading whiteboard:', error);
                    toast({
                        variant: "destructive",
                        title: "Error loading whiteboard",
                        description: error.message
                    });
                }

                if (data) {
                    dbRecordIdRef.current = data.id;

                    if (data.content && typeof data.content === 'object') {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setSnapshot(data.content as any);
                    }
                }
            } catch (err) {
                console.error("Failed to load whiteboard", err);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            if (isLoading) {
                console.warn("Whiteboard load timed out, showing board anyway");
                setIsLoading(false);
            }
        }, 8000); // 8 second safety timeout

        loadWhiteboard();
        return () => clearTimeout(timeoutId);
    }, [session?.user?.id, toast, isLoading]);

    // Handle Editor Mount and Persistence
    const handleMount = useCallback((editorInstance: Editor) => {
        setEditor(editorInstance);

        // Force a resize check after mount to ensure canvas is visible
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);

        // If we have a snapshot from DB, load it
        if (snapshot) {
            console.log("Loading snapshot from DB");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (editorInstance as any).loadSnapshot(snapshot);
        }

        // Subscribe to changes and debounce save
        let timeoutId: NodeJS.Timeout;

        const cleanup = editorInstance.store.listen(
            () => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(async () => {
                    if (!session?.user?.id) return;

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const newSnapshot = (editorInstance as any).getSnapshot();

                    try {
                        if (dbRecordIdRef.current) {
                            // Update existing

                            const { error } = await supabase
                                .from('whiteboards')
                                .update({
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    content: newSnapshot as any,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', dbRecordIdRef.current);

                            if (error) throw error;
                        } else {
                            // Create new

                            const { data, error } = await supabase
                                .from('whiteboards')
                                .insert({
                                    user_id: session.user.id,
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    content: newSnapshot as any,
                                    name: "My Whiteboard"
                                })
                                .select()
                                .single();

                            if (error) throw error;
                            if (data) dbRecordIdRef.current = data.id;
                        }
                    } catch (err) {
                        console.error("Failed to save whiteboard", err);
                        // Optional: show a small indicator or toast on failure? 
                        // Probably don't want to spam toasts on every autosave fail though.
                    }
                }, 2000); // 2 second debounce
            },
            { scope: 'document', source: 'user' }
        );

        return () => {
            clearTimeout(timeoutId);
            cleanup();
        };
    }, [snapshot, session?.user?.id]);

    const copyTemplate = (json: string) => {
        navigator.clipboard.writeText(json);
        toast({ title: "Template Copied", description: "Press Ctrl+V on the whiteboard to paste." });
    };

    const handleReset = async () => {
        if (!confirm("This will clear your current whiteboard. Are you sure?")) return;

        try {
            if (dbRecordIdRef.current) {

                await supabase.from('whiteboards').delete().eq('id', dbRecordIdRef.current);
                dbRecordIdRef.current = null;
            }
            window.location.reload();
        } catch (e) {
            console.error("Failed to reset whiteboard storage", e);
            window.location.reload();
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading your whiteboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[85vh] w-full animate-fade-in relative group isolate border rounded-lg overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <MoveLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">System Design Studio</h1>
                        <p className="text-xs text-muted-foreground">Architect systems with infinite canvas.</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                        Reset Board
                    </Button>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <LayoutTemplate className="h-4 w-4 text-indigo-500" /> Templates
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-[300px]">
                            <SheetHeader>
                                <SheetTitle>Architectural Patterns</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 space-y-4">
                                {TEMPLATES.map(t => (
                                    <Card key={t.name} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => copyTemplate(t.json)}>
                                        <CardContent className="p-4 flex items-center gap-3">
                                            <div className="p-2 rounded bg-indigo-500/10 text-indigo-500">
                                                <t.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">{t.name}</h4>
                                                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                <div className="border-t pt-4 mt-6">
                                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Quick Stickers</h4>
                                    <p className="text-[10px] text-muted-foreground mb-4">Use the built-in toolbar for shapes. These are conceptual shortcuts.</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {STICKERS.map(s => (
                                            <Button key={s.name} variant="ghost" className="justify-start gap-2 h-8 text-xs">
                                                <s.icon className="h-3 w-3" /> {s.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                <div className="absolute inset-0">
                    <ErrorBoundary
                        onReset={handleReset}
                        fallback={
                            <div className="flex flex-col items-center justify-center h-full space-y-4 p-8 text-center">
                                <h2 className="text-xl font-bold">Whiteboard crashed</h2>
                                <p className="text-muted-foreground max-w-md">
                                    The whiteboard encountered an error.
                                </p>
                                <Button onClick={handleReset} variant="destructive">
                                    Reset Whiteboard Data
                                </Button>
                            </div>
                        }
                    >
                        <Tldraw
                            inferDarkMode={true}
                            onMount={handleMount}
                        // Removing persistenceKey disables local storage sync
                        />
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    );
}
