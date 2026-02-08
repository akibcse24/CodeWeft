/* eslint-disable @typescript-eslint/no-explicit-any */
import { actionService, Action } from "./action.service";
import { eventBus } from "./event-bus.service";

export interface PlanStep {
    id: string;
    actionType: string;
    params: Record<string, any>;
    dependencies: string[];
    estimatedDuration: number;
    description: string;
}

export interface Plan {
    id: string;
    description: string;
    steps: PlanStep[];
    estimatedTotalDuration: number;
    status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    currentStepIndex?: number;
    agentId: string;
    userId: string;
}

export interface PlanningContext {
    userGoal: string;
    currentState: Record<string, any>;
    availableActions: string[];
    constraints?: Record<string, any>;
    preferences?: Record<string, any>;
}

class PlannerService {
    private plans: Map<string, Plan> = new Map();
    private planningStrategies: Map<string, (context: PlanningContext) => PlanStep[]> = new Map();

    registerStrategy(name: string, strategy: (context: PlanningContext) => PlanStep[]): void {
        this.planningStrategies.set(name, strategy);
    }

    async createPlan(
        agentId: string,
        userId: string,
        context: PlanningContext,
        strategy: string = "default"
    ): Promise<Plan> {
        const strategyFunc = this.planningStrategies.get(strategy);

        let steps: PlanStep[];

        if (strategyFunc) {
            steps = strategyFunc(context);
        } else {
            steps = await this.defaultPlanningStrategy(context);
        }

        const estimatedTotalDuration = steps.reduce((sum, step) => sum + step.estimatedDuration, 0);

        const plan: Plan = {
            id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            description: context.userGoal,
            steps,
            estimatedTotalDuration,
            status: "pending",
            createdAt: Date.now(),
            agentId,
            userId
        };

        this.plans.set(plan.id, plan);

        await eventBus.emitAgentAction(agentId, `Created plan: ${plan.description}`, {
            planId: plan.id,
            stepCount: steps.length
        });

        return plan;
    }

    private async defaultPlanningStrategy(context: PlanningContext): Promise<PlanStep[]> {
        const steps: PlanStep[] = [];
        const goal = context.userGoal.toLowerCase();

        if (goal.includes("create") && goal.includes("task")) {
            steps.push({
                id: "step_1",
                actionType: "create_task",
                params: {
                    title: this.extractTaskTitle(goal),
                    priority: "medium"
                },
                dependencies: [],
                estimatedDuration: 2000,
                description: "Create the requested task"
            });
        }

        if (goal.includes("navigate") || goal.includes("go to")) {
            const targetPath = this.extractPath(goal);
            steps.push({
                id: "step_1",
                actionType: "navigate_to_page",
                params: { path: targetPath },
                dependencies: [],
                estimatedDuration: 1000,
                description: `Navigate to ${targetPath}`
            });
        }

        if (goal.includes("create") && goal.includes("note")) {
            steps.push({
                id: "step_1",
                actionType: "create_note",
                params: {
                    title: this.extractNoteTitle(goal),
                    content: ""
                },
                dependencies: [],
                estimatedDuration: 3000,
                description: "Create a new note"
            });
        }

        if (goal.includes("analyze") || goal.includes("summarize")) {
            steps.push({
                id: "step_1",
                actionType: "list_notes",
                params: {},
                dependencies: [],
                estimatedDuration: 2000,
                description: "Get list of notes"
            });

            steps.push({
                id: "step_2",
                actionType: "get_note_content",
                params: { note_id: "" },
                dependencies: ["step_1"],
                estimatedDuration: 3000,
                description: "Analyze note content"
            });
        }

        if (steps.length === 0) {
            steps.push({
                id: "step_1",
                actionType: "search_content",
                params: { query: context.userGoal },
                dependencies: [],
                estimatedDuration: 5000,
                description: "Search for relevant content"
            });
        }

        return steps;
    }

    private extractTaskTitle(goal: string): string {
        const match = goal.match(/create (?:a )?task (?:to )?(.+?)(?:\s|$)/i);
        return match ? match[1].trim() : "New Task";
    }

    private extractNoteTitle(goal: string): string {
        const match = goal.match(/create (?:a )?note (?:called |titled |about )?(.+?)(?:\s|$)/i);
        return match ? match[1].trim() : "New Note";
    }

    private extractPath(goal: string): string {
        const paths = ["/notes", "/tasks", "/dashboard", "/github-hub", "/papers", "/courses", "/dsa"];

        for (const path of paths) {
            if (goal.toLowerCase().includes(path.replace("/", ""))) {
                return path;
            }
        }

        return "/dashboard";
    }

