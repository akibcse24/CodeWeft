import { useRef, useMemo, useState, useEffect } from 'react';
import { usePages } from '@/hooks/usePages';
import { useGraphSimulation } from '@/hooks/useGraphSimulation';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Maximize, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllVectors, cosineSimilarity, VectorDocument } from '@/services/vector.service';
import { BrainCircuit, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GraphView() {
    const { pages, isLoading } = usePages();
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [zoom, setZoom] = useState(1);
    const [vectors, setVectors] = useState<VectorDocument[]>([]);
    const [showSemanticLinks, setShowSemanticLinks] = useState(true);

    useEffect(() => {
        getAllVectors().then(setVectors);
    }, []);

    // Calculate dimensions
    const width = containerRef.current?.offsetWidth || 800;
    const height = containerRef.current?.offsetHeight || 600;

    // Extract links
    const links = useMemo(() => {
        const result: { source: string; target: string; type: 'explicit' | 'semantic' }[] = [];
        const pageIds = new Set(pages.map(p => p.id));

        // Explicit Links
        pages.forEach(sourcePage => {
            const content = JSON.stringify(sourcePage.content);
            pages.forEach(targetPage => {
                if (sourcePage.id === targetPage.id) return;
                if (content.includes(`page://${targetPage.id}`)) {
                    result.push({ source: sourcePage.id, target: targetPage.id, type: 'explicit' });
                }
            });
        });

        // Semantic Links
        if (showSemanticLinks) {
            for (let i = 0; i < vectors.length; i++) {
                for (let j = i + 1; j < vectors.length; j++) {
                    const sim = cosineSimilarity(vectors[i].embedding, vectors[j].embedding);
                    if (sim > 0.85) {
                        const id1 = vectors[i].id.replace("note_", "");
                        const id2 = vectors[j].id.replace("note_", "");

                        // Only add if both pages exist and not already linked explicitly
                        if (pageIds.has(id1) && pageIds.has(id2)) {
                            const exists = result.find(l => (l.source === id1 && l.target === id2) || (l.source === id2 && l.target === id1));
                            if (!exists) {
                                result.push({ source: id1, target: id2, type: 'semantic' });
                            }
                        }
                    }
                }
            }
        }

        return result;
    }, [pages, vectors, showSemanticLinks]);

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
                <div className="h-4" />
                <Button
                    variant={showSemanticLinks ? "default" : "outline"}
                    size="icon"
                    onClick={() => setShowSemanticLinks(!showSemanticLinks)}
                    title="Toggle Semantic Links"
                >
                    <BrainCircuit className="h-4 w-4" />
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
                                strokeOpacity={link.type === 'explicit' ? 0.3 : 0.15}
                                strokeWidth={link.type === 'explicit' ? 2 : 1}
                                strokeDasharray={link.type === 'semantic' ? "4 4" : "0"}
                                className={cn(
                                    link.type === 'explicit' ? "text-primary/70" : "text-purple-500/50"
                                )}
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
