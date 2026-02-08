/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAIConfig, streamCompletion } from "../ai.service";
import { agentTools, handleToolCall } from "../agent.service";
import { memoryService } from "../memory.service";
import { eventBus } from "../event-bus.service";
import { plannerService, PlanningContext } from "../planner.service";

export interface EnhancedAgentConfig {
    maxTurns: number;
    maxRetries: number;
    enableMultiTurnReasoning: boolean;
    enableActionChaining: boolean;
    enableAutoPlanning: boolean;
}

export interface AgentExecutionContext {
    userId: string;
    conversationHistory: any[];
    currentTurn: number;
    previousActions: string[];
    pendingActions: string[];
    config: EnhancedAgentConfig;
}

export interface AgentResponse {
    content?: string;
    toolCalls?: any[];
    requiresConfirmation?: boolean;
    needsMoreInfo?: boolean;
    plan?: any;
}

class EnhancedAgentService {
    private defaultConfig: EnhancedAgentConfig = {
        maxTurns: 10,
        maxRetries: 3,
        enableMultiTurnReasoning: true,
        enableActionChaining: true,
        enableAutoPlanning: true
    };

    async processUserMessage(
        userMessage: string,
        userId: string,
        config?: Partial<EnhancedAgentConfig>
    ): Promise<AsyncIterable<any>> {
        const fullConfig = { ...this.defaultConfig, ...config };
        const context: AgentExecutionContext = {
            userId,
            conversationHistory: this.buildInitialMessages(userMessage, userId),
            currentTurn: 0,
            previousActions: [],
            pendingActions: [],
            config: fullConfig
        };

        return this.runEnhancedAgentLoop(context);
    }

    private buildInitialMessages(userMessage: string, userId: string): any[] {
        const contextSummary = memoryService.getContextSummary();
        const preferences = memoryService.getUserPreferences?.() || {};

        return [
            {
                role: "system",
                content: `You are an intelligent agent helping users manage their productivity, learning, and development tasks. 

You have access to various tools to interact with the user's data. Use them appropriately.

Current Context:
${contextSummary}

User Preferences:
${JSON.stringify(preferences)}

Capabilities:
- Create, read, update, delete tasks, notes, habits
- Navigate between pages
- Search content
- Get productivity stats
- Work with courses, projects, flashcards
- GitHub operations

Instructions:
1. Always use tools when you need to interact with data
2. If you need more information, ask the user
3. Provide clear, helpful responses
4. If a request is complex, break it down into steps
5. Learn from user interactions
6. Be proactive in suggesting helpful actions`
            },
            {
                role: "user",
                content: userMessage
            }
        ];
    }

    private async *runEnhancedAgentLoop(
        context: AgentExecutionContext
    ): AsyncIterable<any> {
        const config = getAIConfig();

        while (context.currentTurn < context.config.maxTurns) {
            context.currentTurn++;

            try {
                // Use streamCompletion instead of direct client
                const stream = await streamCompletion(context.conversationHistory);
                
                let fullContent = "";
                for await (const chunk of stream) {
                    const content = chunk.choices?.[0]?.delta?.content || "";
                    if (content) {
                        fullContent += content;
                        yield { content };
                    }
                }
                
            } catch (error) {
                const recovered = await this.handleError(error, context);
                if (!recovered) {
                    yield {
                        error: error instanceof Error ? error.message : "An unexpected error occurred"
                    };
                    return;
                }
            }
        }

        if (context.currentTurn >= context.config.maxTurns) {
            yield {
                content: "I've reached the maximum number of turns. Let me know if you need help with anything else."
            };
        }
    }

    private async *streamFinalResponse(message: any, context: AgentExecutionContext): AsyncIterable<any> {
        try {
            const stream = await streamCompletion(context.conversationHistory);

            for await (const chunk of stream) {
                const content = chunk.choices?.[0]?.delta?.content || "";
                if (content) {
                    yield { content };
                }
            }
        } catch (error) {
            yield {
                error: error instanceof Error ? error.message : "Failed to generate response"
            };
        }
    }

    private async executeToolCalls(toolCalls: any[], context: AgentExecutionContext): Promise<any[]> {
        const results: any[] = [];

        for (const toolCall of toolCalls) {
            if (toolCall.type !== "function") continue;

            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);

            context.previousActions.push(functionName);

            try {
                const toolResponse = await this.executeWithRetry(
                    () => handleToolCall(functionName, functionArgs, context.userId),
                    context.config.maxRetries,
                    functionName
                );

                results.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: functionName,
                    content: JSON.stringify(toolResponse),
                });

                await memoryService.storeShortTerm({
                    type: "action",
                    content: {
                        type: functionName,
                        outcome: "success",
                        params: functionArgs
                    }
                });

