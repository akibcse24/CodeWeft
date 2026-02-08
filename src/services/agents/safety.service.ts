/* eslint-disable @typescript-eslint/no-explicit-any */
import { eventBus } from "../event-bus.service";

export interface PermissionLevel {
    read: boolean;
    write: boolean;
    delete: boolean;
    execute: boolean;
}

export interface PermissionRule {
    id: string;
    actionType: string;
    permissionLevel: PermissionLevel;
    requiresConfirmation: boolean;
    maxFrequency?: number;
    timeWindow?: number;
    lastExecuted?: number;
    executionCount?: number;
}

export interface SafetyCheckResult {
    allowed: boolean;
    reason?: string;
    requiresConfirmation?: boolean;
    suggestedAction?: string;
}

class SafetyService {
    private permissionRules: Map<string, PermissionRule> = new Map();
    private actionHistory: Array<{
        actionType: string;
        timestamp: number;
        userId: string;
        success: boolean;
    }> = [];
    private maxHistorySize = 1000;
    private confirmations: Map<string, boolean> = new Map();
    private blockedActions: Set<string> = new Set();
    private dangerousActions: Set<string> = new Set([
        "delete_note",
        "delete_task",
        "delete_project",
        "update_settings",
        "trigger_workflow"
    ]);

    private readonly rateLimitWindows: Map<string, number[]> = new Map();

    constructor() {
        this.initializeDefaultPermissions();
        this.setupEventListeners();
    }

    private initializeDefaultPermissions(): void {
        const defaultRules: Omit<PermissionRule, "id">[] = [
            {
                actionType: "create_task",
                permissionLevel: { read: true, write: true, delete: false, execute: false },
                requiresConfirmation: false,
                maxFrequency: 20,
                timeWindow: 60000
            },
            {
                actionType: "update_task",
                permissionLevel: { read: true, write: true, delete: false, execute: false },
                requiresConfirmation: false,
                maxFrequency: 20,
                timeWindow: 60000
            },
            {
                actionType: "complete_task",
                permissionLevel: { read: true, write: true, delete: false, execute: false },
                requiresConfirmation: false,
                maxFrequency: 30,
                timeWindow: 60000
            },
            {
                actionType: "delete_task",
                permissionLevel: { read: true, write: true, delete: true, execute: false },
                requiresConfirmation: true,
                maxFrequency: 5,
                timeWindow: 60000
            },
            {
                actionType: "create_note",
                permissionLevel: { read: true, write: true, delete: false, execute: false },
                requiresConfirmation: false,
                maxFrequency: 15,
                timeWindow: 60000
            },
            {
                actionType: "update_note",
                permissionLevel: { read: true, write: true, delete: false, execute: false },
                requiresConfirmation: false,
                maxFrequency: 15,
                timeWindow: 60000
            },
            {
                actionType: "delete_note",
                permissionLevel: { read: true, write: true, delete: true, execute: false },
                requiresConfirmation: true,
                maxFrequency: 5,
                timeWindow: 60000
            },
            {
                actionType: "navigate_to_page",
                permissionLevel: { read: true, write: false, delete: false, execute: false },
                requiresConfirmation: false,
                maxFrequency: 30,
                timeWindow: 60000
            },
            {
                actionType: "search_content",
                permissionLevel: { read: true, write: false, delete: false, execute: false },
                requiresConfirmation: false,
                maxFrequency: 20,
                timeWindow: 60000
            },
            {
                actionType: "get_user_stats",
                permissionLevel: { read: true, write: false, delete: false, execute: false },
                requiresConfirmation: false,
                maxFrequency: 10,
                timeWindow: 60000
            },
            {
                actionType: "update_settings",
                permissionLevel: { read: true, write: true, delete: true, execute: false },
                requiresConfirmation: true,
                maxFrequency: 5,
                timeWindow: 60000
            },
            {
                actionType: "trigger_workflow",
                permissionLevel: { read: true, write: true, delete: true, execute: true },
                requiresConfirmation: true,
                maxFrequency: 10,
                timeWindow: 60000
            }
        ];

        for (const rule of defaultRules) {
            this.addPermissionRule(rule);
        }
    }

    private setupEventListeners(): void {
        eventBus.subscribeAll(async (event) => {
            if (event.type === "agent_action") {
                this.recordActionExecution(event.data.action as string, event.userId as string, true);
            }
        });
    }

