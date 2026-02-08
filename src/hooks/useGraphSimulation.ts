import { useRef, useState, useEffect, useCallback } from 'react';

// Basic vector types
interface Point { x: number; y: number }
interface Vector { x: number; y: number }

interface SimulationNode extends Point {
    id: string;
    vx: number;
    vy: number;
    radius: number;
}

interface SimulationLink {
    source: string;
    target: string;
}

// Config
const REPULSION = 500;
const ATTRACTION = 0.05;
const DAMPING = 0.85;
const CENTER_FORCE = 0.02;

export function useGraphSimulation(
    pages: { id: string }[],
    links: { source: string; target: string }[],
    width: number,
    height: number
) {
    // Initialize state only once/when pages change ID-wise significantly
    const [nodes, setNodes] = useState<SimulationNode[]>([]);
    const reqRef = useRef<number>();

    useEffect(() => {
        // Initialize nodes at random positions near center
        const newNodes: SimulationNode[] = pages.map(p => ({
            id: p.id,
            x: width / 2 + (Math.random() - 0.5) * 100,
            y: height / 2 + (Math.random() - 0.5) * 100,
            vx: 0,
            vy: 0,
            radius: 8 // default size
        }));
        setNodes(newNodes);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pages.length, width, height]); // Re-init on count change or resize

    const tick = useCallback(() => {
        setNodes(prevNodes => {
            const nextNodes = prevNodes.map(n => ({ ...n }));

            // 1. Repulsion (Nodes push apart)
            for (let i = 0; i < nextNodes.length; i++) {
                for (let j = i + 1; j < nextNodes.length; j++) {
                    const a = nextNodes[i];
                    const b = nextNodes[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distSq = dx * dx + dy * dy || 1; // Avoid div 0
                    const dist = Math.sqrt(distSq);
                    const force = REPULSION / distSq;

                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;

                    a.vx += fx;
                    a.vy += fy;
                    b.vx -= fx;
                    b.vy -= fy;
                }
            }

            // 2. Attraction (Links pull together)
            links.forEach(link => {
                const source = nextNodes.find(n => n.id === link.source);
                const target = nextNodes.find(n => n.id === link.target);
                if (source && target) {
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    const fx = dx * ATTRACTION;
                    const fy = dy * ATTRACTION;

                    source.vx += fx;
                    source.vy += fy;
                    target.vx -= fx;
                    target.vy -= fy;
                }
            });

            // 3. Center Force (Gravity) & Update Position
            nextNodes.forEach(node => {
                // Gravity to center
                node.vx += (width / 2 - node.x) * CENTER_FORCE;
                node.vy += (height / 2 - node.y) * CENTER_FORCE;

                // Apply velocity with damping
                node.vx *= DAMPING;
                node.vy *= DAMPING;
                node.x += node.vx;
                node.y += node.vy;
            });

            // Stop simulation if energy is low? (Optional optimization)
            return nextNodes;
        });

        reqRef.current = requestAnimationFrame(tick);
    }, [links, width, height]);

    useEffect(() => {
        if (nodes.length > 0) {
            reqRef.current = requestAnimationFrame(tick);
        }
        return () => {
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, nodes.length > 0]); // Restart tick when nodes are ready

    return nodes;
}
