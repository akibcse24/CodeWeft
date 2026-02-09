import Dexie, { type Table } from 'dexie';
import { Tables } from '@/integrations/supabase/types';

export class CodeweftStore extends Dexie {
    tasks!: Table<Tables<"tasks">>;
    pages!: Table<Tables<"pages">>;
    ml_notes!: Table<Tables<"ml_notes">>;
    dsa_problems!: Table<Tables<"dsa_problems">>;
    flashcard_decks!: Table<Tables<"flashcard_decks">>;
    flashcards!: Table<Tables<"flashcards">>;
    courses!: Table<Tables<"courses">>;
    habits!: Table<Tables<"habits">>;
    habit_completions!: Table<Tables<"habit_completions">>;
    habit_logs!: Table<Tables<"habit_logs">>;
    papers!: Table<Tables<"papers">>;
    projects!: Table<Tables<"projects">>;
    resources!: Table<Tables<"resources">>;
    secrets_vault!: Table<Tables<"secrets_vault">>;
    github_settings!: Table<Tables<"github_settings">>;
    profiles!: Table<Tables<"profiles">>;
    deleted_pages!: Table<Tables<"deleted_pages">>;
    sync_queue!: Table<{
        id?: number;
        table: string;
        action: 'insert' | 'update' | 'delete';
        data: Record<string, unknown>;
        timestamp: number;
    }>;

    constructor() {
        super('CodeweftDB');
        this.version(2).stores({
            tasks: 'id, user_id, status, priority, updated_at',
            pages: 'id, user_id, parent_id, is_favorite, updated_at',
            ml_notes: 'id, user_id, category, is_favorite, updated_at',
            dsa_problems: 'id, user_id, difficulty, status, updated_at',
            flashcard_decks: 'id, user_id, updated_at',
            flashcards: 'id, deck_id, updated_at',
            courses: 'id, user_id, status, updated_at',
            habits: 'id, user_id, is_active, updated_at',
            habit_completions: 'id, user_id, habit_id, updated_at',
            habit_logs: 'id, user_id, habit_id, updated_at',
            papers: 'id, user_id, status, updated_at',
            projects: 'id, user_id, status, updated_at',
            resources: 'id, user_id, type, status, updated_at',
            secrets_vault: 'id, user_id, category, updated_at',
            github_settings: 'id, user_id, updated_at',
            profiles: 'id, user_id, username, updated_at',
            deleted_pages: 'id, user_id, deleted_at, permanently_delete_at',
            sync_queue: '++id, table, action, timestamp'
        });
    }
}

export const db = new CodeweftStore();
