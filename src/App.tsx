import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { CommandPaletteProvider } from "@/hooks/useCommandPalette";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { FocusProvider } from "@/contexts/FocusContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Pages
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Tasks from "./pages/Tasks";
import Courses from "./pages/Courses";
import DSA from "./pages/DSA";
import Resources from "./pages/Resources";
import Flashcards from "./pages/Flashcards";
import Pomodoro from "./pages/Pomodoro";
import Habits from "./pages/Habits";
import Projects from "./pages/Projects";
import MLNotes from "./pages/MLNotes";
import Papers from "./pages/Papers";
import Datasets from "./pages/Datasets";
import AIAssistant from "./pages/AIAssistant";
import Analytics from "./pages/Analytics";
import CheatSheets from "./pages/CheatSheets";
import InterviewHub from "./pages/InterviewHub";
import GrowthHub from "./pages/GrowthHub";
import BuilderHub from "./pages/BuilderHub";
import RegexLab from "./pages/RegexLab";
import AlgoVisualizer from "./pages/AlgoVisualizer";
import DevUtils from "./pages/DevUtils";
import CodeType from "./pages/CodeType";
import ThemeForge from "./pages/ThemeForge";
import AssetStudio from "./pages/AssetStudio";
import SecretsVault from "./pages/SecretsVault";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { GraphView } from "./pages/Graph";
import GitHubRepositories from "./pages/GitHubRepositories";
import GitHubEditor from "./pages/GitHubEditor";
import GitHubBranches from "./pages/GitHubBranches";
import GitHubGists from "./pages/GitHubGists";
import GitHubGistEditor from "./pages/GitHubGistEditor";
import GitHubGistViewer from "./pages/GitHubGistViewer";
import GitHubActions from "./pages/GitHubActions";
import GitHubWorkflowRuns from "./pages/GitHubWorkflowRuns";
import GitHubCodespaces from "./pages/GitHubCodespaces";
import GitHubCodespaceCreator from "./pages/GitHubCodespaceCreator";
import GitHubCodespaceTerminal from "./pages/GitHubCodespaceTerminal";
import GitHubBackup from "./pages/GitHubBackup";
import GitHubBackupExplorer from "./pages/GitHubBackupExplorer";
import Settings from "./pages/Settings";
import { GlobalSearch } from "./components/GlobalSearch";
import GitHubHub from "./pages/GitHubHub";
import GitOperations from "./pages/GitOperations";
import GitHubFileManager from "./pages/GitHubFileManager";
import GitHubFileExplorer from "./pages/GitHubFileExplorer";
import GistHub from "./pages/GistHub";
import ActionsHub from "./pages/ActionsHub";
import WorkflowDetail from "./pages/WorkflowDetail";
import DevBox from "./pages/DevBox";
import Whiteboard from "./pages/Whiteboard";
import ZenRoom from "./pages/ZenRoom";
import ApiClient from "./pages/ApiClient";

import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, persistOptions } from "@/lib/query-client";

const App = () => (
  <ErrorBoundary>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CommandPaletteProvider>
                <FocusProvider>
                  <Routes>
                  {/* Auth route without layout */}
                  <Route path="/auth" element={<Auth />} />

                  {/* All other routes with layout and protection */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/notes" element={<Notes />} />
                            <Route path="/tasks" element={<Tasks />} />
                            <Route path="/courses" element={<Courses />} />
                            <Route path="/dsa" element={<DSA />} />
                            <Route path="/resources" element={<Resources />} />
                            <Route path="/flashcards" element={<Flashcards />} />
                            <Route path="/pomodoro" element={<Pomodoro />} />
                            <Route path="/habits" element={<Habits />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/ml-notes" element={<MLNotes />} />
                            <Route path="/papers" element={<Papers />} />
                            <Route path="/datasets" element={<Datasets />} />
                            <Route path="/ai-assistant" element={<AIAssistant />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/cheat-sheets" element={<CheatSheets />} />
                            <Route path="/interview-hub" element={<InterviewHub />} />
                            <Route path="/growth-hub" element={<GrowthHub />} />
                            <Route path="/builder-hub" element={<BuilderHub />} />
                            <Route path="/regex-lab" element={<RegexLab />} />
                            <Route path="/algo-visualizer" element={<AlgoVisualizer />} />
                            <Route path="/dev-utils" element={<DevUtils />} />
                            <Route path="/code-type" element={<CodeType />} />
                            <Route path="/theme-forge" element={<ThemeForge />} />
                            <Route path="/asset-studio" element={<AssetStudio />} />
                            <Route path="/secrets" element={<SecretsVault />} />
                            <Route path="/graph" element={<GraphView />} />

                            {/* GitHub Routes */}
                            <Route path="/github" element={<GitHubHub />} />
                            <Route path="/github/operations" element={<GitOperations />} />
                            <Route path="/github/file-manager" element={<GitHubFileManager />} />
                            <Route path="/github/file-explorer" element={<GitHubFileExplorer />} />
                            <Route path="/github/repositories" element={<GitHubRepositories />} />
                            <Route path="/github/branches/:owner/:repo" element={<GitHubBranches />} />

                            {/* GitHub Editors */}
                            <Route path="/github/editor" element={<GitHubEditor />} />
                            <Route path="/github/editor/:owner/:repo" element={<GitHubEditor />} />

                            {/* GitHub Gists */}
                            <Route path="/github/gists" element={<GitHubGists />} />
                            <Route path="/github/gists/new" element={<GitHubGistEditor />} />
                            <Route path="/github/gists/:gistId" element={<GitHubGistViewer />} />
                            <Route path="/github/gists/:gistId/edit" element={<GitHubGistEditor />} />

                            {/* GitHub Actions */}
                            <Route path="/github/actions" element={<GitHubActions />} />
                            <Route path="/github/actions/:owner/:repo" element={<GitHubActions />} />
                            <Route path="/github/actions/:owner/:repo/workflows/:workflowId" element={<GitHubWorkflowRuns />} />

                            {/* GitHub Codespaces */}
                            <Route path="/github/codespaces" element={<GitHubCodespaces />} />
                            <Route path="/github/codespaces/new" element={<GitHubCodespaceCreator />} />
                            <Route path="/github/codespaces/:name/terminal" element={<GitHubCodespaceTerminal />} />
                            <Route path="/github/codespaces/new" element={<GitHubCodespaceCreator />} />

                            {/* GitHub Backups */}
                            <Route path="/github/backup" element={<GitHubBackup />} />
                            <Route path="/github/backup/:owner/:repo" element={<GitHubBackupExplorer />} />

                            {/* Shortcut Routes */}
                            <Route path="/search" element={<GlobalSearch />} />
                            <Route path="/gists" element={<GistHub />} />
                            <Route path="/actions" element={<ActionsHub />} />
                            <Route path="/actions/runs/:id" element={<WorkflowDetail />} />

                            {/* Tools Utilities */}
                            <Route path="/devbox" element={<DevBox />} />
                            <Route path="/whiteboard" element={<Whiteboard />} />
                            <Route path="/zen-room" element={<ZenRoom />} />
                            <Route path="/api-client" element={<ApiClient />} />

                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  </Routes>
                </FocusProvider>
              </CommandPaletteProvider>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  </ErrorBoundary>
);

export default App;