                await eventBus.emitAgentAction("enhanced_agent", `Executed: ${functionName}`, {
                    args: functionArgs
                });

            } catch (error) {
                results.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: functionName,
                    content: JSON.stringify({
                        error: error instanceof Error ? error.message : "Unknown error"
                    }),
                });

                await memoryService.storeShortTerm({
                    type: "action",
                    content: {
                        type: functionName,
                        outcome: "failure",
                        error: error instanceof Error ? error.message : "Unknown error"
                    }
                });

                await eventBus.emitAgentError("enhanced_agent", `Failed: ${functionName}`, error);
            }
        }

        return results;
    }

    private async executeWithRetry<T>(
        fn: () => Promise<T>,
        maxRetries: number,
        actionName: string
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error("Unknown error");

                if (attempt < maxRetries) {
                    await this.delay(Math.pow(2, attempt) * 1000);
                }
            }
        }

        throw lastError;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async handleError(error: unknown, context: AgentExecutionContext): Promise<boolean> {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        await eventBus.emitAgentError("enhanced_agent", errorMessage);

        const recoveryActions = this.getRecoveryActions(error);
        if (recoveryActions.length > 0) {
            context.conversationHistory.push({
                role: "system",
                content: `I encountered an error: ${errorMessage}. Attempting recovery: ${recoveryActions.join(", ")}`
            });

            return true;
        }

        return false;
    }

    private getRecoveryActions(error: unknown): string[] {
        const errorMessage = error instanceof Error ? error.message.toLowerCase() : "";

        if (errorMessage.includes("not found") || errorMessage.includes("404")) {
            return ["checking alternative data sources", "searching for similar items"];
        }

        if (errorMessage.includes("permission") || errorMessage.includes("unauthorized")) {
            return ["requesting user permission", "checking access rights"];
        }

        if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
            return ["retrying with exponential backoff", "checking connection"];
        }

        if (errorMessage.includes("validation") || errorMessage.includes("invalid")) {
            return ["validating input", "requesting corrected input"];
        }

        return [];
    }

    private async chainActions(
        context: AgentExecutionContext,
        results: any[]
    ): Promise<{ shouldContinue: boolean }> {
        const lastResult = results[results.length - 1];
        if (!lastResult || !lastResult.content) {
            return { shouldContinue: false };
        }

        const parsed = JSON.parse(lastResult.content);
        if (parsed.error) {
            return { shouldContinue: false };
        }

        const suggestedActions = this.detectSuggestedActions(parsed);
        if (suggestedActions.length > 0) {
            for (const action of suggestedActions) {
                context.pendingActions.push(action);
            }

            if (context.pendingActions.length < 5) {
                return { shouldContinue: true };
            }
        }

        return { shouldContinue: false };
    }

    private detectSuggestedActions(result: any): string[] {
        const actions: string[] = [];

        if (Array.isArray(result) && result.length > 0) {
            if (result.some(item => item.id && item.title)) {
                actions.push("list_notes");
            }
            if (result.some(item => item.status && item.title)) {
                actions.push("list_tasks");
            }
        }

        return actions;
    }

    private isResponseComplete(results: any[], context: AgentExecutionContext): boolean {
        const hasErrors = results.some(r => {
            try {
                const parsed = JSON.parse(r.content);
                return parsed.error !== undefined;
            } catch {
                return false;
            }
        });

        if (hasErrors) {
            return false;
        }

        if (context.config.enableMultiTurnReasoning) {
            return context.currentTurn >= 3;
        }

        return true;
    }

    private async tryCreatePlan(context: AgentExecutionContext, toolCalls: any[]): Promise<any | null> {
        const complexIndicators = [
            "and then",
            "after that",
            "first",
            "then",
            "finally",
            "multiple",
            "several",
            "all of"
        ];

        const lastUserMessage = context.conversationHistory
            .filter(m => m.role === "user")
            .pop();

        if (!lastUserMessage) return null;

        const isComplex = complexIndicators.some(indicator =>
            lastUserMessage.content.toLowerCase().includes(indicator)
        );

        if (!isComplex) return null;

        const planningContext: PlanningContext = {
            userGoal: lastUserMessage.content,
            currentState: { summary: memoryService.getContextSummary() },
            availableActions: agentTools.map(t => t.name),
            preferences: await memoryService.getUserPreferences?.() || {}
        };

        try {
            const plan = await plannerService.createPlan(
                "enhanced_agent",
                context.userId,
                planningContext
            );

            return plan;
        } catch {
            return null;
        }
    }

    private async *executePlan(plan: any, context: AgentExecutionContext): AsyncIterable<any> {
            yield {
                type: "plan",
                plan: {
                    id: plan.id,
                    description: plan.description,
                    steps: plan.steps.length,
                    estimatedDuration: plan.estimatedTotalDuration
                }
            } as any;

        try {
            let stepIndex = 0;
            const steps = plan.steps;

            for (const step of steps) {
                yield {
                    type: "plan_progress",
                    step: stepIndex + 1,
                    total: steps.length,
                    description: step.description
                };

                const actionId = await plannerService["actionService"]?.createAction?.(step.actionType, "enhanced_agent", step.params, context.userId) || "";
                if (actionId) {
                    await plannerService["actionService"]?.executeAction?.(actionId);
                }

                stepIndex++;
            }

            yield {
                type: "plan_complete",
                planId: plan.id
            };

        } catch (error) {
            yield {
                type: "plan_error",
                error: error instanceof Error ? error.message : "Plan execution failed"
            };
        }
    }

    async cancelExecution(userId: string): Promise<void> {
        await eventBus.emitAgentAction("enhanced_agent", "Execution cancelled", { userId });
    }
}

export const enhancedAgentService = new EnhancedAgentService();
