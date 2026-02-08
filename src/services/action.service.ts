import { eventBus } from "./event-bus.service";
import { memoryService } from "./memory.service";

export interface Action {
    id: string;
    type: string;
    agentId: string;
    params: Record<string, unknown>;
    timestamp: number;
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    result?: unknown;
    error?: string;
    requiresConfirmation?: boolean;
    userId: string;
}

export interface ActionResult {
    success: boolean;
    data?: unknown;
    error?: string;
    canRetry?: boolean;
}

export type ActionValidator = (action: Action) => Promise<ActionResult>;
export type ActionExecutor = (action: Action) => Promise<ActionResult>;

class ActionService {
    private actions: Map<string, Action> = new Map();
    private validators: Map<string, ActionValidator> = new Map();
    private executors: Map<string, ActionExecutor> = new Map();
    private rateLimiter: Map<string, number[]> = new Map();
    private actionLog: Action[] = [];
    private maxLogSize = 500;
    private actionWhitelist: Set<string> = new Set();
    private actionBlacklist: Set<string> = new Set();
    private maxRetries = 3;

    registerValidator(actionType: string, validator: ActionValidator): void {
        this.validators.set(actionType, validator);
    }

    registerExecutor(actionType: string, executor: ActionExecutor): void {
        this.executors.set(actionType, executor);
    }

    addToWhitelist(actionType: string): void {
        this.actionWhitelist.add(actionType);
    }

    addToBlacklist(actionType: string): void {
        this.actionBlacklist.add(actionType);
    }

    private async checkRateLimit(actionType: string, limit: number = 10, windowMs: number = 60000): Promise<boolean> {
        const now = Date.now();
        const timestamps = this.rateLimiter.get(actionType) || [];

        const recentTimestamps = timestamps.filter(t => now - t < windowMs);

        if (recentTimestamps.length >= limit) {
            return false;
        }

        recentTimestamps.push(now);
        this.rateLimiter.set(actionType, recentTimestamps);

        return true;
    }

    async createAction(type: string, agentId: string, params: Record<string, unknown>, userId: string): Promise<string> {
        const actionId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const action: Action = {
            id: actionId,
            type,
            agentId,
            params,
            timestamp: Date.now(),
            status: "pending",
            userId
        };

        if (this.actionBlacklist.has(type)) {
            throw new Error(`Action type "${type}" is blacklisted`);
        }

        if (this.actionWhitelist.size > 0 && !this.actionWhitelist.has(type)) {
            throw new Error(`Action type "${type}" is not whitelisted`);
        }

        this.actions.set(actionId, action);
        this.addToLog(action);

        await eventBus.emitAgentAction(agentId, `Created action: ${type}`, { actionId });

        return actionId;
    }

    async executeAction(actionId: string, retryCount: number = 0): Promise<ActionResult> {
        const action = this.actions.get(actionId);
        if (!action) {
            throw new Error(`Action not found: ${actionId}`);
        }

        if (!await this.checkRateLimit(action.type)) {
            throw new Error(`Rate limit exceeded for action type: ${action.type}`);
        }

        const validator = this.validators.get(action.type);
        if (validator) {
            const validationResult = await validator(action);
            if (!validationResult.success) {
                action.status = "failed";
                action.error = validationResult.error || "Validation failed";
                await eventBus.emitAgentError(action.agentId, `Validation failed for ${action.type}`);
                return validationResult;
            }
        }

        action.status = "running";
        await eventBus.emitAgentAction(action.agentId, `Executing: ${action.type}`, { actionId });

        try {
            const executor = this.executors.get(action.type);
            if (!executor) {
                throw new Error(`No executor registered for action type: ${action.type}`);
            }

            const result = await executor(action);

            if (result.success) {
                action.status = "completed";
                action.result = result.data;

                memoryService.storeShortTerm({
                    type: "action",
                    content: { type: action.type, outcome: "success", params: action.params }
                });

                await memoryService.learnFromAction(action.type, "success", action.params);
                await eventBus.emitAgentAction(action.agentId, `Completed: ${action.type}`, result.data);
            } else {
                action.status = "failed";
                action.error = result.error || "Execution failed";

                memoryService.storeShortTerm({
                    type: "action",
                    content: { type: action.type, outcome: "failure", error: action.error }
                });

                await memoryService.learnFromAction(action.type, "failure", action.params);
                await eventBus.emitAgentError(action.agentId, `Failed: ${action.type}`, result.error);

                if (result.canRetry && retryCount < this.maxRetries) {
                    return this.executeAction(actionId, retryCount + 1);
                }
            }

            this.addToLog(action);
            return result;
        } catch (error) {
            action.status = "failed";
            action.error = error instanceof Error ? error.message : "Unknown error";

            await eventBus.emitAgentError(action.agentId, `Error in ${action.type}`, action.error);

            throw error;
        }
    }

