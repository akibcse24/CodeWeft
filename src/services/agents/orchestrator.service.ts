/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseAgent } from "./specialized-agents.service";
import { ResearchAgent, ProductivityAgent, DevAgent, LearningAgent, NavigationAgent } from "./specialized-agents.service";
import { eventBus } from "../event-bus.service";
import { plannerService, PlanningContext } from "../planner.service";
import { memoryService } from "../memory.service";

export interface AgentTask {
    id: string;
    agentId: string;
    description: string;
    priority: "low" | "medium" | "high";
    status: "pending" | "assigned" | "in_progress" | "completed" | "failed";
    assignedTo?: string;
    result?: any;
    dependencies: string[];
    createdAt: number;
    completedAt?: number;
}

export interface AgentCollaboration {
    taskId: string;
    primaryAgent: string;
    supportingAgents: string[];
    collaborationType: "parallel" | "sequential" | "delegation";
}

class OrchestratorService {
    private agents: Map<string, BaseAgent> = new Map();
    private taskQueue: AgentTask[] = [];
    private activeCollaborations: Map<string, AgentCollaboration> = new Map();
    private taskHistory: AgentTask[] = [];
    private maxHistorySize = 200;
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    async initialize(): Promise<void> {
        const agents = [
            new ResearchAgent(this.userId),
            new ProductivityAgent(this.userId),
            new DevAgent(this.userId),
            new LearningAgent(this.userId),
            new NavigationAgent(this.userId)
        ];

        for (const agent of agents) {
            await agent.initialize();
            this.registerAgent(agent);
        }

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        eventBus.subscribeAll(async (event) => {
            await this.handleSystemEvent(event);
        });
    }

    private async handleSystemEvent(event: any): Promise<void> {
        const task = this.shouldCreateTaskFromEvent(event);
        if (task) {
            await this.submitTask(task);
        }
    }

    private shouldCreateTaskFromEvent(event: any): AgentTask | null {
        if (event.type === "task_created" && event.data.title.toLowerCase().includes("research")) {
            return {
                id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                agentId: "research_agent",
                description: `Research task related to: ${event.data.title}`,
                priority: "medium",
                status: "pending",
                dependencies: [],
                createdAt: Date.now()
            };
        }

        if (event.type === "habit_completed") {
            const streak = this.calculateHabitStreak(event.data.habitId);
            if (streak >= 7) {
                return {
                    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    agentId: "productivity_agent",
                    description: "Analyze habit streak and provide insights",
                    priority: "low",
                    status: "pending",
                    dependencies: [],
                    createdAt: Date.now()
                };
            }
        }

        return null;
    }

    private calculateHabitStreak(habitId: string): number {
        const events = eventBus.getHistory("habit_completed", 30);
        const habitEvents = events.filter(e => e.data.habitId === habitId);
        return habitEvents.length;
    }

    registerAgent(agent: BaseAgent): void {
        this.agents.set(agent.getId(), agent);
    }

    getAgent(agentId: string): BaseAgent | undefined {
        return this.agents.get(agentId);
    }

    getAllAgents(): BaseAgent[] {
        return Array.from(this.agents.values());
    }

    getAgentsByCapability(capability: string): BaseAgent[] {
        return Array.from(this.agents.values()).filter(
            agent => (agent as any).config?.capabilities?.includes(capability)
        );
    }

    async submitTask(task: Omit<AgentTask, "id" | "createdAt">): Promise<string> {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const fullTask: AgentTask = {
            ...task,
            id: taskId,
            createdAt: Date.now()
        };

        this.taskQueue.push(fullTask);
        this.addToHistory(fullTask);

        await eventBus.emitAgentAction("orchestrator", `Task submitted: ${task.description}`, {
            taskId,
            agentId: task.agentId
        });

        return taskId;
    }

    async processQueue(): Promise<void> {
        while (this.taskQueue.length > 0) {
            const task = this.taskQueue.shift()!;
            await this.executeTask(task);
        }
    }

    private async executeTask(task: AgentTask): Promise<void> {
        const agent = this.agents.get(task.agentId);

        if (!agent) {
            task.status = "failed";
            task.completedAt = Date.now();
            await eventBus.emitAgentError("orchestrator", `Agent not found: ${task.agentId}`);
            return;
        }

        task.status = "in_progress";
        await eventBus.emitAgentAction("orchestrator", `Executing task: ${task.description}`, {
            taskId: task.id,
            agentId: task.agentId
        });

        try {
            const context = {
                userGoal: task.description,
                currentState: memoryService.getContextSummary(),
                availableActions: agent["config"]?.capabilities || [],
                preferences: await memoryService.getUserPreferences()
            };

            const result = await agent.processMessage(task.description, context);

            task.status = "completed";
            task.result = result;
            task.completedAt = Date.now();
            task.assignedTo = agent.getId();

            await memoryService.storeShortTerm({
                type: "action",
                content: {
                    type: "task_completed",
                    task: task.description,
                    agent: agent.getId(),
                    result
                }
            });

            await eventBus.emitAgentAction(agent.getId(), `Task completed: ${task.description}`, {
                taskId: task.id,
                result
            });
        } catch (error) {
            task.status = "failed";
            task.completedAt = Date.now();
            await eventBus.emitAgentError(agent.getId(), `Task failed: ${task.description}`, error);
        }

        this.addToHistory(task);
    }

