import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DividerBlockProps {
    className?: string;
}

export const DividerBlock: React.FC<DividerBlockProps> = ({ className }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn("py-4", className)}
        >
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border to-transparent" />
        </motion.div>
    );
};
