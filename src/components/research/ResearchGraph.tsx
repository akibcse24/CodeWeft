import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paper } from "@/hooks/usePapers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Tag, Users, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Node extends Paper {
    x: number;
    y: number;
    vx: number;
    vy: number;
}

interface Edge {
    source: string;
    target: string;
    type: "tag" | "author";
    label: string;
}

interface ResearchGraphProps {
    papers: Paper[];
    onSelectPaper?: (paper: Paper) => void;
}

export default function ResearchGraph({ papers, onSelectPaper }: ResearchGraphProps) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // Initialize nodes and edges
    useEffect(() => {
        if (papers.length === 0) return;

        // Initial positions
        const initialNodes: Node[] = papers.map((p, i) => ({
            ...p,
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
            vx: 0,
            vy: 0
        }));

        // Calculate Edges (Simplified: Link if they share > 0 tags or any author)
        const initialEdges: Edge[] = [];
        for (let i = 0; i < initialNodes.length; i++) {
            for (let j = i + 1; j < initialNodes.length; j++) {
                const p1 = initialNodes[i];
                const p2 = initialNodes[j];

                // Shared Tags
                const sharedTags = p1.tags?.filter(t => p2.tags?.includes(t)) || [];
                if (sharedTags.length > 0) {
                    initialEdges.push({
                        source: p1.id,
                        target: p2.id,
                        type: "tag",
                        label: sharedTags[0]
                    });
                }

                // Shared Authors (if any - though usually less common in personal logs unless specific niche)
                const sharedAuthors = p1.authors?.filter(a => p2.authors?.includes(a)) || [];
                if (sharedAuthors.length > 0) {
                    initialEdges.push({
                        source: p1.id,
                        target: p2.id,
                        type: "author",
                        label: sharedAuthors[0]
                    });
                }
            }
        }

        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [papers, dimensions.width, dimensions.height]);

    // Simple Physics Simulation (Force-Directed)
    useEffect(() => {
        if (nodes.length === 0) return;

        const interval = setInterval(() => {
            setNodes(prevNodes => {
                const nextNodes = prevNodes.map(n => ({ ...n }));
                const k = 0.05; // spring constant
                const repulsion = 1000;
                const centerGravity = 0.01;

                for (let i = 0; i < nextNodes.length; i++) {
                    const n1 = nextNodes[i];

                    // Gravity to center
                    n1.vx += (dimensions.width / 2 - n1.x) * centerGravity;
                    n1.vy += (dimensions.height / 2 - n1.y) * centerGravity;

                    // Node repulsion
                    for (let j = 0; j < nextNodes.length; j++) {
                        if (i === j) continue;
                        const n2 = nextNodes[j];
                        const dx = n1.x - n2.x;
                        const dy = n1.y - n2.y;
                        const distSq = dx * dx + dy * dy || 1;
                        const dist = Math.sqrt(distSq);
                        const force = repulsion / distSq;
                        n1.vx += (dx / dist) * force;
                        n1.vy += (dy / dist) * force;
                    }

                    // Edge attraction
                    edges.forEach(e => {
                        if (e.source === n1.id || e.target === n1.id) {
                            const otherId = e.source === n1.id ? e.target : e.source;
                            const n2 = nextNodes.find(n => n.id === otherId);
                            if (n2) {
                                const dx = n2.x - n1.x;
                                const dy = n2.y - n1.y;
                                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                                const force = k * (dist - 150);
                                n1.vx += (dx / dist) * force;
                                n1.vy += (dy / dist) * force;
                            }
                        }
                    });

                    // Damping
                    n1.vx *= 0.9;
                    n1.vy *= 0.9;

                    // Update position
                    n1.x += n1.vx;
                    n1.y += n1.vy;

                    // Boundaries
                    n1.x = Math.max(50, Math.min(dimensions.width - 50, n1.x));
                    n1.y = Math.max(50, Math.min(dimensions.height - 50, n1.y));
                }

                return nextNodes;
            });
        }, 16);

        return () => clearInterval(interval);
    }, [edges, dimensions.width, dimensions.height, nodes.length]);

    return (
        <div className="relative w-full h-[600px] bg-black/20 rounded-3xl overflow-hidden border border-white/5 backdrop-blur-sm shadow-2xl group/graph">
            <div className="absolute top-6 left-6 z-10 space-y-1 pointer-events-none">
                <h3 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    Knowledge Graph
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">
                    Visualizing {papers.length} Papers & {edges.length} Connections
                </p>
            </div>

            <div className="absolute top-6 right-6 z-10 flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-background/50 backdrop-blur border-white/10 shadow-lg">
                    <Maximize2 className="h-4 w-4" />
                </Button>
            </div>

            <svg width="100%" height="100%" className="cursor-grab active:cursor-grabbing">
                {/* Edges */}
                {edges.map((edge, idx) => {
                    const source = nodes.find(n => n.id === edge.source);
                    const target = nodes.find(n => n.id === edge.target);
                    if (!source || !target) return null;

                    return (
                        <motion.line
                            key={`${edge.source}-${edge.target}-${idx}`}
                            x1={source.x}
                            y1={source.y}
                            x2={target.x}
                            y2={target.y}
                            stroke={edge.type === "tag" ? "rgba(59, 130, 246, 0.2)" : "rgba(245, 158, 11, 0.2)"}
                            strokeWidth="1.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        />
                    );
                })}

                {/* Nodes */}
                {nodes.map((node) => (
                    <motion.g
                        key={node.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, x: node.x, y: node.y }}
                        whileHover={{ scale: 1.1 }}
                        onClick={() => setSelectedNode(node)}
                        className="cursor-pointer"
                    >
                        <circle
                            r={selectedNode?.id === node.id ? 8 : 6}
                            fill={selectedNode?.id === node.id ? "#3b82f6" : "#64748b"}
                            className="transition-all"
                            stroke="white"
                            strokeWidth="1"
                        />
                        <text
                            y={-12}
                            textAnchor="middle"
                            className="text-[10px] font-bold fill-muted-foreground/80 pointer-events-none drop-shadow-sm transition-all"
                            style={{ fontSize: selectedNode?.id === node.id ? '11px' : '9px' }}
                        >
                            {node.title.length > 20 ? node.title.substring(0, 17) + "..." : node.title}
                        </text>
                    </motion.g>
                ))}
            </svg>

            {/* Node Info Panel */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="absolute top-6 right-6 bottom-6 w-80 bg-background/80 glass-card border-white/10 p-6 z-20 shadow-2xl flex flex-col gap-4 overflow-hidden backdrop-blur-xl"
                    >
                        <div className="flex items-start justify-between">
                            <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase tracking-wider font-bold">
                                {selectedNode.status.replace('_', ' ')}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setSelectedNode(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-1">
                            <h4 className="text-lg font-bold leading-tight line-clamp-2">
                                {selectedNode.title}
                            </h4>
                            <p className="text-xs text-muted-foreground font-medium">
                                {selectedNode.authors?.join(', ') || 'Unknown Authors'}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                            {selectedNode.summary && (
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">Abstract Snippet</p>
                                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-6 italic">
                                        "{selectedNode.summary}"
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-1.5 pt-2">
                                {selectedNode.tags?.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-[9px] bg-white/5 border-white/5 text-muted-foreground/80 lowercase">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 text-[11px] font-bold" onClick={() => onSelectPaper?.(selectedNode)}>
                                <BookOpen className="h-3.5 w-3.5 mr-2" /> View Details
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-6 left-6 flex gap-4 text-[10px] font-bold uppercase tracking-widest opacity-40">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500/50" /> Tag Connection</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500/50" /> Author Connection</div>
            </div>
        </div>
    );
}
