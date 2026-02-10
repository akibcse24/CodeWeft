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
        name: "list_github_repositories",
        description: "Get list of all GitHub repositories for the authenticated user.",
        parameters: {
            type: "object",
            properties: {
                sort: { type: "string", enum: ["created", "updated", "pushed", "full_name"], description: "The property to sort by." },
                direction: { type: "string", enum: ["asc", "desc"], description: "The order to sort by." }
            }
        }
    },
    {
        name: "create_github_repository",
        description: "Create a new GitHub repository.",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "The name of the new repository." },
                description: { type: "string", description: "A short description of the repository." },
                private: { type: "boolean", description: "Whether the repository should be private." }
            },
            required: ["name"]
        }
    },
    {
        name: "list_github_gists",
        description: "Get a list of all your GitHub Gists.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "create_github_gist",
        description: "Create a new code snippet (GitHub Gist).",
        parameters: {
            type: "object",
            properties: {
                filename: { type: "string", description: "The name of the file." },
                content: { type: "string", description: "The code content." },
                description: { type: "string", description: "Gist description." },
                is_public: { type: "boolean", description: "Whether the gist is public." }
            },
            required: ["filename", "content"]
        }
    },
    {
        name: "get_github_profile",
        description: "Get your GitHub profile details and statistics.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "list_github_workflows",
        description: "List all GitHub Actions workflows in a repository.",
        parameters: {
            type: "object",
            properties: {
                owner: { type: "string", description: "The owner of the repository." },
                repo: { type: "string", description: "The name of the repository." }
            },
            required: ["owner", "repo"]
        }
    },
    {
        name: "trigger_github_workflow",
        description: "Trigger a GitHub Actions workflow.",
        parameters: {
            type: "object",
            properties: {
                owner: { type: "string", description: "The owner of the repository." },
                repo: { type: "string", description: "The name of the repository." },
                workflow_id: { type: "string", description: "The ID or filename of the workflow." },
                ref: { type: "string", description: "The reference (branch/tag) to trigger it on." }
            },
            required: ["owner", "repo", "workflow_id"]
        }
    },
    {
        name: "get_github_file_content",
        description: "Get the content of a file from a GitHub repository.",
        parameters: {
            type: "object",
            properties: {
                owner: { type: "string", description: "The owner of the repository." },
                repo: { type: "string", description: "The name of the repository." },
                path: { type: "string", description: "The path to the file." },
                ref: { type: "string", description: "The branch, tag, or commit SHA." }
            },
            required: ["owner", "repo", "path"]
        }
    },
    {
        name: "update_github_file",
        description: "Update or create a file in a GitHub repository.",
        parameters: {
            type: "object",
            properties: {
                owner: { type: "string", description: "The owner of the repository." },
                repo: { type: "string", description: "The name of the repository." },
                path: { type: "string", description: "The path to the file." },
                content: { type: "string", description: "The new content of the file." },
                message: { type: "string", description: "The commit message." },
                branch: { type: "string", description: "The target branch." },
                sha: { type: "string", description: "The blob SHA (required for updates)." }
            },
            required: ["owner", "repo", "path", "content", "message"]
        }
    },
    {
        name: "list_github_branches",
        description: "List all branches in a GitHub repository.",
        parameters: {
            type: "object",
            properties: {
                owner: { type: "string", description: "The owner of the repository." },
                repo: { type: "string", description: "The name of the repository." }
            },
            required: ["owner", "repo"]
        }
    },
    {
        name: "list_github_pull_requests",
        description: "List pull requests for a GitHub repository.",
        parameters: {
            type: "object",
            properties: {
                owner: { type: "string", description: "The owner of the repository." },
                repo: { type: "string", description: "The name of the repository." },
                state: { type: "string", enum: ["open", "closed", "all"], description: "The state of PRs." }
            },
            required: ["owner", "repo"]
        }
    },
    {
        name: "create_github_pull_request",
        description: "Create a new pull request on GitHub.",
        parameters: {
            type: "object",
            properties: {
                owner: { type: "string", description: "The owner of the repository." },
                repo: { type: "string", description: "The name of the repository." },
                title: { type: "string", description: "The title of the PR." },
                head: { type: "string", description: "The branch where your changes are implemented." },
                base: { type: "string", description: "The branch you want your changes pulled into." },
                body: { type: "string", description: "The description of the PR." }
            },
            required: ["owner", "repo", "title", "head"]
        }
    },
    {
        name: "search_github_code",
        description: "Search for code snippets on GitHub.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "The search query." }
            },
            required: ["query"]
        }
    },
    {
        name: "list_codespaces",
        description: "List all your GitHub Codespaces.",
        parameters: { type: "object", properties: {} }
    },
    {
        name: "start_codespace",
        description: "Start a GitHub Codespace.",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "The name of the codespace." }
            },
            required: ["name"]
        }
    },
    {
        name: "stop_codespace",
        description: "Stop a GitHub Codespace.",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "The name of the codespace." }
            },
            required: ["name"]
        }
    },
    {
        name: "open_codespace_terminal",
        description: "Open the in-browser terminal for a specific codespace.",
        parameters: {
            type: "object",
            properties: {
                name: { type: "string", description: "The name of the codespace." }
            },
            required: ["name"]
        }
    },
    {
        name: "create_codespace",
        description: "Create a new GitHub Codespace for a repository.",
        parameters: {
            type: "object",
            properties: {
                owner: { type: "string", description: "The owner of the repository." },
                repo: { type: "string", description: "The name of the repository." },
                branch: { type: "string", description: "The branch name." }
            },
            required: ["owner", "repo"]
        }
    }
];

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
                .update(updateData as any)
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
                .update({ status: "completed", completed_at: new Date().toISOString() } as any)
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
        case "list_github_repositories": {
            const { listUserRepositories } = await import("./github/repository.service");
            return await listUserRepositories({
                sort: args.sort as any || "updated",
                direction: args.direction as any || "desc"
            });
        }
        case "create_github_repository": {
            const { createRepository } = await import("./github/repository.service");
            return await createRepository(args.name as string, {
                description: args.description as string,
                private: args.private as boolean
            });
        }
        case "list_github_gists": {
            const { listGists } = await import("./github/gist.service");
            return await listGists();
        }
        case "create_github_gist": {
            const { createGist } = await import("./github/gist.service");
            return await createGist(
                { [args.filename as string]: { content: args.content as string } },
                args.description as string || "",
                args.is_public !== false
            );
        }
        case "list_github_workflows": {
            const { listWorkflows } = await import("./github/actions.service");
            return await listWorkflows(args.owner as string, args.repo as string);
        }
        case "trigger_github_workflow": {
            const { triggerWorkflow } = await import("./github/actions.service");
            return await triggerWorkflow(
                args.owner as string,
                args.repo as string,
                args.workflow_id as string,
                (args.ref as string) || "main"
            );
        }
        case "get_github_file_content": {
            const { getFileContent } = await import("./github/git.service");
            const data = await getFileContent(
                args.owner as string,
                args.repo as string,
                args.path as string,
                (args.ref as string) || "main"
            );
            // Decode base64 content
            if (data.content && data.encoding === "base64") {
                try {
                    data.content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ""))));
                } catch (e) {
                    console.error("Failed to decode base64 content", e);
                }
            }
            return data;
        }
        case "update_github_file": {
            const { updateFile } = await import("./github/git.service");
            return await updateFile(
                args.owner as string,
                args.repo as string,
                args.path as string,
                args.content as string,
                args.message as string,
                (args.branch as string) || "main",
                args.sha as string
            );
        }
        case "list_github_branches": {
            const { listBranches } = await import("./github/git.service");
            return await listBranches(args.owner as string, args.repo as string);
        }
        case "list_github_pull_requests": {
            const { listPullRequests } = await import("./github/git.service");
            return await listPullRequests(
                args.owner as string,
                args.repo as string,
                args.state as any || "open"
            );
        }
        case "create_github_pull_request": {
            const { createPullRequest } = await import("./github/git.service");
            return await createPullRequest(
                args.owner as string,
                args.repo as string,
                args.title as string,
                args.head as string,
                (args.base as string) || "main",
                args.body as string
            );
        }
        case "search_github_code": {
            const { getOctokit } = await import("./github/octokit.service");
            const octokit = await getOctokit();
            const { data } = await octokit.rest.search.code({
                q: args.query as string,
            });
            return data.items;
        }
        case "list_codespaces": {
            const { listCodespaces } = await import("./github/codespaces.service");
            return await listCodespaces();
        }
        case "start_codespace": {
            const { startCodespace } = await import("./github/codespaces.service");
            return await startCodespace(args.name as string);
        }
        case "stop_codespace": {
            const { stopCodespace } = await import("./github/codespaces.service");
            return await stopCodespace(args.name as string);
        }
        case "create_codespace": {
            const { createCodespace } = await import("./github/codespaces.service");
            return await createCodespace(
                args.owner as string,
                args.repo as string,
                args.branch as string
            );
        }
        case "open_codespace_terminal": {
            // Emitting event for the UI to handle
            await eventBus.emitCodespaceTerminal(args.name as string);
            return { success: true, message: `Opening terminal for ${args.name}` };
        }
        case "get_current_url":
            return {
                url: window.location.href,
                path: window.location.pathname
            };
        case "get_settings":
        case "update_settings":
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
