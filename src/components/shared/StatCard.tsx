import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  icon?: ReactNode;
  value: string | number;
  label: string;
  description?: string;
  trend?: number;
  trendLabel?: string;
  className?: string;
  color?: "blue" | "green" | "orange" | "red" | "purple" | "pink" | "default";
  size?: "default" | "compact" | "large";
}

export function StatCard({
  icon,
  value,
  label,
  description,
  trend,
  trendLabel,
  className,
  color = "default",
  size = "default",
}: StatCardProps) {
  const colorClasses = {
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    green: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    red: "text-red-500 bg-red-500/10 border-red-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    pink: "text-pink-500 bg-pink-500/10 border-pink-500/20",
    default: "text-primary bg-primary/10 border-primary/20",
  };

  const sizeClasses = {
    compact: "p-4",
    default: "p-5",
    large: "p-6",
  };

  const TrendIcon = trend && trend > 0 ? ArrowUp : trend && trend < 0 ? ArrowDown : Minus;
  const trendColor = trend && trend > 0 ? "text-emerald-500" : trend && trend < 0 ? "text-red-500" : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border bg-card shadow-sm card-lift transition-all duration-200",
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon && (
              <div className={cn("p-2 rounded-lg border", colorClasses[color])}>
                {icon}
              </div>
            )}
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
          </div>
          <p className={cn(
            "font-bold tracking-tight",
            size === "large" ? "text-3xl" : size === "compact" ? "text-xl" : "text-2xl"
          )}>
            {value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              <span className={cn("text-xs font-medium flex items-center", trendColor)}>
                {trend > 0 && <ArrowUp className="h-3 w-3 mr-0.5" />}
                {trend < 0 && <ArrowDown className="h-3 w-3 mr-0.5" />}
                {trend === 0 && <Minus className="h-3 w-3 mr-0.5" />}
                {Math.abs(trend)}%
              </span>
              {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
            </div>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface StatGridProps {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export function StatGrid({ children, className, columns = 4 }: StatGridProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridClasses[columns], className)}>
      {children}
    </div>
  );
}
