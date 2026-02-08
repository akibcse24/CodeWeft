import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    GitBranch,
    GitCommit,
    HardDrive,
    FileCode,
    Activity,
    Zap,
    ArrowRight,
    LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { listUserRepositories } from '@/services/github/repository.service';
import { Skeleton } from '@/components/ui/skeleton';

interface Feature {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    color: string;
    bgColor: string;
    badge?: string;
}

const GitHubHub = () => {
    // Fetch user repositories
    const { data: repositories, isLoading } = useQuery({
        queryKey: ['user-repositories'],
        queryFn: () => listUserRepositories({ sort: 'updated', per_page: 6 }),
        staleTime: 5 * 60 * 1000,
    });

    const features: Feature[] = [
        {
            title: 'Git Operations',
            description: 'Push, pull, sync repositories with visual branch management',
            icon: GitBranch,
            href: '/github/operations',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Backup & Restore',
            description: 'Automated backups with cloud storage integration',
            icon: HardDrive,
            href: '/github/backup',
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
        },
        {
            title: 'Code Editor',
            description: 'Edit files directly with Monaco editor and git integration',
            icon: FileCode,
            href: '/github/editor',
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
        },
        {
            title: 'Pastebin & Gists',
            description: 'Create and manage code snippets with GitHub Gist sync',
            icon: Zap,
            href: '/github/gists',
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
        },
    ];

    const stats = [
        {
            label: 'Repositories',
            value: repositories?.length || 0,
            icon: GitBranch,
            color: 'text-blue-400',
        },
        {
            label: 'Active Today',
            value: repositories?.filter((r) => {
                const today = new Date();
                const pushed = new Date(r.pushed_at);
                return today.toDateString() === pushed.toDateString();
            }).length || 0,
            icon: Activity,
            color: 'text-green-400',
        },
        {
            label: 'Total Commits',
            value: '-', // Will calculate later
            icon: GitCommit,
            color: 'text-purple-400',
        },
    ];

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    GitHub Integration Hub
                </h1>
                <p className="text-muted-foreground text-lg">
                    Manage your repositories, code, and workflows in one place
                </p>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                {stats.map((stat, index) => (
                    <Card key={index} className="bg-card/50 backdrop-blur-sm border-muted">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    <p className="text-3xl font-bold mt-1">
                                        {isLoading ? <Skeleton className="h-8 w-16" /> : stat.value}
                                    </p>
                                </div>
                                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Feature Cards */}
            <div className="space-y-4">
                <h2 className="text-2xl font-semibold">Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                        >
                            <Link to={feature.href}>
                                <Card className="group hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm cursor-pointer h-full">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div
                                                className={`p-3 rounded-lg ${feature.bgColor} group-hover:scale-110 transition-transform`}
                                            >
                                                <feature.icon className={`h-6 w-6 ${feature.color}`} />
                                            </div>
                                            {feature.badge && (
                                                <Badge variant="outline" className="text-xs">
                                                    {feature.badge}
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                                            {feature.title}
                                            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </CardTitle>
                                        <CardDescription>{feature.description}</CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Recent Repositories */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Recent Repositories</h2>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/github/operations">
                            View All
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-full mt-2" />
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : repositories && repositories.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {repositories.slice(0, 6).map((repo) => (
                            <Card
                                key={repo.id}
                                className="group hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm"
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                            {repo.name}
                                        </CardTitle>
                                        {repo.private && (
                                            <Badge variant="outline" className="text-xs">
                                                Private
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription className="line-clamp-2">
                                        {repo.description || 'No description'}
                                    </CardDescription>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                                        {repo.language && (
                                            <div className="flex items-center gap-1">
                                                <div className="h-3 w-3 rounded-full bg-primary" />
                                                {repo.language}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <GitBranch className="h-3 w-3" />
                                            {repo.default_branch}
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </motion.div>
                ) : (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <p className="text-muted-foreground">
                                No repositories found. Connect your GitHub account in Settings.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default GitHubHub;
