import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { Block } from "@/types/editor.types";
import { getPageBlocks } from "@/lib/page-content";
import { Loader2, AlertCircle, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tables } from "@/integrations/supabase/types";

export default function SharedNote() {
    const { pageId } = useParams<{ pageId: string }>();
    const [page, setPage] = useState<Tables<"pages"> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPage() {
            if (!pageId) return;

            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from("pages")
                    .select("*")
                    .eq("id", pageId)
                    .single();

                if (error) throw error;
                if (!data.is_public) {
                    setError("This note is private.");
                    return;
                }

                setPage(data);
            } catch (err) {
                console.error("Error fetching shared page:", err);
                setError((err as Error).message || "Failed to load the note.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchPage();
    }, [pageId]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h1 className="text-2xl font-bold mb-2">{error || "Note not found"}</h1>
                <p className="text-muted-foreground mb-6">
                    The note you are looking for might have been deleted or is no longer public.
                </p>
                <Button onClick={() => window.location.href = "/"}>Go to Home</Button>
            </div>
        );
    }

    const blocks = getPageBlocks(page.content);

    return (
        <div className="min-h-screen bg-background">
            {/* Simple Public Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
                            <span className="text-xl">{page.icon || "📝"}</span>
                            <span className="font-semibold truncate max-w-[200px] sm:max-w-md">
                                {page.title}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mr-4">
                            <Globe className="h-3 w-3" />
                            Public Note
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.location.href = "/auth"}>
                            Sign In
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container max-w-4xl py-10 px-4">
                {page.cover_url && (
                    <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden mb-8 border shadow-sm">
                        <img
                            src={page.cover_url}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <BlockEditor
                        blocks={blocks}
                        onChange={() => { }}
                        readOnly={true}
                    />
                </div>

                <footer className="mt-20 pt-8 border-t text-center text-sm text-muted-foreground">
                    <p>Created with CodeWeft - Your Agentic Second Brain</p>
                </footer>
            </main>
        </div>
    );
}
