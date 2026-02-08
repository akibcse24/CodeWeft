import { Block } from "@/types/editor.types";

export interface Template {
    id: string;
    name: string;
    description: string;
    icon: string;
    blocks: Block[];
}

export const ELITE_TEMPLATES: Template[] = [
    {
        id: "meeting-notes",
        name: "Meeting Notes",
        description: "Capture attendees, agenda, and action items.",
        icon: "📅",
        blocks: [
            { id: "t1", type: "heading1", content: "Meeting Agenda" },
            { id: "t2", type: "bulletList", content: "Review previous action items" },
            { id: "t3", type: "bulletList", content: "Discuss blockers" },
            { id: "t4", type: "heading1", content: "Action Items" },
            { id: "t5", type: "todo", content: "Send follow-up email" },
        ],
    },
    {
        id: "project-tracker",
        name: "Project Tracker",
        description: "Track milestones, tasks, and resources.",
        icon: "🚀",
        blocks: [
            { id: "p1", type: "heading1", content: "Project Overview" },
            { id: "p2", type: "paragraph", content: "Brief description of the project goals and scope." },
            { id: "p3", type: "heading1", content: "Milestones" },
            { id: "p4", type: "todo", content: "Phase 1: Research & Planning" },
            { id: "p5", type: "todo", content: "Phase 2: Development" },
            { id: "p6", type: "todo", content: "Phase 3: Testing & Launch" },
        ],
    },
    {
        id: "daily-journal",
        name: "Daily Journal",
        description: "Reflect on your day with gratitude and intentions.",
        icon: "📔",
        blocks: [
            { id: "d1", type: "heading1", content: "Morning Intentions" },
            { id: "d2", type: "bulletList", content: "Today I want to focus on..." },
            { id: "d3", type: "heading1", content: "Evening Reflection" },
            { id: "d4", type: "bulletList", content: "What went well today?" },
            { id: "d5", type: "bulletList", content: "What could be improved?" },
        ],
    },
    {
        id: "code-snippet",
        name: "Code Snippet",
        description: "Save reusable code with syntax highlighting.",
        icon: "💻",
        blocks: [
            { id: "c1", type: "heading1", content: "Snippet Title" },
            { id: "c2", type: "paragraph", content: "Description of what this code does." },
            { id: "c3", type: "code", content: "console.log('Hello World');", language: "javascript" }
        ]
    }
];