    async executeActionsSequential(actionIds: string[]): Promise<ActionResult[]> {
        const results: ActionResult[] = [];

        for (const actionId of actionIds) {
            try {
                const result = await this.executeAction(actionId);
                results.push(result);

                if (!result.success) {
                    break;
                }
            } catch (error) {
                results.push({
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error"
                });
                break;
            }
        }

        return results;
    }

    async executeActionsParallel(actionIds: string[]): Promise<ActionResult[]> {
        const promises = actionIds.map(id => this.executeAction(id));
        const results = await Promise.allSettled(promises);

        return results.map(result => {
            if (result.status === "fulfilled") {
                return result.value;
            }
            return {
                success: false,
                error: result.reason instanceof Error ? result.reason.message : "Unknown error"
            };
        });
    }

    cancelAction(actionId: string): void {
        const action = this.actions.get(actionId);
        if (action && (action.status === "pending" || action.status === "running")) {
            action.status = "cancelled";
            this.addToLog(action);
            eventBus.emitAgentAction(action.agentId, `Cancelled: ${action.type}`, { actionId });
        }
    }

    getAction(actionId: string): Action | undefined {
        return this.actions.get(actionId);
    }

    getActionsByAgent(agentId: string): Action[] {
        return Array.from(this.actions.values())
            .filter(a => a.agentId === agentId);
    }

    getActionsByStatus(status: Action["status"], limit?: number): Action[] {
        const actions = Array.from(this.actions.values())
            .filter(a => a.status === status)
            .sort((a, b) => b.timestamp - a.timestamp);

        return limit ? actions.slice(0, limit) : actions;
    }

    getRecentActions(limit: number = 20): Action[] {
        return this.actionLog
            .slice(-limit)
            .reverse();
    }

    private addToLog(action: Action): void {
        this.actionLog.push(action);

        if (this.actionLog.length > this.maxLogSize) {
            this.actionLog.shift();
        }
    }

    clearLog(): void {
        this.actionLog = [];
    }

    getActionStats(): Record<string, number> {
        const stats: Record<string, number> = {};

        for (const action of this.actionLog) {
            const key = `${action.type}:${action.status}`;
            stats[key] = (stats[key] || 0) + 1;
        }

        return stats;
    }

    async rollbackAction(actionId: string): Promise<ActionResult> {
        const action = this.actions.get(actionId);
        if (!action) {
            throw new Error(`Action not found: ${actionId}`);
        }

        if (action.status !== "completed") {
            throw new Error(`Cannot rollback action with status: ${action.status}`);
        }

        const rollbackActionId = `${actionId}_rollback`;

        try {
            await this.executeAction(rollbackActionId);
            action.status = "cancelled";
            this.addToLog(action);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Rollback failed"
            };
        }
    }

    exportActions(): string {
        return JSON.stringify(this.actionLog, null, 2);
    }

    exportActionsByAgent(agentId: string): string {
        const actions = this.getActionsByAgent(agentId);
        return JSON.stringify(actions, null, 2);
    }
}

export const actionService = new ActionService();
