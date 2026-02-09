import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Search,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeletedPage {
  id: string;
  title: string;
  icon?: string | null;
  deleted_at: string;
  permanently_delete_at: string;
  metadata: {
    original_path?: string;
    child_count?: number;
  } | null;
}

export default function TrashPage() {
  const navigate = useNavigate();
  const [deletedPages, setDeletedPages] = useState<DeletedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchDeletedPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("deleted_pages")
        .select("*")
        .order("deleted_at", { ascending: false });

      if (fetchError) throw fetchError;

      setDeletedPages((data as DeletedPage[]) || []);
    } catch (err) {
      console.error("Error fetching deleted pages:", err);
      setError("Failed to load trash");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeletedPages();
  }, [fetchDeletedPages]);

  const handleRestore = async (pageId: string) => {
    try {
      setRestoringId(pageId);
      setError(null);

      const { error: restoreError } = await supabase.rpc("restore_page", {
        p_page_id: pageId,
      });

      if (restoreError) throw restoreError;

      setSuccess("Page restored successfully");
      setDeletedPages((prev) => prev.filter((p) => p.id !== pageId));

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error restoring page:", err);
      setError("Failed to restore page");
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (pageId: string) => {
    if (!confirm("Are you sure you want to permanently delete this page? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(pageId);
      setError(null);

      const { error: deleteError } = await supabase
        .from("deleted_pages")
        .delete()
        .eq("id", pageId);

      if (deleteError) throw deleteError;

      setSuccess("Page permanently deleted");
      setDeletedPages((prev) => prev.filter((p) => p.id !== pageId));

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error permanently deleting page:", err);
      setError("Failed to delete page");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm("Are you sure you want to permanently delete ALL items in trash? This cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from("deleted_pages")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (deleteError) throw deleteError;

      setSuccess("Trash emptied successfully");
      setDeletedPages([]);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error emptying trash:", err);
      setError("Failed to empty trash");
    } finally {
      setLoading(false);
    }
  };

  const filteredPages = deletedPages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && deletedPages.length === 0) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trash2 className="h-8 w-8" />
            Trash
          </h1>
          <p className="text-muted-foreground mt-1">
            Items in trash are deleted after 30 days
          </p>
        </div>

        {deletedPages.length > 0 && (
          <Button variant="destructive" onClick={handleEmptyTrash}>
            <Trash2 className="w-4 h-4 mr-2" />
            Empty Trash
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-900/20">
          <AlertDescription className="text-green-700 dark:text-green-400">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {filteredPages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">Trash is empty</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? "No items match your search"
                : "Items you delete will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredPages.map((page) => (
            <Card key={page.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="text-2xl">{page.icon || "📄"}</div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{page.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      Deleted{" "}
                      {formatDistanceToNow(new Date(page.deleted_at), {
                        addSuffix: true,
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      Permanently delete{" "}
                      {format(new Date(page.permanently_delete_at), "MMM d, yyyy")}
                    </span>
                    {page.metadata?.child_count !== undefined &&
                      page.metadata?.child_count !== null &&
                      page.metadata?.child_count > 0 && (
                        <>
                          <span>•</span>
                          <span>{page.metadata.child_count} children</span>
                        </>
                      )}
                  </div>
                  {page.metadata?.original_path && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Originally in: {page.metadata.original_path}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(page.id)}
                    disabled={restoringId === page.id}
                  >
                    {restoringId === page.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-1" />
                    )}
                    Restore
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePermanentDelete(page.id)}
                    disabled={deletingId === page.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deletingId === page.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
