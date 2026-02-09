import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { CommandPalette } from "@/components/CommandPalette";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { QuickCapture } from "@/components/QuickCapture";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useFocusMode } from "@/contexts/FocusContext";
import { cn } from "@/lib/utils";
import { FloatedAIBot } from "@/components/ai/FloatedAIBot";
import { useSync } from "@/hooks/useSync";
import { GlobalCodespaceTerminal } from "@/components/github/codespaces/GlobalCodespaceTerminal";

interface AppLayoutProps {
  children: React.ReactNode;
}

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/notes": "Notes",
  "/tasks": "Tasks",
  "/courses": "Courses",
  "/dsa": "DSA Problems",
  "/resources": "Resources",
  "/flashcards": "Flashcards",
  "/pomodoro": "Pomodoro Timer",
  "/habits": "Habit Tracker",
  "/projects": "Projects",
  "/ml-notes": "ML Notes",
  "/papers": "Papers",
  "/datasets": "Datasets",
  "/ai": "AI Assistant",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/auth": "Authentication",
};

export function AppLayout({ children }: AppLayoutProps) {
  useSync(); // Initialize background sync
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTitle = routeTitles[location.pathname] || "Page";
  const { isFocusMode } = useFocusMode();

  const handleQuickCapture = (title: string, templateId?: string) => {
    // Navigate to notes page with new note indicator
    sessionStorage.setItem('createNote', JSON.stringify({ title, templateId }));
    navigate('/notes');
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar className={cn("transition-all duration-300", isFocusMode && "-ml-64 w-0 opacity-0 overflow-hidden")} />
        <SidebarInset className="flex flex-col flex-1 transition-all duration-300">
          <header className={cn(
            "sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b px-6 transition-all duration-300",
            "glass-professional bg-background/80 backdrop-blur-xl",
            isFocusMode && "-mt-16 opacity-0 pointer-events-none"
          )}>
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 hover:bg-accent/80 transition-colors rounded-lg" />
              <Separator orientation="vertical" className="h-6 w-[1px] bg-border/60" />
            </div>

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="hover:text-primary transition-colors">Home</BreadcrumbLink>
                </BreadcrumbItem>
                {location.pathname !== "/" && (
                  <>
                    <BreadcrumbSeparator className="opacity-40" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-medium text-foreground">{currentTitle}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-2">
              <ChatPanel pageId={searchParams.get("id") || undefined} />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-24 animate-slide-up">
            {children}
          </main>
        </SidebarInset>

        {/* Floating Action Groups */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
          <GlobalCodespaceTerminal />
          <QuickCapture onCreateNote={handleQuickCapture} />
          <FloatedAIBot />
        </div>
      </div>
    </SidebarProvider>
  );
}
