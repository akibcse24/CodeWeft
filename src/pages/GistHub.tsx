import { motion } from 'framer-motion';
import { Plus, FileText, Star, Code2, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useGists } from '@/hooks/useGists';
import { Skeleton } from '@/components/ui/skeleton';
import { GistList } from '@/components/github/pastebin/GistList';

export default function GistHub() {
    const navigate = useNavigate();
    const { gists, isLoadingGists, starredGists, isLoadingStarredGists } = useGists();

    const stats = [
        {
            label: 'Total Gists',
            value: gists.length,
            icon: FileText,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
        },
        {
            label: 'Public Gists',
            value: gists.filter((g) => g.public).length,
            icon: Code2,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
        },
        {
            label: 'Secret Gists',
            value: gists.filter((g) => !g.public).length,
            icon: Lock,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
        },
        {
            label: 'Starred',
            value: starredGists.length,
            icon: Star,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
        },
    ];

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Code Snippets
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Manage your GitHub Gists and code snippets
                    </p>
                </div>

                <Button onClick={() => navigate('/github/gists/new')} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    New Gist
                </Button>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {stats.map((stat, index) => (
                    <Card key={stat.label} className="bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.label}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingGists && (stat.label === 'Total Gists' || stat.label === 'Public Gists' || stat.label === 'Secret Gists') ? (
                                <Skeleton className="h-8 w-16" />
                            ) : isLoadingStarredGists && stat.label === 'Starred' ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <motion.p
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 * (index + 2) }}
                                    className="text-3xl font-bold"
                                >
                                    {stat.value}
                                </motion.p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </motion.div>

            {/* Gist List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <GistList />
            </motion.div>
        </div>
    );
}
