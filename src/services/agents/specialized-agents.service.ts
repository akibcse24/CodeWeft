/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { memoryService } from "../memory.service";
import { eventBus } from "../event-bus.service";

export interface AgentConfig {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    systemPrompt: string;
}

export class BaseAgent {
    protected config: AgentConfig;
    protected userId: string;

    constructor(config: AgentConfig, userId: string) {
        this.config = config;
        this.userId = userId;
    }

    getId(): string {
        return this.config.id;
    }

    getName(): string {
        return this.config.name;
    }

    getSystemPrompt(): string {
        return this.config.systemPrompt;
    }

    async processMessage(message: string, context?: Record<string, any>): Promise<string> {
        return "This method should be implemented by subclasses";
    }

    async initialize(): Promise<void> {
        await memoryService.storeShortTerm({
            type: "action",
            content: { agent: this.config.id, action: "initialized" }
        });
    }

    async cleanup(): Promise<void> {
        await memoryService.storeShortTerm({
            type: "action",
            content: { agent: this.config.id, action: "cleanup" }
        });
    }

    protected async logAction(action: string, details?: Record<string, any>): Promise<void> {
        await eventBus.emitAgentAction(this.config.id, action, details);
    }

    protected async logError(error: string): Promise<void> {
        await eventBus.emitAgentError(this.config.id, error);
    }
}

export class ResearchAgent extends BaseAgent {
    constructor(userId: string) {
        super(
            {
                id: "research_agent",
                name: "Research Assistant",
                description: "Specializes in finding and analyzing research papers, DSA problems, and ML notes",
                capabilities: [
                    "search_papers",
                    "analyze_paper",
                    "summarize_papers",
                    "find_dsa_problems",
                    "analyze_ml_notes",
                    "create_research_summary"
                ],
                systemPrompt: "You are a research assistant specializing in computer science, machine learning, and algorithm analysis. Help users find relevant papers, understand complex concepts, and create summaries."
            },
            userId
        );
    }

    async processMessage(message: string, context?: Record<string, any>): Promise<string> {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes("paper") || lowerMessage.includes("research")) {
            return await this.handlePapers(message, context);
        }

        if (lowerMessage.includes("dsa") || lowerMessage.includes("algorithm") || lowerMessage.includes("problem")) {
            return await this.handleDSA(message, context);
        }

        if (lowerMessage.includes("ml") || lowerMessage.includes("machine learning")) {
            return await this.handleMLNotes(message, context);
        }

