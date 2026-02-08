import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePages } from '@/hooks/usePages';

interface BreadcrumbBlockProps {
  id: string;
  pageId?: string;
  onNavigate?: (pageId: string) => void;
}

interface PageInfo {
  id: string;
  title: string;
  icon?: string;
}

export function BreadcrumbBlock({ 
  id, 
  pageId,
  onNavigate 
}: BreadcrumbBlockProps) {
  const { getPagePath } = usePages();
  const [path, setPath] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pageId) {
      setLoading(false);
      return;
    }

    const loadPath = async () => {
      try {
        const pages = await getPagePath(pageId);
        setPath(pages.map(p => ({
          id: p.id,
          title: p.title,
          icon: p.icon || undefined,
        })));
      } catch (error) {
        console.error('Failed to load page path:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPath();
  }, [pageId, getPagePath]);

  if (loading) {
    return (
      <div className="py-2 flex items-center gap-2">
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        <ChevronRight className="h-3 w-3 text-muted-foreground" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (path.length === 0) {
    return (
      <motion.div 
        className="py-2 flex items-center gap-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </motion.div>
    );
  }

  return (
    <motion.nav 
      className="py-2 flex items-center gap-1 flex-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      aria-label="Breadcrumb"
    >
      <button
        onClick={() => onNavigate?.('')}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </button>

      {path.map((page, index) => (
        <div key={page.id} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          <motion.button
            onClick={() => onNavigate?.(page.id)}
            className={cn(
              "flex items-center gap-1.5 text-sm px-1.5 py-0.5 rounded transition-colors",
              index === path.length - 1
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {page.icon ? (
              <span className="text-base">{page.icon}</span>
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            <span className="max-w-[150px] truncate">{page.title}</span>
          </motion.button>
        </div>
      ))}
    </motion.nav>
  );
}
