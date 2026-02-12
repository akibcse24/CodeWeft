/* eslint-disable @typescript-eslint/no-explicit-any */
import { memoryService } from "./memory.service";

export type EventType =
    | "page_navigation"
    | "task_created"
    | "task_completed"
    | "task_deleted"
    | "habit_completed"
    | "note_created"
    | "note_updated"
    | "note_deleted"
    | "project_created"
    | "flashcard_reviewed"
    | "course_started"
    | "agent_action"
    | "agent_error"
    | "workflow_triggered"
    | "workflow_completed"
    | "settings_changed"
    | "user_idle"
    | "user_active"
    | "code_executed"
    | "repository_cloned"
    | "file_created"
    | "file_deleted"
    | "open_codespace_terminal";

export interface Event {
    id: string;
    type: EventType;
    data: any;
    timestamp: number;
    source?: string;
    userId?: string;
}

export type EventHandler = (event: Event) => void | Promise<void>;

class EventBusService {
    private handlers: Map<EventType, Set<EventHandler>> = new Map();
    private wildcardHandlers: Set<EventHandler> = new Set();
    private eventHistory: Event[] = [];
    private maxHistorySize = 1000;
    private eventLogEnabled = true;

    subscribe(eventType: EventType, handler: EventHandler): () => void {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }

        this.handlers.get(eventType)!.add(handler);

        return () => this.unsubscribe(eventType, handler);
    }

    subscribeAll(handler: EventHandler): () => void {
        this.wildcardHandlers.add(handler);
        return () => this.wildcardHandlers.delete(handler);
    }

    unsubscribe(eventType: EventType, handler: EventHandler): void {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.handlers.delete(eventType);
            }
        }
    }

    async emit(event: Omit<Event, "id" | "timestamp">): Promise<void> {
        const fullEvent: Event = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            ...event
        };

        if (this.eventLogEnabled) {
            this.addToHistory(fullEvent);
        }

        try {
            memoryService.storeShortTerm({
                type: "event",
                content: { type: fullEvent.type, data: fullEvent.data }
            });
        } catch (error) {
            console.warn("[EventBus] Failed to store event in memory service:", error);
        }

        const handlers = this.handlers.get(fullEvent.type) || [];
        const promises: Promise<any>[] = [];

        const wrapHandler = (handler: EventHandler, type: string) => {
            return (async () => {
                try {
                    await Promise.resolve(handler(fullEvent));
                    return { success: true };
                } catch (error) {
                    console.error(`[EventBus] Handler (${type}) failed for event ${fullEvent.type}:`, error);
                    return { success: false, error };
                }
            })();
        };

        for (const handler of handlers) {
            promises.push(wrapHandler(handler, "specific"));
        }

        for (const handler of this.wildcardHandlers) {
            promises.push(wrapHandler(handler, "wildcard"));
        }

        await Promise.allSettled(promises);
    }

    private sanitizeEventData(data: any): any {
        if (!data) return data;
        try {
            const dataStr = JSON.stringify(data);
            if (dataStr.length > 2000) {
                return { _truncated: true, _length: dataStr.length, _snippet: dataStr.substring(0, 100) + "..." };
            }
        } catch (e) {
            return "[Unserializable Data]";
        }
        return data;
    }

    private addToHistory(event: Event): void {
        const historyEvent = {
            ...event,
            data: this.sanitizeEventData(event.data)
        };

        this.eventHistory.push(historyEvent);

        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    }

    getHistory(eventType?: EventType, limit?: number): Event[] {
        let events = this.eventHistory;

        if (eventType) {
            events = events.filter(e => e.type === eventType);
        }

        events = events.sort((a, b) => b.timestamp - a.timestamp);

        return limit ? events.slice(0, limit) : events;
    }

    getRecentEvents(limit: number = 10): Event[] {
        return this.eventHistory
            .slice(-limit)
            .reverse();
    }

    clearHistory(): void {
        this.eventHistory = [];
    }

    enableEventLog(): void {
        this.eventLogEnabled = true;
    }

    disableEventLog(): void {
        this.eventLogEnabled = false;
    }

    getEventStats(): Record<string, number> {
        const stats: Record<string, number> = {};

        for (const event of this.eventHistory) {
            stats[event.type] = (stats[event.type] || 0) + 1;
        }

        return stats;
    }

    async emitPageNavigation(path: string, userId?: string): Promise<void> {
        await this.emit({
            type: "page_navigation",
            data: { path },
            source: "navigation",
            userId
        });
    }

    async emitTaskCreated(taskId: string, title: string, userId?: string): Promise<void> {
        await this.emit({
            type: "task_created",
            data: { taskId, title },
            source: "tasks",
            userId
        });
    }

    async emitTaskCompleted(taskId: string, userId?: string): Promise<void> {
        await this.emit({
            type: "task_completed",
            data: { taskId },
            source: "tasks",
            userId
        });
    }

    async emitHabitCompleted(habitId: string, userId?: string): Promise<void> {
        await this.emit({
            type: "habit_completed",
            data: { habitId },
            source: "habits",
            userId
        });
    }

    async emitNoteCreated(noteId: string, title: string, userId?: string): Promise<void> {
        await this.emit({
            type: "note_created",
            data: { noteId, title },
            source: "notes",
            userId
        });
    }

    async emitNoteUpdated(noteId: string, userId?: string): Promise<void> {
        await this.emit({
            type: "note_updated",
            data: { noteId },
            source: "notes",
            userId
        });
    }

    async emitAgentAction(agentId: string, action: string, result: any, userId?: string): Promise<void> {
        await this.emit({
            type: "agent_action",
            data: { agentId, action, result },
            source: "agent",
            userId
        });
    }

    async emitAgentError(agentId: string, error: string, userId?: string): Promise<void> {
        await this.emit({
            type: "agent_error",
            data: { agentId, error },
            source: "agent",
            userId
        });
    }

    async emitWorkflowTriggered(workflowId: string, userId?: string): Promise<void> {
        await this.emit({
            type: "workflow_triggered",
            data: { workflowId },
            source: "workflow",
            userId
        });
    }

    async emitWorkflowCompleted(workflowId: string, success: boolean, userId?: string): Promise<void> {
        await this.emit({
            type: "workflow_completed",
            data: { workflowId, success },
            source: "workflow",
            userId
        });
    }

    async emitSettingsChanged(setting: string, value: any, userId?: string): Promise<void> {
        await this.emit({
            type: "settings_changed",
            data: { setting, value },
            source: "settings",
            userId
        });
    }

    async emitUserIdle(userId?: string): Promise<void> {
        await this.emit({
            type: "user_idle",
            data: {},
            source: "system",
            userId
        });
    }

    async emitUserActive(userId?: string): Promise<void> {
        await this.emit({
            type: "user_active",
            data: {},
            source: "system",
            userId
        });
    }

    async emitCodespaceTerminal(codespaceName: string, userId?: string): Promise<void> {
        await this.emit({
            type: "open_codespace_terminal",
            data: { codespaceName },
            source: "agent",
            userId
        });
    }

    exportEvents(eventType?: EventType): string {
        const events = this.getHistory(eventType);
        return JSON.stringify(events, null, 2);
    }

    importEvents(json: string): void {
        try {
            const events = JSON.parse(json) as Event[];
            for (const event of events) {
                this.addToHistory(event);
            }
        } catch (error) {
            throw new Error("Invalid event data format");
        }
    }
}

export const eventBus = new EventBusService();
