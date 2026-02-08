/**
 * Settings Page
 * 
 * Centralized configuration for the application.
 * Features:
 * - Profile (Username, Avatar)
 * - Appearance (Theme toggle)
 * - AI & Models
 * - Account (GitHub Token)
 * - App Preferences
 */

import { ThemeSelector } from "@/components/ThemeSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Monitor, User, Shield, Info, Brain, Key, Trash2, Github, Download, RefreshCw, Save, Sparkles, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { getAIConfig, saveAIConfig } from '@/services/ai.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { db } from '@/lib/db';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useGitHub } from '@/hooks/useGitHub';

export default function Settings() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile, regenerateAvatar } = useProfile();
  const { settings: githubSettings, isConnected: hasGithubConnection, testConnection, saveSettings: saveGitHubSettings, disconnect: disconnectGitHub, settingsLoading } = useGitHub();
  const [aiConfig, setAiConfig] = useState({ apiKey: "", model: "llama-3.3-70b-versatile", provider: "groq", baseUrl: "" });
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem("reduced_motion") === "true");
  const [githubToken, setGithubToken] = useState("");
  const [githubTestResult, setGithubTestResult] = useState<{ valid: boolean; username?: string; avatar?: string } | null>(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const config = getAIConfig();
    setAiConfig({
      apiKey: config.apiKey,
      model: config.model || "llama-3.3-70b-versatile",
      provider: config.provider || "groq",
      baseUrl: config.baseUrl || ""
    });
  }, []);

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("reduced_motion", reducedMotion.toString());
    if (reducedMotion) {
      document.documentElement.classList.add("reduced-motion");
    } else {
      document.documentElement.classList.remove("reduced-motion");
    }
  }, [reducedMotion]);

  const handleSaveAI = () => {
    saveAIConfig(aiConfig);
    toast({ title: "AI Settings Saved", description: "Your API key has been stored locally." });
  };

  const handleTestGithubToken = async () => {
    if (!githubToken.trim()) {
      toast({ title: "Error", description: "Please enter a GitHub token first.", variant: "destructive" });
      return;
    }
    
    try {
      const result = await testConnection.mutateAsync(githubToken);
      if (result.valid && result.user) {
        setGithubTestResult({ valid: true, username: result.user.login, avatar: result.user.avatar_url });
        toast({ title: "Connection Successful", description: `Connected as ${result.user.login}` });
      } else {
        setGithubTestResult({ valid: false });
        toast({ title: "Invalid Token", description: result.error || "Could not authenticate with GitHub.", variant: "destructive" });
      }
    } catch (error: any) {
      setGithubTestResult({ valid: false });
      toast({ title: "Connection Failed", description: error.message || "Failed to test GitHub connection.", variant: "destructive" });
    }
  };

  const handleSaveGithubToken = async () => {
    if (!githubToken.trim()) {
      toast({ title: "Error", description: "Please enter a valid GitHub token.", variant: "destructive" });
      return;
    }
    
    // Test connection first if not already tested
    if (!githubTestResult?.valid) {
      await handleTestGithubToken();
      if (!githubTestResult?.valid) return;
    }
    
    try {
      await saveGitHubSettings.mutateAsync({
        github_token: githubToken,
        github_username: githubTestResult?.username || "",
        avatar_url: githubTestResult?.avatar,
      });
      setGithubToken("");
      setGithubTestResult(null);
      toast({ title: "GitHub Connected", description: "Your GitHub account has been linked successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save GitHub settings.", variant: "destructive" });
    }
  };

  const handleRemoveGithubToken = async () => {
    try {
      await disconnectGitHub.mutateAsync();
      toast({ title: "GitHub Disconnected", description: "Your GitHub account has been unlinked." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to disconnect GitHub.", variant: "destructive" });
    }
  };

  const handleSaveUsername = () => {
    if (!username.trim()) {
      toast({ title: "Error", description: "Username cannot be empty.", variant: "destructive" });
      return;
    }
    updateProfile.mutate({ username: username.trim() });
  };

  const handleRegenerateAvatar = () => {
    regenerateAvatar.mutate();
  };

  const handleClearLocalData = async () => {
    if (!confirm("Are you sure you want to clear all local data? This cannot be undone.")) return;
    
    try {
      await db.delete();
      localStorage.clear();
      toast({ title: "Data Cleared", description: "All local data has been removed. Refreshing..." });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast({ title: "Error", description: "Failed to clear local data.", variant: "destructive" });
    }
  };

  const handleExportData = async () => {
    try {
      const pages = await db.pages.toArray();
      const tasks = await db.tasks.toArray();
      const mlNotes = await db.ml_notes.toArray();
      const dsaProblems = await db.dsa_problems.toArray();
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        pages,
        tasks,
        mlNotes,
        dsaProblems,
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `codeweft-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Data Exported", description: "Your data has been downloaded." });
    } catch (error) {
      toast({ title: "Export Failed", description: "Could not export data.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8 max-w-4xl animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your preferences and application settings.
        </p>
      </div>

      {/* Profile Card */}
      {user && (
        <Card className="card-enterprise">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Personalize your identity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative group">
                {profileLoading ? (
                  <Skeleton className="h-24 w-24 rounded-2xl" />
                ) : (
                  <Avatar className="h-24 w-24 rounded-2xl border-2 border-primary/20 shadow-lg">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username || 'Avatar'} />
                    <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 text-2xl font-bold text-primary">
                      {profile?.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleRegenerateAvatar}
                  disabled={regenerateAvatar.isPending}
                >
                  <RefreshCw className={`h-4 w-4 ${regenerateAvatar.isPending ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Your profile picture is auto-generated. Click the refresh button to get a new random avatar.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateAvatar}
                  disabled={regenerateAvatar.isPending}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${regenerateAvatar.isPending ? 'animate-spin' : ''}`} />
                  Generate New Avatar
                </Button>
              </div>
            </div>

            <Separator />

            {/* Username Section */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-base font-medium">Username</Label>
                <div className="flex gap-2">
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    className="h-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={profileLoading}
                  />
                  <Button 
                    onClick={handleSaveUsername} 
                    className="h-10 gap-2"
                    disabled={updateProfile.isPending || username === profile?.username}
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This name will be displayed across the application.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="card-enterprise">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Theme Mode</Label>
              <p className="text-sm text-muted-foreground">
                Select your preferred theme.
              </p>
            </div>
            <ThemeSelector />
          </div>
        </CardContent>
      </Card>

      <Card className="card-enterprise">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Brain className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle>AI & Models</CardTitle>
              <CardDescription>Configure your AI provider settings. Keys are stored locally in your browser</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="text-base font-medium">Provider</Label>
              <div className="flex gap-2">
                <Button
                  variant={aiConfig.provider === "openai" ? "default" : "outline"}
                  onClick={() => setAiConfig({ ...aiConfig, provider: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" })}
                  className="flex-1"
                >
                  OpenAI
                </Button>
                <Button
                  variant={aiConfig.provider === "groq" ? "default" : "outline"}
                  onClick={() => setAiConfig({ ...aiConfig, provider: "groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" })}
                  className="flex-1"
                >
                  Groq
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="api-key" className="text-base font-medium">{aiConfig.provider === "groq" ? "Groq" : "OpenAI"} API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="api-key"
                    type="password"
                    placeholder={aiConfig.provider === "groq" ? "gsk_..." : "sk-..."}
                    className="pl-9 h-10"
                    value={aiConfig.apiKey}
                    onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                  />
                </div>
                <Button onClick={handleSaveAI} className="h-10">Save</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Required for AI assistant features.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model" className="text-base font-medium">Model</Label>
              <Input
                id="model"
                className="h-10"
                value={aiConfig.model}
                onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                placeholder={aiConfig.provider === "groq" ? "llama-3.3-70b-versatile" : "gpt-4o-mini"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-enterprise">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Github className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <CardTitle>GitHub Integration</CardTitle>
              <CardDescription>Connect your GitHub account for GitOps and repository management</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Current Connection Status */}
          <div className="flex items-center justify-between p-4 border border-border/60 rounded-xl bg-muted/20">
            <div className="flex items-center gap-4">
              {hasGithubConnection && githubSettings?.avatar_url ? (
                <Avatar className="h-10 w-10">
                  <AvatarImage src={githubSettings.avatar_url} alt={githubSettings.github_username || 'GitHub'} />
                  <AvatarFallback><Github className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Github className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {hasGithubConnection ? `@${githubSettings?.github_username}` : 'GitHub Status'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasGithubConnection ? 'Connected and ready for GitOps' : 'Not connected'}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={hasGithubConnection ? "border-green-500 text-green-500" : "border-muted-foreground text-muted-foreground"}>
              {hasGithubConnection ? "Connected" : "Not Connected"}
            </Badge>
          </div>

          {/* Token Input - Only show if not connected */}
          {!hasGithubConnection && (
            <div className="space-y-3">
              <Label htmlFor="gh-token" className="text-sm font-medium">Personal Access Token (PAT)</Label>
              <div className="flex gap-2">
                <Input
                  id="gh-token"
                  type="password"
                  placeholder="ghp_..."
                  className="h-10"
                  value={githubToken}
                  onChange={(e) => {
                    setGithubToken(e.target.value);
                    setGithubTestResult(null);
                  }}
                />
                <Button 
                  variant="outline"
                  onClick={handleTestGithubToken} 
                  className="h-10 shrink-0 gap-2"
                  disabled={testConnection.isPending || !githubToken.trim()}
                >
                  {testConnection.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : githubTestResult?.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : githubTestResult?.valid === false ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : null}
                  Test
                </Button>
                <Button 
                  onClick={handleSaveGithubToken} 
                  className="h-10 shrink-0"
                  disabled={saveGitHubSettings.isPending || !githubToken.trim()}
                >
                  {saveGitHubSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Connect'}
                </Button>
              </div>
              
              {/* Test Result Preview */}
              {githubTestResult?.valid && githubTestResult.username && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={githubTestResult.avatar} alt={githubTestResult.username} />
                    <AvatarFallback><Github className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Ready to connect</p>
                    <p className="text-xs text-muted-foreground">@{githubTestResult.username}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Required scopes: <code className="bg-muted px-1 py-0.5 rounded">repo</code>, <code className="bg-muted px-1 py-0.5 rounded">gist</code>, <code className="bg-muted px-1 py-0.5 rounded">read:user</code>, <code className="bg-muted px-1 py-0.5 rounded">workflow</code>, <code className="bg-muted px-1 py-0.5 rounded">codespace</code>
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => window.open('https://github.com/settings/tokens/new?scopes=repo,gist,read:user,workflow,codespace&description=Codeweft%20App', '_blank')}
                >
                  <Key className="h-3 w-3 mr-1" />
                  Create token with required scopes →
                </Button>
              </div>
            </div>
          )}

          {/* Disconnect Button - Only show if connected */}
          {hasGithubConnection && (
            <div className="flex justify-end">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleRemoveGithubToken}
                disabled={disconnectGitHub.isPending}
                className="gap-2"
              >
                {disconnectGitHub.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Disconnect GitHub
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-enterprise">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <User className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account and session</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {user ? (
            <div className="flex items-center justify-between p-4 border border-border/60 rounded-xl bg-muted/20">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-muted-foreground">Signed in</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => signOut()}>Sign Out</Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Not signed in</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-enterprise">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Monitor className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle>Application</CardTitle>
              <CardDescription>Application preferences and data management</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Reduced Motion</Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations throughout app.
              </p>
            </div>
            <Switch
              id="reduced-motion"
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label className="text-base font-medium">Data Management</Label>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleExportData} className="gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button variant="destructive" onClick={handleClearLocalData} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Clear All Local Data
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Export your data as JSON or clear all locally stored data.
            </p>
          </div>
          
          <Separator />
          
          <div className="text-sm text-muted-foreground flex items-center gap-2 p-3 rounded-lg bg-muted/30">
            <Info className="h-4 w-4" />
            <span>Data is synced between local storage and the cloud when signed in.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
