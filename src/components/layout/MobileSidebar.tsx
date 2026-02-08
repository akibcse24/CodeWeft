import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, X, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { mainNavItems, githubNavItems, toolsNavItems } from "./AppSidebar";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const NavLink = ({
    to,
    icon: Icon,
    label,
    badge,
  }: {
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    badge?: string;
  }) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
        location.pathname === to
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            <span>CodeWeft</span>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="p-4 space-y-6">
            {/* Main Navigation */}
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Main
              </h3>
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  icon={item.icon}
                  label={item.title}
                  badge={'badge' in item ? (item.badge as string) : undefined}
                />
              ))}
            </div>

            {/* GitHub Navigation */}
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                GitHub
              </h3>
              {githubNavItems.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  icon={item.icon}
                  label={item.title}
                />
              ))}
            </div>

            {/* Tools Navigation */}
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Tools
              </h3>
              {toolsNavItems.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  icon={item.icon}
                  label={item.title}
                />
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t p-4 bg-background">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