        return "I can help you with research papers, DSA problems, or ML notes. What would you like to research?";
    }

    private async handlePapers(message: string, context?: Record<string, any>): Promise<string> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from("papers")
                .select("*")
                .eq("user_id", this.userId);

            if (error) throw error;

            if (!data || data.length === 0) {
                return "You don't have any papers in your library yet. Would you like me to help you add some?";
            }

            return `I found ${data.length} papers in your library. ${data.slice(0, 3).map(p => p.title).join(", ")}...`;
        } catch (error) {
            await this.logError("Failed to fetch papers");
            throw error;
        }
    }

    private async handleDSA(message: string, context?: Record<string, any>): Promise<string> {
        try {
            const { data, error } = await supabase
                .from("dsa_problems")
                .select("*")
                .eq("user_id", this.userId);

            if (error) throw error;

            if (!data || data.length === 0) {
                return "You haven't added any DSA problems yet. I can help you organize and track your algorithm practice.";
            }

            const byDifficulty = data.reduce((acc, p) => {
                acc[p.difficulty] = (acc[p.difficulty] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return `You have ${data.length} DSA problems. Difficulty breakdown: ${JSON.stringify(byDifficulty)}`;
        } catch (error) {
            await this.logError("Failed to fetch DSA problems");
            throw error;
        }
    }

    private async handleMLNotes(message: string, context?: Record<string, any>): Promise<string> {
        try {
            const { data, error } = await supabase
                .from("ml_notes")
                .select("*")
                .eq("user_id", this.userId);

            if (error) throw error;

            if (!data || data.length === 0) {
                return "You don't have any ML notes yet. I can help you create and organize your machine learning notes.";
            }

            return `You have ${data.length} ML notes covering topics like ${data.slice(0, 3).map((n: { title?: string }) => n.title || 'Untitled').join(", ")}...`;
        } catch (error) {
            await this.logError("Failed to fetch ML notes");
            throw error;
        }
    }
}

export class ProductivityAgent extends BaseAgent {
    constructor(userId: string) {
        super(
            {
                id: "productivity_agent",
                name: "Productivity Coach",
                description: "Specializes in task management, habits, workflows, and productivity optimization",
                capabilities: [
                    "create_task",
                    "update_task",
                    "manage_habits",
                    "suggest_workflow",
                    "track_progress",
                    "optimize_schedule"
                ],
                systemPrompt: "You are a productivity coach helping users manage tasks, build habits, and optimize their workflow for maximum efficiency."
            },
            userId
        );
    }

    async processMessage(message: string, context?: Record<string, any>): Promise<string> {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes("task") || lowerMessage.includes("todo")) {
            return await this.handleTasks(message, context);
        }

        if (lowerMessage.includes("habit") || lowerMessage.includes("daily")) {
            return await this.handleHabits(message, context);
        }

        if (lowerMessage.includes("workflow") || lowerMessage.includes("automate")) {
            return await this.handleWorkflows(message, context);
        }

        if (lowerMessage.includes("pomodoro") || lowerMessage.includes("focus")) {
            return await this.handlePomodoro(message, context);
        }

        return "I can help you with tasks, habits, workflows, or focus sessions. What would you like to work on?";
    }

    private async handleTasks(message: string, context?: Record<string, unknown>): Promise<string> {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from("tasks")
                .select("*")
                .eq("user_id", this.userId)
                .eq("completed", false);

            if (error) throw error;

            if (!data || data.length === 0) {
                return "You don't have any pending tasks. Would you like me to help you create some?";
            }

            const byPriority = data.reduce((acc, t) => {
                acc[t.priority] = (acc[t.priority] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return `You have ${data.length} pending tasks. Priority breakdown: ${JSON.stringify(byPriority)}`;
        } catch (error) {
            await this.logError("Failed to fetch tasks");
            throw error;
        }
    }

    private async handleHabits(message: string, context?: Record<string, any>): Promise<string> {
        try {
            const { data, error } = await supabase
                .from("habits")
                .select("*")
                .eq("user_id", this.userId);

            if (error) throw error;

            if (!data || data.length === 0) {
                return "You don't have any habits set up. I can help you create positive habits!";
            }

            return `You're tracking ${data.length} habits. Great consistency building!`;
        } catch (error) {
            await this.logError("Failed to fetch habits");
            throw error;
        }
    }

    private async handleWorkflows(message: string, context?: Record<string, any>): Promise<string> {
        return "I can help you create workflows to automate repetitive tasks. What workflow would you like to set up?";
    }

    private async handlePomodoro(message: string, context?: Record<string, any>): Promise<string> {
        return "I can help you start a focused Pomodoro session. How long would you like to focus for? (standard is 25 minutes)";
    }
}

export class DevAgent extends BaseAgent {
    constructor(userId: string) {
        super(
            {
                id: "dev_agent",
                name: "Development Assistant",
                description: "Specializes in GitHub, code tools, regex, and development workflows",
                capabilities: [
                    "github_operations",
                    "regex_help",
                    "code_analysis",
                    "git_operations",
                    "repository_management",
                    "create_gist"
                ],
                systemPrompt: "You are a development assistant helping with GitHub operations, code tools, regex patterns, and development workflows."
            },
            userId
        );
    }

    async processMessage(message: string, context?: Record<string, any>): Promise<string> {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes("github") || lowerMessage.includes("repo") || lowerMessage.includes("git")) {
            return await this.handleGitHub(message, context);
        }

        if (lowerMessage.includes("regex") || lowerMessage.includes("pattern")) {
            return await this.handleRegex(message, context);
        }

        if (lowerMessage.includes("code") || lowerMessage.includes("debug")) {
            return await this.handleCode(message, context);
        }

        return "I can help with GitHub, regex patterns, or code. What do you need help with?";
    }

    private async handleGitHub(message: string, context?: Record<string, any>): Promise<string> {
        return "I can help you manage GitHub repositories, create gists, work with GitHub Actions, or handle Git operations. What would you like to do?";
    }

    private async handleRegex(message: string, context?: Record<string, any>): Promise<string> {
        return "I can help you create, test, or explain regex patterns. What pattern are you working with?";
    }

    private async handleCode(message: string, context?: Record<string, any>): Promise<string> {
        return "I can help you analyze code, debug issues, or explain concepts. What code would you like help with?";
    }
}

export class LearningAgent extends BaseAgent {
    constructor(userId: string) {
        super(
            {
                id: "learning_agent",
                name: "Learning Companion",
                description: "Specializes in courses, flashcards, study goals, and educational content",
                capabilities: [
                    "manage_courses",
                    "create_flashcards",
                    "track_study_goals",
                    "suggest_study_plan",
                    "quiz_generation",
                    "progress_tracking"
                ],
                systemPrompt: "You are a learning companion helping users with courses, flashcards, study planning, and achieving their educational goals."
            },
            userId
        );
    }

    async processMessage(message: string, context?: Record<string, any>): Promise<string> {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes("course") || lowerMessage.includes("class")) {
            return await this.handleCourses(message, context);
        }

        if (lowerMessage.includes("flashcard") || lowerMessage.includes("quiz")) {
            return await this.handleFlashcards(message, context);
        }

        if (lowerMessage.includes("study") || lowerMessage.includes("goal")) {
            return await this.handleStudyGoals(message, context);
        }

        return "I can help with courses, flashcards, or study planning. What would you like to learn?";
    }

    private async handleCourses(message: string, context?: Record<string, any>): Promise<string> {
        try {
            const { data, error } = await supabase
                .from("courses")
                .select("*")
                .eq("user_id", this.userId);

            if (error) throw error;

            if (!data || data.length === 0) {
                return "You're not enrolled in any courses yet. I can help you track your learning journey!";
            }

            return `You're enrolled in ${data.length} courses: ${data.map(c => c.name).join(", ")}`;
        } catch (error) {
            await this.logError("Failed to fetch courses");
            throw error;
        }
    }

    private async handleFlashcards(message: string, context?: Record<string, any>): Promise<string> {
        try {
            const { data, error } = await supabase
                .from("flashcard_decks")
                .select("*")
                .eq("user_id", this.userId);

            if (error) throw error;

            if (!data || data.length === 0) {
                return "You don't have any flashcard decks yet. I can help you create effective study materials!";
            }

            const totalCards = data.reduce((sum, deck) => sum + deck.card_count, 0);
            return `You have ${data.length} flashcard decks with ${totalCards} total cards. Ready to study!`;
        } catch (error) {
            await this.logError("Failed to fetch flashcards");
            throw error;
        }
    }

    private async handleStudyGoals(message: string, context?: Record<string, any>): Promise<string> {
        return "I can help you set and track study goals. What would you like to achieve?";
    }
}

export class NavigationAgent extends BaseAgent {
    constructor(userId: string) {
        super(
            {
                id: "navigation_agent",
                name: "Navigation Guide",
                description: "Specializes in page navigation, search, and helping users find content",
                capabilities: [
                    "navigate_to_page",
                    "search_content",
                    "find_note",
                    "get_page_info",
                    "suggest_navigation",
                    "back_forward"
                ],
                systemPrompt: "You are a navigation guide helping users find and navigate to content within the application."
            },
            userId
        );
    }

    async processMessage(message: string, context?: Record<string, any>): Promise<string> {
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes("go to") || lowerMessage.includes("navigate") || lowerMessage.includes("open")) {
            return await this.handleNavigation(message, context);
        }

        if (lowerMessage.includes("find") || lowerMessage.includes("search")) {
            return await this.handleSearch(message, context);
        }

        return "I can help you navigate to different pages or search for content. What are you looking for?";
    }

    private async handleNavigation(message: string, context?: Record<string, any>): Promise<string> {
        const routes = {
            notes: "/notes",
            tasks: "/tasks",
            dashboard: "/dashboard",
            github: "/github-hub",
            papers: "/papers",
            courses: "/courses",
            dsa: "/dsa",
            flashcards: "/flashcards",
            settings: "/settings"
        };

        for (const [key, path] of Object.entries(routes)) {
            if (message.toLowerCase().includes(key)) {
                return `I'll navigate you to ${path}. Please click to proceed.`;
            }
        }

        return "I can navigate to Notes, Tasks, Dashboard, GitHub, Papers, Courses, DSA, Flashcards, or Settings. Where would you like to go?";
    }

    private async handleSearch(message: string, context?: Record<string, any>): Promise<string> {
        return `I'll search for "${message}" across your notes, tasks, and other content. Please check the search results.`;
    }
}
