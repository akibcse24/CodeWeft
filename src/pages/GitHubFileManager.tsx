import { motion } from 'framer-motion';
import { HardDrive, Clock, FolderTree, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useBackup } from '@/hooks/useBackup';
import { Skeleton } from '@/components/ui/skeleton';

export default function GitHubFileManager() {
    const navigate = useNavigate();
    const { backups, isLoadingBackups } = useBackup();

    const features = [
        {
            title: 'File Explorer',
            description: 'Browse and manage repository files with a visual tree interface',
            icon: FolderTree,
            href: '/github/file-explorer',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'Backup Manager',
            description: 'Create manual backups and restore from previous snapshots',
            icon: HardDrive,
            href: '/github/backups',
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
        },
        {
            title: 'Backup Scheduler',
            description: 'Automate backups with cron-based scheduling',
            icon: Clock,
            href: '/github/backup-scheduler',
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
        },
        {
            title: 'Storage Settings',
            description: 'Configure cloud storage providers and manage quota',
            icon: Settings,
            href: '/github/backup-settings',
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
        },
    ];

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    File Manager & Backup
                </h1>
                <p className="text-muted-foreground text-lg">
                    Browse repository files and manage automated backups
                </p>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Backups
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingBackups ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <p className="text-3xl font-bold">{backups.length}</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Storage Used
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingBackups ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <p className="text-3xl font-bold">
                                {(
                                    backups.reduce((sum, b) => sum + (b.size || 0), 0) /
                                    1024 /
                                    1024
                                ).toFixed(2)}
                                <span className="text-sm font-normal text-muted-foreground ml-1">MB</span>
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Last Backup
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoadingBackups ? (
                            <Skeleton className="h-8 w-32" />
                        ) : backups.length > 0 ? (
                            <p className="text-sm font-medium">
                                {new Date(backups[0].createdAt).toLocaleDateString()}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">No backups yet</p>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                    <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * (index + 2) }}
                    >
                        <Card
                            className="h-full hover:border-primary/50 transition-all cursor-pointer bg-card/50 backdrop-blur-sm group"
                            onClick={() => navigate(feature.href)}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                                        <feature.icon className={`h-6 w-6 ${feature.color}`} />
                                    </div>
                                </div>
                                <CardTitle className="group-hover:text-primary transition-colors">
                                    {feature.title}
                                </CardTitle>
                                <CardDescription>{feature.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    variant="ghost"
                                    className="w-full group-hover:bg-primary/10"
                                >
                                    Open →
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
