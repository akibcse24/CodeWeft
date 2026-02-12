import { useState } from "react";
import { Github, CheckCircle, XCircle, Loader2, ExternalLink, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useGitHub } from "@/hooks/useGitHub";
import { useAuth } from "@/hooks/useAuth";
import { GitHubAppSetup } from "./GitHubAppSetup";
import { toast } from "sonner";
import { NetworkTest } from "@/components/NetworkTest";

export function GitHubSettings() {
  const {
    settings,
    settingsLoading,
    isConnected,
    testConnection,
    saveSettings,
    disconnect,
    syncFromSession,
  } = useGitHub();
  const { signInWithGithub, session } = useAuth();

  const [token, setToken] = useState("");
  const [solutionsRepo, setSolutionsRepo] = useState(settings?.solutions_repo || "");
  const [testResult, setTestResult] = useState<{
    valid: boolean;
    user?: { login: string; avatar_url: string; name: string };
    error?: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    if (!token.trim()) {
      toast.error("Please enter a token");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testConnection.mutateAsync(token);
      setTestResult(result);
      if (result.valid) {
        toast.success(`Connected as @${result.user?.login}`);
      } else {
        toast.error("Invalid token");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to test connection");
      setTestResult({ valid: false });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!testResult?.valid || !testResult.user) {
      toast.error("Please test the connection first");
      return;
    }

    try {
      await saveSettings.mutateAsync({
        github_token: token,
        github_username: testResult.user.login,
        avatar_url: testResult.user.avatar_url,
        solutions_repo: solutionsRepo || undefined,
      });
      toast.success("GitHub settings saved!");
      setToken("");
      setTestResult(null);
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleOAuthConnect = async () => {
    try {
      const { error } = await signInWithGithub();
      if (error) throw error;
      // The page will redirect, token sync will happen on return (if we implement it)
    } catch (error) {
      toast.error("Failed to connect with GitHub");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect.mutateAsync();
      toast.success("GitHub disconnected");
    } catch (error) {
      console.error("Disconnect failed:", error);
      // Even if it fails, it might be due to the record already being gone or network issues.
      // We should probably clear local state or prompt user.
      toast.error("Failed to disconnect completely. Please try signing out and back in.");
    }
  };

  const handleUpdateSolutionsRepo = async () => {
    if (!settings) return;

    try {
      await saveSettings.mutateAsync({
        github_token: settings.github_token!,
        github_username: settings.github_username!,
        avatar_url: settings.avatar_url || undefined,
        solutions_repo: solutionsRepo || undefined,
      });
      toast.success("Solutions repository updated!");
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  if (settingsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Github className="h-5 w-5" /> GitHub Integration
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to sync repos and import DSA solutions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected && settings ? (
          <>
            {/* Connected State */}
            <GitHubAppSetup />

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={settings.avatar_url || undefined} />
                  <AvatarFallback>{settings.github_username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    @{settings.github_username}
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </p>
                  <a
                    href={`https://github.com/${settings.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    View profile <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnect.isPending}
              >
                {disconnect.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Unlink className="h-4 w-4 mr-1" />
                    Disconnect
                  </>
                )}
              </Button>
            </div>

            {/* Solutions Repo Setting */}
            <div className="space-y-2">
              <Label htmlFor="solutions-repo">Solutions Repository (for DSA Import)</Label>
              <div className="flex gap-2">
                <Input
                  id="solutions-repo"
                  placeholder="username/leetcode-solutions"
                  value={solutionsRepo}
                  onChange={(e) => setSolutionsRepo(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={handleUpdateSolutionsRepo}
                  disabled={saveSettings.isPending || solutionsRepo === settings.solutions_repo}
                >
                  {saveSettings.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the repository containing your DSA solutions (e.g., username/leetcode-solutions)
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Disconnected State - Setup */}

            {/* Session Detection UI */}
            {!isConnected && session?.provider_token && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 mb-4">
                <div className="flex items-center gap-3">
                  <Github className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-sm text-blue-900 dark:text-blue-100">GitHub Session Detected</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">You are signed in with GitHub. Want to use this account?</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100"
                  onClick={() => syncFromSession()}
                >
                  Connect
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="github-token">Personal Access Token</Label>
              <div className="flex gap-2">
                <Input
                  id="github-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value.trim());
                    setTestResult(null);
                  }}
                />
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting || !token.trim()}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Test"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Create a{" "}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,read:user"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Personal Access Token
                </a>{" "}
                with <code className="text-xs bg-muted px-1 rounded">repo</code> and{" "}
                <code className="text-xs bg-muted px-1 rounded">read:user</code> scopes
              </p>
            </div>

            {/* Test Result */}
            {testResult && (
              <div
                className={`flex items-center gap-3 p-3 rounded-lg ${testResult.valid
                  ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900"
                  : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
                  }`}
              >
                {testResult.valid && testResult.user ? (
                  <>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={testResult.user.avatar_url} />
                      <AvatarFallback>{testResult.user.login[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">@{testResult.user.login}</p>
                      <p className="text-xs text-muted-foreground">{testResult.user.name}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-red-600">Connection Failed</p>
                      <p className="text-xs text-red-500">{testResult.error || "Invalid token or network issue."}</p>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleOAuthConnect}
                variant="default"
                className="w-full bg-[#24292e] hover:bg-[#2c3238] text-white"
              >
                <Github className="h-4 w-4 mr-2" />
                Connect with GitHub (OAuth)
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or use a token
                  </span>
                </div>
              </div>
            </div>

            {/* Solutions Repo (optional, for setup) */}
            <div className="space-y-2">
              <Label htmlFor="solutions-repo-setup">Solutions Repository (Optional)</Label>
              <Input
                id="solutions-repo-setup"
                placeholder="username/leetcode-solutions"
                value={solutionsRepo}
                onChange={(e) => setSolutionsRepo(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Repository containing your DSA solutions for importing
              </p>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={!testResult?.valid || saveSettings.isPending}
              className="w-full"
            >
              {saveSettings.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Github className="h-4 w-4 mr-2" />
              )}
              Connect GitHub
            </Button>
          </>
        )}
      </CardContent>
      <div className="mt-4">
        <NetworkTest />
      </div>
    </Card>
  );
}
