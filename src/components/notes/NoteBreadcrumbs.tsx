import { useMemo } from "react";
import { Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tables } from "@/integrations/supabase/types";

type Page = Tables<"pages">;

interface NoteBreadcrumbsProps {
  currentPage: Page;
  allPages: Page[];
  onNavigate: (pageId: string | null) => void;
}

function buildBreadcrumbPath(currentPage: Page, allPages: Page[]): Page[] {
  const path: Page[] = [];
  let current: Page | undefined = currentPage;

  while (current) {
    path.unshift(current);
    if (current.parent_id) {
      current = allPages.find(p => p.id === current!.parent_id);
    } else {
      break;
    }
  }

  return path;
}

export function NoteBreadcrumbs({ currentPage, allPages, onNavigate }: NoteBreadcrumbsProps) {
  const path = useMemo(() => buildBreadcrumbPath(currentPage, allPages), [currentPage, allPages]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => onNavigate(null)}
            className="cursor-pointer flex items-center gap-1.5"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Notes</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {path.map((page, index) => (
          <BreadcrumbItem key={page.id}>
            <BreadcrumbSeparator />
            {index === path.length - 1 ? (
              <BreadcrumbPage className="flex items-center gap-1.5">
                <span>{page.icon || "📄"}</span>
                <span className="max-w-[150px] truncate">{page.title}</span>
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink
                onClick={() => onNavigate(page.id)}
                className="cursor-pointer flex items-center gap-1.5"
              >
                <span>{page.icon || "📄"}</span>
                <span className="max-w-[100px] truncate">{page.title}</span>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
