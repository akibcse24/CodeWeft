/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { getAIConfig, streamCompletion } from "./ai.service";
import { Json } from "@/integrations/supabase/types";
import { eventBus } from "./event-bus.service";

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties: Record<string, unknown>;
        required?: string[];
    };
}

export const agentTools: ToolDefinition[] = [
    {
        name: "list_notes",
        description: "Retrieve a list of all notes with their titles and IDs.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "get_note_content",
        description: "Get the full content of a specific note by its ID.",
        parameters: {
            type: "object",
            properties: {
                note_id: { type: "string", description: "The ID of the note to retrieve." }
            },
            required: ["note_id"]
        }
    },
    {
        name: "create_note",
        description: "Create a new note with title and content.",
        parameters: {
            type: "object",
            properties: {
                title: { type: "string", description: "The title of the note." },
                content: { type: "string", description: "The content of the note." }
            },
            required: ["title"]
        }
    },
    {
        name: "update_note",
        description: "Update an existing note.",
        parameters: {
            type: "object",
            properties: {
                note_id: { type: "string", description: "The ID of the note to update." },
                title: { type: "string", description: "The new title." },
                content: { type: "string", description: "The new content." }
            },
            required: ["note_id"]
        }
    },
    {
        name: "delete_note",
        description: "Delete a note by ID.",
        parameters: {
            type: "object",
            properties: {
                note_id: { type: "string", description: "The ID of the note to delete." }
            },
            required: ["note_id"]
        }
    },
    {
        name: "list_tasks",
        description: "Get a list of all current tasks.",
        parameters: {
            type: "object",
            properties: {
                filter: { type: "string", enum: ["all", "pending", "completed"], description: "Filter tasks by status." }
            }
        }
    },
    {
        name: "create_task",
        description: "Create a new task.",
        parameters: {
            type: "object",
            properties: {
                title: { type: "string", description: "The title of the task." },
                description: { type: "string", description: "The description of the task." },
                priority: { type: "string", enum: ["low", "medium", "high"], description: "The priority of the task." },
                due_date: { type: "string", description: "The due date (ISO format)." }
            },
            required: ["title"]
        }
    },
    {
        name: "update_task",
        description: "Update an existing task.",
        parameters: {
            type: "object",
            properties: {
                task_id: { type: "string", description: "The ID of the task to update." },
                title: { type: "string", description: "The new title." },
                status: { type: "string", enum: ["pending", "in_progress", "completed"], description: "The new status." },
                priority: { type: "string", enum: ["low", "medium", "high"], description: "The new priority." }
            },
            required: ["task_id"]
        }
    },
    {
        name: "complete_task",
        description: "Mark a task as completed.",
        parameters: {
            type: "object",
            properties: {
                task_id: { type: "string", description: "The ID of the task to complete." }
            },
            required: ["task_id"]
        }
    },
    {
        name: "delete_task",
        description: "Delete a task by ID.",
        parameters: {
            type: "object",
            properties: {
                task_id: { type: "string", description: "The ID of the task to delete." }
            },
            required: ["task_id"]
        }
    },
    {
        name: "list_habits",
        description: "Get a list of all tracked habits.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "create_habit",
        description: "Create a new habit to track.",
        parameters: {
            type: "object",
            properties: {
                title: { type: "string", description: "The title of the habit." },
                frequency: { type: "string", enum: ["daily", "weekly"], description: "How often the habit should be done." }
            },
            required: ["title", "frequency"]
        }
    },
    {
        name: "log_habit_completion",
        description: "Log a habit completion.",
        parameters: {
            type: "object",
            properties: {
                habit_id: { type: "string", description: "The ID of the habit." }
            },
            required: ["habit_id"]
        }
    },
    {
        name: "list_papers",
        description: "Get a list of all research papers in the library.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "navigate_to_page",
        description: "Navigate to a specific page in the application.",
        parameters: {
            type: "object",
            properties: {
                path: { type: "string", description: "The path to navigate to (e.g., /notes, /tasks, /dashboard)." }
            },
            required: ["path"]
        }
    },
    {
        name: "get_current_url",
        description: "Get the current page URL.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "search_content",
        description: "Search across notes, tasks, and other content.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "The search query." },
                type: { type: "string", enum: ["all", "notes", "tasks", "papers"], description: "Filter by content type." }
            },
            required: ["query"]
        }
    },
    {
        name: "get_user_stats",
        description: "Get user statistics and productivity metrics.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "get_productivity_data",
        description: "Get detailed productivity data over time.",
        parameters: {
            type: "object",
            properties: {
                days: { type: "number", description: "Number of days to analyze (default: 30)." }
            }
        }
    },
    {
        name: "list_workflows",
        description: "Get a list of all available workflows.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "trigger_workflow",
        description: "Trigger a workflow by ID.",
        parameters: {
            type: "object",
            properties: {
                workflow_id: { type: "string", description: "The ID of the workflow to trigger." },
                params: { type: "object", description: "Parameters for the workflow." }
            },
            required: ["workflow_id"]
        }
    },
    {
        name: "get_settings",
        description: "Get current user settings.",
        parameters: {
            type: "object",
            properties: {
                category: { type: "string", description: "Optional category filter (e.g., 'appearance', 'notifications')." }
            }
        }
    },
    {
        name: "update_settings",
        description: "Update user settings.",
        parameters: {
            type: "object",
            properties: {
                category: { type: "string", description: "The settings category." },
                settings: { type: "object", description: "Settings key-value pairs to update." }
            },
            required: ["category", "settings"]
        }
    },
    {
        name: "list_courses",
        description: "Get a list of all enrolled courses.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "create_course",
        description: "Create a new course entry.",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "The course name." },
                code: { type: "string", description: "The course code." },
                credits: { type: "number", description: "Number of credits." }
            },
            required: ["name", "code"]
        }
    },
    {
        name: "list_flashcard_decks",
        description: "Get a list of all flashcard decks.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "create_flashcard_deck",
        description: "Create a new flashcard deck.",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "The deck name." },
                cards: { type: "array", items: { type: "object" }, description: "Array of card objects with 'front' and 'back'." }
            },
            required: ["name"]
        }
    },
    {
        name: "list_projects",
        description: "Get a list of all projects.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "create_project",
        description: "Create a new project.",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "The project name." },
                description: { type: "string", description: "The project description." }
            },
            required: ["name"]
        }
    },
    {
        name: "list_dsa_problems",
        description: "Get a list of DSA problems tracked.",
        parameters: {
            type: "object",
            properties: {
                difficulty: { type: "string", enum: ["easy", "medium", "hard"], description: "Filter by difficulty." }
            }
        }
    },
    {
        name: "add_dsa_problem",
        description: "Add a DSA problem to track.",
        parameters: {
            type: "object",
            properties: {
                title: { type: "string", description: "Problem title." },
                difficulty: { type: "string", enum: ["easy", "medium", "hard"], description: "Problem difficulty." },
                url: { type: "string", description: "Problem URL." }
            },
            required: ["title", "difficulty"]
        }
    },
    {
        name: "get_github_repositories",
        description: "Get list of GitHub repositories.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "create_gist",
        description: "Create a new GitHub gist.",
        parameters: {
            type: "object",
            properties: {
                filename: { type: "string", description: "The gist filename." },
                content: { type: "string", description: "The gist content." },
                description: { type: "string", description: "Gist description." }
            },
            required: ["filename", "content"]
        }
    }
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleToolCall = async (toolName: string, args: Record<string, any>, userId: string) => {
    switch (toolName) {
        case "list_notes": {
            const { data, error } = await supabase
                .from("pages")
                .select("id, title")
                .eq("user_id", userId)
                .eq("is_archived", false);
            if (error) throw error;
            return data;
        }
        case "get_note_content": {
            const { data, error } = await supabase
                .from("pages")
                .select("content")
                .eq("id", args.note_id as string)
                .single();
            if (error) throw error;
            return data.content;
        }
        case "create_note": {
            const { data, error } = await supabase
                .from("pages")
                .insert({
                    title: args.title as string,
                    content: (args.content as string) || "",
                    user_id: userId
                })
                .select()
                .single();
            if (error) throw error;
            await eventBus.emitNoteCreated(data.id, data.title, userId);
            return data;
        }
        case "update_note": {
            const updateData: Record<string, unknown> = {};
            if (args.title) updateData.title = args.title;
            if (args.content !== undefined) updateData.content = args.content;

            const { data, error } = await supabase
                .from("pages")
                .update(updateData)
                .eq("id", args.note_id as string)
                .eq("user_id", userId)
                .select()
                .single();
            if (error) throw error;
            await eventBus.emitNoteUpdated(String(args.note_id), userId);
            return data;
        }
        case "delete_note": {
            const { error } = await supabase
                .from("pages")
                .update({ is_archived: true })
                .eq("id", args.note_id as string)
                .eq("user_id", userId);
            if (error) throw error;
            return { success: true, message: "Note archived" };
        }
        case "list_tasks": {
            let query = supabase
                .from("tasks")
                .select("*")
                .eq("user_id", userId);

            if ((args.filter as string) === "pending") {
                query = query.eq("status", "pending");
            } else if ((args.filter as string) === "completed") {
                query = query.eq("status", "completed");
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
        case "create_task": {
            const { data, error } = await supabase
                .from("tasks")
                .insert({
                    title: args.title as string,
                    description: (args.description as string) || "",
                    priority: (args.priority as string) || "medium",
                    due_date: (args.due_date as string) || null,
                    user_id: userId
                })
                .select()
                .single();
            if (error) throw error;
            await eventBus.emitTaskCreated(data.id, data.title, userId);
            return data;
        }
        case "update_task": {
            const updateData: Record<string, unknown> = {};
            if (args.title) updateData.title = args.title;
            if (args.status) updateData.status = args.status;
            if (args.priority) updateData.priority = args.priority;

            const { data, error } = await supabase
                .from("tasks")
                .update(updateData)
                .eq("id", args.task_id as string)
                .eq("user_id", userId)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
        case "complete_task": {
            const { data, error } = await supabase
                .from("tasks")
                .update({ status: "completed", completed_at: new Date().toISOString() })
                .eq("id", args.task_id as string)
                .eq("user_id", userId)
                .select()
                .single();
            if (error) throw error;
            await eventBus.emitTaskCompleted(String(args.task_id), userId);
            return data;
        }
        case "delete_task": {
            const { error } = await supabase
                .from("tasks")
                .delete()
                .eq("id", args.task_id as string)
                .eq("user_id", userId);
            if (error) throw error;
            return { success: true, message: "Task deleted" };
        }
        case "list_habits": {
            const { data, error } = await supabase
                .from("habits")
                .select("*")
                .eq("user_id", userId);
            if (error) throw error;
            return data;
        }
        case "create_habit": {
            const { data, error } = await supabase
                .from("habits")
                .insert({
                    name: String(args.title || args.name),
                    frequency: (args.frequency as string) || "daily",
                    user_id: userId
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        }
        case "log_habit_completion": {
            const { data, error } = await supabase
                .from("habit_completions")
                .insert({
                    habit_id: args.habit_id as string,
                    user_id: userId,
                    completed_date: new Date().toISOString()
                })
                .select()
                .single();
            if (error) throw error;
            await eventBus.emitHabitCompleted(String(args.habit_id), userId);
            return data;
        }
        case "list_papers": {
            const { data, error } = await supabase
                .from("pages")
                .select("*")
                .eq("user_id", userId)
                .contains("tags", ["research"]);
            if (error) throw error;
            return data;
        }
        case "list_courses": {
            const { data, error } = await supabase
                .from("courses")
                .select("*")
                .eq("user_id", userId);
            if (error) throw error;
            return data;
        }
        case "create_course": {
            const { data, error } = await supabase
                .from("courses")
                .insert([{
                    title: args.name as string,
                    name: args.name as string,
                    code: args.code as string,
                    credits: (args.credits as number) || 3,
                    user_id: userId
                }])
                .select()
                .single();
            if (error) throw error;
            return data;
        }
        case "list_flashcard_decks": {
            const { data, error } = await supabase
                .from("flashcard_decks")
                .select("*")
                .eq("user_id", userId);
            if (error) throw error;
            return data;
        }
        case "create_flashcard_deck": {
            const { data, error } = await supabase
                .from("flashcard_decks")
                .insert({
                    name: args.name as string,
                    card_count: Array.isArray(args.cards) ? args.cards.length : 0,
                    user_id: userId
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        }
        case "list_projects": {
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .eq("user_id", userId);
            if (error) throw error;
            return data;
        }
        case "create_project": {
            const { data, error } = await supabase
                .from("projects")
                .insert({
                    name: args.name as string,
                    description: (args.description as string) || "",
                    user_id: userId
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        }
        case "list_dsa_problems": {
            let query = supabase
                .from("dsa_problems")
                .select("*")
                .eq("user_id", userId);

            if (args.difficulty) {
                query = query.eq("difficulty", args.difficulty as string);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
        case "add_dsa_problem": {
            const { data, error } = await supabase
                .from("dsa_problems")
                .insert({
                    title: args.title as string,
                    difficulty: args.difficulty as string,
                    url: (args.url as string) || "",
                    user_id: userId
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        }
        case "get_user_stats": {
            const [tasksResult, habitsResult, notesResult] = await Promise.all([
                supabase.from("tasks").select("id").eq("user_id", userId),
                supabase.from("habits").select("id").eq("user_id", userId),
                supabase.from("pages").select("id").eq("user_id", userId).eq("is_archived", false)
            ]);

            return {
                total_tasks: tasksResult.data?.length || 0,
                total_habits: habitsResult.data?.length || 0,
                total_notes: notesResult.data?.length || 0
            };
        }
        case "get_productivity_data": {
            const days = (args.days as number) || 30;
            const { data, error } = await supabase
                .from("tasks")
                .select("completed_at")
                .eq("user_id", userId)
                .eq("status", "completed")
                .gte("completed_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

            if (error) throw error;

            const byDay = data?.reduce((acc, task) => {
                const day = task.completed_at?.split("T")[0];
                acc[day] = (acc[day] || 0) + 1;
                return acc;
            }, {} as Record<string, number>) || {};

            return {
                period_days: days,
                tasks_completed: data?.length || 0,
                completion_by_day: byDay
            };
        }
        case "navigate_to_page":
            // Navigation is handled client-side
            return {
                action: "navigate",
                path: args.path,
                message: `Navigating to ${args.path}`
            };
        case "search_content": {
            const query = (args.query as string) || "";
            const type = (args.type as string) || "all";

            const results: unknown[] = [];

            if (type === "all" || type === "notes") {
                const { data: notes } = await supabase
                    .from("pages")
                    .select("id, title, tags")
                    .eq("user_id", userId)
                    .ilike("title", `%${query}%`)
                    .limit(10);
                if (notes) results.push(...notes.map(n => ({ ...n, type: "note" })));
            }

            if (type === "all" || type === "tasks") {
                const { data: tasks } = await supabase
                    .from("tasks")
                    .select("id, title, status, priority")
                    .eq("user_id", userId)
                    .ilike("title", `%${query}%`)
                    .limit(10);
                if (tasks) results.push(...tasks.map(t => ({ ...t, type: "task" })));
            }

            return { results, query, type };
        }
        case "explain_concept": {
            // This is handled by the AI - just return acknowledgment
            return {
                action: "explain",
                topic: args.topic,
                depth: args.depth || "detailed",
                message: `Explaining ${args.topic}`
            };
        }
        case "general_response": {
            // General response from AI - already has content
            return {
                action: "general_response",
                response: args.response || args.query
            };
        }
        case "get_current_url":
        case "list_workflows":
        case "trigger_workflow":
        case "get_settings":
        case "update_settings":
        case "get_github_repositories":
        case "create_gist":
            return {
                action: toolName,
                params: args,
                message: "This action would be handled by the appropriate service"
            };
        default:
            // For unknown actions, try to provide helpful feedback
            console.warn(`Unknown tool: ${toolName}`);
            return {
                action: "unknown",
                message: `I don't know how to handle "${toolName}" yet. Try asking me something else!`
            };
    }
};

export const runAgentLoop = async (messages: any[], userId: string) => {
    // For now, use simple chat without tool calling via edge function
    // Tool calling requires more complex backend integration
    const stream = await streamCompletion(messages);

    // Collect full response for tool analysis
    let fullContent = "";
    const chunks: any[] = [];

    for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content || "";
        if (content) {
            fullContent += content;
            chunks.push(chunk);
        }
    }

    // Return a response-like object
    return {
        choices: [{
            message: {
                role: "assistant",
                content: fullContent,
                tool_calls: null // Tool calling not supported via edge function yet
            }
        }]
    };
};
