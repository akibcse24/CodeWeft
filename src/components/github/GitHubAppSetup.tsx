import { useState } from "react";
import { Github, Loader2, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGitHub } from "@/hooks/useGitHub";

export function GitHubAppSetup() {
    const { settings } = useGitHub();
    const [isInstalling, setIsInstalling] = useState(false);

    const APP_NAME = "codeweft-hub"; // Replace with your actual GitHub App name
    const INSTALL_URL = `https://github.com/apps/${APP_NAME}/installations/new`;

    const handleInstall = () => {
        setIsInstalling(true);
        window.location.href = INSTALL_URL;
    };

    const isAppInstalled = !!settings?.github_installation_id;

    return (
        <Card className="border-border/50 shadow-sm transition-all hover:shadow-md duration-200">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Github className="h-5 w-5" /> GitHub App
                </CardTitle>
                <CardDescription>
                    Install our GitHub App for enhanced repository management and automated syncing
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isAppInstalled ? (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="font-medium text-sm">App Installed</p>
                                <p className="text-xs text-muted-foreground">Successfully linked to your GitHub account</p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-none">
                            Active
                        </Badge>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                            <h4 className="text-sm font-medium mb-2">Benefits:</h4>
                            <ul className="text-xs space-y-2 text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-primary" />
                                    No manual tokens required
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-primary" />
                                    Enhanced security with scoped permissions
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-primary" />
                                    Automated DSA solution syncing
                                </li>
                            </ul>
                        </div>

                        <Button
                            onClick={handleInstall}
                            disabled={isInstalling}
                            className="w-full relative overflow-hidden group"
                        >
                            {isInstalling ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Github className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                                    Install GitHub App
                                    <ExternalLink className="h-3 w-3 ml-2 opacity-50" />
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