    async collaborateOnTask(
        primaryAgentId: string,
        supportingAgentIds: string[],
        taskDescription: string,
        collaborationType: "parallel" | "sequential" | "delegation" = "parallel"
    ): Promise<string> {
        const taskId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const collaboration: AgentCollaboration = {
            taskId,
            primaryAgent: primaryAgentId,
            supportingAgents: supportingAgentIds,
            collaborationType
        };

        this.activeCollaborations.set(taskId, collaboration);

        if (collaborationType === "parallel") {
            const promises = supportingAgentIds.map(async (agentId) => {
                const task: AgentTask = {
                    id: `${taskId}_${agentId}`,
                    agentId,
                    description: taskDescription,
                    priority: "medium",
                    status: "pending",
                    dependencies: [],
                    createdAt: Date.now()
                };

                await this.executeTask(task);
                return task.result;
            });

            await Promise.all(promises);
        } else if (collaborationType === "sequential") {
            const context: any = {};

            for (const agentId of [primaryAgentId, ...supportingAgentIds]) {
                const task: AgentTask = {
                    id: `${taskId}_${agentId}`,
                    agentId,
                    description: taskDescription,
                    priority: "medium",
                    status: "pending",
                    dependencies: [],
                    createdAt: Date.now()
                };

                await this.executeTask(task);
                context[agentId] = task.result;
            }
        } else {
            const primaryTask: AgentTask = {
                id: `${taskId}_primary`,
                agentId: primaryAgentId,
                description: taskDescription,
                priority: "high",
                status: "pending",
                dependencies: [],
                createdAt: Date.now()
            };

            await this.executeTask(primaryTask);

            for (const agentId of supportingAgentIds) {
                const task: AgentTask = {
                    id: `${taskId}_${agentId}`,
                    agentId,
                    description: `Support task for: ${taskDescription}`,
                    priority: "medium",
                    status: "pending",
                    dependencies: [primaryTask.id],
                    createdAt: Date.now()
                };

                await this.executeTask(task);
            }
        }

        this.activeCollaborations.delete(taskId);
        return taskId;
    }

    async orchestrateComplexRequest(request: string): Promise<any> {
        const primaryAgent = this.selectAgentForRequest(request);

        if (!primaryAgent) {
            return "I couldn't determine which agent should handle this request.";
        }

        const context: PlanningContext = {
            userGoal: request,
            currentState: { summary: memoryService.getContextSummary() },
            availableActions: primaryAgent["config"]?.capabilities || [],
            preferences: await memoryService.getUserPreferences()
        };

        const plan = await plannerService.createPlan(
            primaryAgent.getId(),
            this.userId,
            context
        );

        await plannerService.executePlan(plan.id);

        return {
            agent: primaryAgent.getName(),
            plan: plan.description,
            stepsCompleted: plan.steps.length
        };
    }

    private selectAgentForRequest(request: string): BaseAgent | undefined {
        const lowerRequest = request.toLowerCase();

        const agentKeywords: Record<string, string[]> = {
            research_agent: ["paper", "research", "ml", "machine learning", "algorithm", "dsa"],
            productivity_agent: ["task", "habit", "pomodoro", "productivity", "workflow"],
            dev_agent: ["github", "git", "code", "regex", "debug", "repository"],
            learning_agent: ["course", "flashcard", "study", "quiz", "learn"],
            navigation_agent: ["go to", "navigate", "find", "search", "open"]
        };

        let bestMatch: { agent: BaseAgent; score: number } | null = null;

        for (const [agentId, keywords] of Object.entries(agentKeywords)) {
            const agent = this.agents.get(agentId);
            if (!agent) continue;

            let score = 0;
            for (const keyword of keywords) {
                if (lowerRequest.includes(keyword)) {
                    score++;
                }
            }

            if (score > 0 && (!bestMatch || score > bestMatch.score)) {
                bestMatch = { agent, score };
            }
        }

        return bestMatch?.agent;
    }

    getTask(taskId: string): AgentTask | undefined {
        return this.taskHistory.find(t => t.id === taskId) || this.taskQueue.find(t => t.id === taskId);
    }

    getTasksByAgent(agentId: string): AgentTask[] {
        return this.taskHistory.filter(t => t.agentId === agentId);
    }

    getActiveTasks(): AgentTask[] {
        return this.taskQueue.filter(t => t.status === "pending" || t.status === "assigned" || t.status === "in_progress");
    }

    getTaskQueue(): AgentTask[] {
        return [...this.taskQueue];
    }

    private addToHistory(task: AgentTask): void {
        this.taskHistory.push(task);

        if (this.taskHistory.length > this.maxHistorySize) {
            this.taskHistory.shift();
        }
    }

    getTaskStats(): Record<string, any> {
        const stats: Record<string, any> = {
            total: this.taskHistory.length,
            byStatus: {} as Record<string, number>,
            byAgent: {} as Record<string, number>,
            averageCompletionTime: 0
        };

        for (const task of this.taskHistory) {
            stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
            stats.byAgent[task.agentId] = (stats.byAgent[task.agentId] || 0) + 1;

            if (task.completedAt && task.createdAt) {
                stats.averageCompletionTime = (
                    (stats.averageCompletionTime * (stats.total - 1) + (task.completedAt - task.createdAt)) /
                    stats.total
                );
            }
        }

        return stats;
    }

    cancelTask(taskId: string): void {
        const task = this.taskQueue.find(t => t.id === taskId);
        if (task) {
            (task as { status: string }).status = "cancelled";
            task.completedAt = Date.now();
            this.addToHistory(task);
        }
    }

    async shutdown(): Promise<void> {
        for (const agent of this.agents.values()) {
            await agent.cleanup();
        }
        this.agents.clear();
        this.taskQueue = [];
    }
}

export const orchestratorService = (userId: string) => new OrchestratorService(userId);
