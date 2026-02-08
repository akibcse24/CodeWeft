import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string | number;
  actions?: HeaderAction[];
  breadcrumbs?: Breadcrumb[];
  className?: string;
  children?: ReactNode;
}

interface HeaderAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
}

interface Breadcrumb {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className,
  children,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("space-y-4 pb-6 border-b", className)}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <span className="opacity-50">/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="font-medium text-foreground">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {badge && (
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground mt-1 max-w-2xl">{description}</p>
          )}
        </div>

        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  "hover:scale-105 active:scale-95",
                  action.primary
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                  action.variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
                  action.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {children}
    </motion.div>
  );
}
