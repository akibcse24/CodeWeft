import { useState } from "react";
import { Tldraw } from "tldraw";
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
    Box,
    Network
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

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

// Simplified Sticker approach (since direct Tldraw store injection requires complex useEditor hooks which might conflict with basic Tldraw usage here)
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

    // Since we can't easily interface with the internal Tldraw editor from outside without using their specific Context/Hook structure in a child component
    // We will offer "Copy to Clipboard" which Tldraw supports pasting.
    const copyTemplate = (json: string) => {
        navigator.clipboard.writeText(json);
        toast({ title: "Template Copied", description: "Press Ctrl+V on the whiteboard to paste." });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] animate-fade-in relative group">
            <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <MoveLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">System Design Studio</h1>
                        <p className="text-xs text-muted-foreground">Architect systems with infinite canvas.</p>
                    </div>
                </div>

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

            <div className="flex-1 relative overflow-hidden">
                {/* Tldraw wrapper to ensure it fits the container */}
                <div className="absolute inset-0">
                    <Tldraw
                        inferDarkMode={true}
                        persistenceKey="my-personal-whiteboard" // Persist locally automatically
                    />
                </div>
            </div>
        </div>
    );
}