    addPermissionRule(rule: Omit<PermissionRule, "id">): string {
        const id = `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const permissionRule: PermissionRule = {
            ...rule,
            id
        };

        this.permissionRules.set(rule.actionType, permissionRule);
        return id;
    }

    updatePermissionRule(actionType: string, updates: Partial<PermissionRule>): void {
        const rule = this.permissionRules.get(actionType);
        if (rule) {
            const updated = { ...rule, ...updates };
            this.permissionRules.set(actionType, updated);
        }
    }

    removePermissionRule(actionType: string): void {
        this.permissionRules.delete(actionType);
    }

    getPermissionRule(actionType: string): PermissionRule | undefined {
        return this.permissionRules.get(actionType);
    }

    getAllPermissionRules(): PermissionRule[] {
        return Array.from(this.permissionRules.values());
    }

    async checkSafety(actionType: string, params: any, userId: string): Promise<SafetyCheckResult> {
        if (this.blockedActions.has(actionType)) {
            return {
                allowed: false,
                reason: `Action "${actionType}" is blocked`
            };
        }

        const rule = this.permissionRules.get(actionType);

        if (!rule) {
            return {
                allowed: false,
                reason: `No permission rule found for action: ${actionType}`
            };
        }

        const rateLimitCheck = this.checkRateLimit(actionType, rule);
        if (!rateLimitCheck.allowed) {
            return {
                allowed: false,
                reason: rateLimitCheck.reason,
                suggestedAction: `Wait ${Math.ceil(rateLimitCheck.timeUntil / 1000)} seconds before trying again`
            };
        }

        const dangerousCheck = this.checkDangerousAction(actionType);
        if (!dangerousCheck.allowed) {
            return {
                allowed: false,
                reason: dangerousCheck.reason,
                requiresConfirmation: true
            };
        }

        const paramSafetyCheck = this.checkParameterSafety(actionType, params);
        if (!paramSafetyCheck.allowed) {
            return {
                allowed: false,
                reason: paramSafetyCheck.reason
            };
        }

        return {
            allowed: true,
            requiresConfirmation: rule.requiresConfirmation || this.dangerousActions.has(actionType)
        };
    }

    private checkRateLimit(actionType: string, rule: PermissionRule): { allowed: boolean; reason?: string; timeUntil?: number } {
        if (!rule.maxFrequency || !rule.timeWindow) {
            return { allowed: true };
        }

        const now = Date.now();
        const timestamps = this.rateLimitWindows.get(actionType) || [];

        const recentTimestamps = timestamps.filter(t => now - t < rule.timeWindow);

        if (recentTimestamps.length >= rule.maxFrequency) {
            const oldestTimestamp = recentTimestamps[0];
            const timeUntil = rule.timeWindow - (now - oldestTimestamp);

            return {
                allowed: false,
                reason: `Rate limit exceeded for ${actionType}`,
                timeUntil
            };
        }

        recentTimestamps.push(now);
        this.rateLimitWindows.set(actionType, recentTimestamps);

        return { allowed: true };
    }

    private checkDangerousAction(actionType: string): { allowed: boolean; reason?: string } {
        if (this.dangerousActions.has(actionType)) {
            return {
                allowed: false,
                reason: `Action "${actionType}" is potentially dangerous`
            };
        }
        return { allowed: true };
    }

    private checkParameterSafety(actionType: string, params: any): { allowed: boolean; reason?: string } {
        if (!params) {
            return { allowed: true };
        }

        if (actionType === "delete_note" || actionType === "delete_task") {
            if (typeof params.note_id !== "string" && typeof params.task_id !== "string") {
                return {
                    allowed: false,
                    reason: "Invalid ID parameter for delete operation"
                };
            }
        }

        if (actionType === "update_settings") {
            if (params.settings && typeof params.settings !== "object") {
                return {
                    allowed: false,
                    reason: "Invalid settings format"
                };
            }
        }

        return { allowed: true };
    }

    requestConfirmation(actionType: string): string {
        const confirmId = `confirm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.confirmations.set(confirmId, false);
        return confirmId;
    }

    confirmAction(confirmId: string, approved: boolean): void {
        this.confirmations.set(confirmId, approved);
    }

    getConfirmationStatus(confirmId: string): boolean | undefined {
        return this.confirmations.get(confirmId);
    }

    blockAction(actionType: string): void {
        this.blockedActions.add(actionType);
        this.permissionRules.delete(actionType);
    }

    unblockAction(actionType: string): void {
        this.blockedActions.delete(actionType);
    }

    isActionBlocked(actionType: string): boolean {
        return this.blockedActions.has(actionType);
    }

    recordActionExecution(actionType: string, userId: string, success: boolean): void {
        const record = {
            actionType,
            timestamp: Date.now(),
            userId,
            success
        };

        this.actionHistory.push(record);

        if (this.actionHistory.length > this.maxHistorySize) {
            this.actionHistory.shift();
        }

        const rule = this.permissionRules.get(actionType);
        if (rule) {
            rule.executionCount = (rule.executionCount || 0) + 1;
            rule.lastExecuted = Date.now();
        }
    }

    getActionHistory(actionType?: string, limit?: number): Array<any> {
        let history = this.actionHistory;

        if (actionType) {
            history = history.filter(h => h.actionType === actionType);
        }

        history = history.sort((a, b) => b.timestamp - a.timestamp);

        return limit ? history.slice(0, limit) : history;
    }

    getSafetyStats(): {
        totalActions: number;
        successfulActions: number;
        failedActions: number;
        blockedActions: number;
        byActionType: Record<string, number>;
    } {
        const stats = {
            totalActions: this.actionHistory.length,
            successfulActions: this.actionHistory.filter(h => h.success).length,
            failedActions: this.actionHistory.filter(h => !h.success).length,
            blockedActions: this.blockedActions.size,
            byActionType: this.actionHistory.reduce((acc, h) => {
                acc[h.actionType] = (acc[h.actionType] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        };

        return stats;
    }

    exportSettings(): string {
        return JSON.stringify({
            permissionRules: Array.from(this.permissionRules.values()),
            blockedActions: Array.from(this.blockedActions)
        }, null, 2);
    }

    importSettings(json: string): void {
        try {
            const data = JSON.parse(json);

            if (data.permissionRules) {
                for (const rule of data.permissionRules) {
                    this.permissionRules.set(rule.actionType, rule);
                }
            }

            if (data.blockedActions) {
                this.blockedActions = new Set(data.blockedActions);
            }
        } catch (error) {
            throw new Error("Invalid safety settings format");
        }
    }

    resetToDefaults(): void {
        this.permissionRules.clear();
        this.blockedActions.clear();
        this.confirmations.clear();
        this.actionHistory = [];
        this.initializeDefaultPermissions();
    }
}

export const safetyService = new SafetyService();