    validateDependencies(plan: Plan): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const stepIds = new Set(plan.steps.map(s => s.id));

        for (const step of plan.steps) {
            for (const dep of step.dependencies) {
                if (!stepIds.has(dep)) {
                    errors.push(`Step ${step.id} has invalid dependency: ${dep}`);
                }

                if (dep === step.id) {
                    errors.push(`Step ${step.id} cannot depend on itself`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        }

    }

    estimateExecutionTime(plan: Plan): number {
        return plan.estimatedTotalDuration;
    }

    async executePlan(planId: string, onProgress?: (stepIndex: number, step: PlanStep) => void): Promise<boolean> {
        const plan = this.plans.get(planId);

        if (!plan) {
            throw new Error(`Plan not found: ${planId}`);
        }

        const validation = this.validateDependencies(plan);
        if (!validation.valid) {
            throw new Error(`Invalid plan: ${validation.errors.join(", ")}`);
        }

        plan.status = "in_progress";
        plan.startedAt = Date.now();

        await eventBus.emitAgentAction(plan.agentId, `Starting execution of plan: ${plan.description}`, {
            planId: plan.id
        });

        try {
            const executionOrder = this.getExecutionOrder(plan.steps);

            for (const stepId of executionOrder) {
                const stepIndex = plan.steps.findIndex(s => s.id === stepId);
                const step = plan.steps[stepIndex];
                plan.currentStepIndex = stepIndex;

                if (onProgress) {
                    onProgress(stepIndex, step);
                }

                const actionId = await actionService.createAction(
                    step.actionType,
                    plan.agentId,
                    step.params,
                    plan.userId
                );

                await actionService.executeAction(actionId);

                await eventBus.emitAgentAction(plan.agentId, `Completed step: ${step.description}`, {
                    stepId: step.id
                });
            }

            plan.status = "completed";
            plan.completedAt = Date.now();

            await eventBus.emitAgentAction(plan.agentId, `Plan completed: ${plan.description}`, {
                planId: plan.id
            });

            return true;
        } catch (error) {
            plan.status = "failed";

            await eventBus.emitAgentError(plan.agentId, `Plan failed: ${plan.description}`, error instanceof Error ? error.message : "Unknown error");

            throw error;
        }
    }

    private getExecutionOrder(steps: PlanStep[]): string[] {
        const order: string[] = [];
        const visited = new Set<string>();

        const visit = (stepId: string) => {
            if (visited.has(stepId)) return;

            const step = steps.find(s => s.id === stepId);
            if (!step) return;

            for (const dep of step.dependencies) {
                visit(dep);
            }

            visited.add(stepId);
            order.push(stepId);
        };

        for (const step of steps) {
            visit(step.id);
        }

        return order;
    }

    cancelPlan(planId: string): void {
        const plan = this.plans.get(planId);
        if (plan && plan.status === "in_progress") {
            plan.status = "cancelled";
        }
    }

    getPlan(planId: string): Plan | undefined {
        return this.plans.get(planId);
    }

    getPlansByAgent(agentId: string): Plan[] {
        return Array.from(this.plans.values())
            .filter(p => p.agentId === agentId);
    }

    getPlansByStatus(status: Plan["status"], limit?: number): Plan[] {
        const plans = Array.from(this.plans.values())
            .filter(p => p.status === status)
            .sort((a, b) => b.createdAt - a.createdAt);

        return limit ? plans.slice(0, limit) : plans;
    }

    async optimizePlan(plan: Plan, context: PlanningContext): Promise<PlanStep[]> {
        const steps = [...plan.steps];
        const optimized: PlanStep[] = [];

        const parallelSteps = steps.filter(s => s.dependencies.length === 0);
        const sequentialSteps = steps.filter(s => s.dependencies.length > 0);

        for (const step of parallelSteps) {
            if (this.canRunInParallel(step, optimized)) {
                optimized.push(step);
            }
        }

        for (const step of sequentialSteps) {
            optimized.push(step);
        }

        return optimized;
    }

    private canRunInParallel(step: PlanStep, existingSteps: PlanStep[]): boolean {
        for (const existing of existingSteps) {
            if (step.actionType === existing.actionType && JSON.stringify(step.params) === JSON.stringify(existing.params)) {
                return false;
            }
        }
        return true;
    }

    clearCompletedPlans(olderThanMs: number = 86400000): void {
        const now = Date.now();
        for (const [id, plan] of this.plans.entries()) {
            if (
                (plan.status === "completed" || plan.status === "cancelled" || plan.status === "failed") &&
                (!plan.completedAt || now - plan.completedAt > olderThanMs)
            ) {
                this.plans.delete(id);
            }
        }
    }
}

export const plannerService = new PlannerService();
