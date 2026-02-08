import { motion } from "framer-motion";
import { FileText, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";

type Page = Tables<"pages">;

interface SubPagesListProps {
  subPages: Page[];
  onSelectPage: (pageId: string) => void;
  onCreateSubPage: () => void;
}

export function SubPagesList({ subPages, onSelectPage, onCreateSubPage }: SubPagesListProps) {
  if (subPages.length === 0) {
    return (
      <div className="mt-8 pt-6 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={onCreateSubPage}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add a sub-page
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Sub-pages</h3>
        <Button variant="ghost" size="sm" onClick={onCreateSubPage}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
      
      <div className="grid gap-2">
        {subPages.map((page, index) => (
          <motion.div
            key={page.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onSelectPage(page.id)}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{page.icon || "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{page.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {format(new Date(page.updated_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
