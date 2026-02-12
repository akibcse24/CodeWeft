import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect, useCallback, useRef, useMemo, useState } from "react";
import { toast } from "./use-toast";
import { Database } from "@/integrations/supabase/types";

// Core tables to sync
const CORE_TABLES = [
    'tasks',
    'pages',
    'courses',
    'habits',
    'projects',
    'ml_notes',
    'dsa_problems',
    'flashcard_decks',
    'flashcards',
    'habit_completions',
    'habit_logs',
    'papers',
    'resources',
    'secrets_vault',
    'github_settings',
    'profiles',
    'growth_roadmaps',
    'growth_skills',
    'growth_retros'
] as const;

type TableName = keyof Database['public']['Tables'];

import { useSyncContext } from "./useSyncContext";

export function useSync() {
    // Note: background sync is handled by SyncProvider
    const context = useSyncContext();
    return context;
}
