import { useRef, useMemo, useState } from 'react';
import { usePages } from '@/hooks/usePages';
import { useGraphSimulation } from '@/hooks/useGraphSimulation';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Maximize, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function GraphView() {
    const { pages, isLoading } = usePages();
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [zoom, setZoom] = useState(1);

    // Calculate dimensions
    const width = containerRef.current?.offsetWidth || 800;
    const height = containerRef.current?.offsetHeight || 600;

    // Extract links
    const links = useMemo(() => {
        const result: { source: string; target: string }[] = [];
        const pageIds = new Set(pages.map(p => p.id));

        pages.forEach(sourcePage => {
            // Very basic link extraction from content string (same as useBacklinks logic)
            // Ideally we lift this extraction logic to a common util
            const content = JSON.stringify(sourcePage.content);
            pages.forEach(targetPage => {
                if (sourcePage.id === targetPage.id) return;

                // Matches page://id which is what we insert
                if (content.includes(`page://${targetPage.id}`)) {
                    result.push({ source: sourcePage.id, target: targetPage.id });
                }
            });
        });
        return result;
    }, [pages]);

    const nodes = useGraphSimulation(pages, links, width, height);

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    if (pages.length === 0) {
        return <div className="flex h-full items-center justify-center text-muted-foreground">No pages found in graph.</div>;
    }

    return (
        <div ref={containerRef} className="relative w-full h-[calc(100vh-4rem)] bg-background overflow-hidden">
            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 3))}>
                    <Plus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
                    <Minus className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setZoom(1)}>
                    <Maximize className="h-4 w-4" />
                </Button>
            </div>

            {/* SVG Graph */}
            <motion.div
                className="w-full h-full cursor-grab active:cursor-grabbing"
                drag
                dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
            >
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
                        </marker>
                    </defs>

                    {/* Links */}
                    {links.map((link, i) => {
                        const source = nodes.find(n => n.id === link.source);
                        const target = nodes.find(n => n.id === link.target);
                        if (!source || !target) return null;

                        return (
                            <line
                                key={`${link.source}-${link.target}`}
                                x1={source.x}
                                y1={source.y}
                                x2={target.x}
                                y2={target.y}
                                stroke="currentColor"
                                strokeOpacity="0.2"
                                strokeWidth="1.5"
                            // markerEnd="url(#arrowhead)" // Optional: arrows
                            />
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map(node => {
                        const page = pages.find(p => p.id === node.id);
                        return (
                            <g
                                key={node.id}
                                transform={`translate(${node.x},${node.y})`}
                                onClick={() => navigate(`/notes?page=${node.id}`)}
                                className="cursor-pointer group"
                            >
                                <circle
                                    r={(Math.min(links.filter(l => l.target === node.id).length * 2 + 6, 20))} // Size based on popularity
                                    className="fill-primary stroke-background stroke-2 transition-colors group-hover:fill-accent"
                                />
                                <text
                                    dy={20}
                                    textAnchor="middle"
                                    className="text-[10px] fill-muted-foreground select-none pointer-events-none group-hover:fill-foreground font-medium"
                                >
                                    {page?.title || 'Untitled'}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </motion.div>
        </div>
    );
}
