import { FileExplorer } from '@/components/github/backup/FileExplorer';
import { motion } from 'framer-motion';

export default function GitHubFileExplorer() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
            >
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    File Explorer
                </h1>
                <p className="text-muted-foreground text-lg">
                    Browse and manage repository files
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <FileExplorer />
            </motion.div>
        </div>
    );
}
