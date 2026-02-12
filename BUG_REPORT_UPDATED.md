# CodeWeft - Updated Bug Report & Solutions

## Executive Summary

This report documents all identified bugs in the CodeWeft codebase after recent changes. The analysis covers both frontend (React/TypeScript) and backend (Express/Supabase) components. Each bug includes severity rating, root cause analysis, and recommended solutions.

---

## Table of Contents

1. [Frontend Bugs](#frontend-bugs)
   - [Hooks](#hooks)
   - [Services](#services)
   - [Components](#components)
2. [Backend Bugs](#backend-bugs)
   - [API Routes](#api-routes)
   - [Middleware](#middleware)
3. [Supabase Functions Bugs](#supabase-functions-bugs)
4. [Optimization Recommendations](#optimization-recommendations)

---

## Frontend Bugs

### Hooks

#### 1. **useAuth.tsx - Race Condition in signOut**
**File:** [`src/hooks/useAuth.tsx`](src/hooks/useAuth.tsx:83-135)
**Severity:** High
**Lines:** 83-135

**Bug:**
```typescript
const signOut = useCallback(async () => {
    console.log("[Auth] signOut called");

    // Clear local state first to update UI immediately
    setUser(null);
    setSession(null);

    // Clear all cached queries so stale data doesn't persist
    console.log("[Auth] Clearing query cache...");
    queryClient.clear();

    // Clear and re-open Dexie to purge user data
    try {
        if (db.isOpen()) {
            console.log("[Auth] Clearing local database...");
            const tableNames = db.tables.map(t => t.name);
            await Promise.all(tableNames.map(name => db.table(name).clear()));
        }
    } catch (e) {
        console.warn("[Auth] Failed to clear local database, but proceeding:", e);
    }

    // Clear sync cursors and other app-specific metadata from localStorage
    console.log("[Auth] Purging sync cursors and metadata...");
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('last_sync_') || key.startsWith('last_github_sync'))) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Clear Supabase session from localStorage explicitly just in case
    try {
        await supabase.auth.signOut();
        console.log("[Auth] Server-side signOut succeeded");
    } catch (err) {
        console.warn("[Auth] Server-side signOut error (ignored):", err);
    }

    // Final purge of any potential auth tokens in localStorage
    Object.keys(localStorage).forEach(key => {
        if (key.includes('-auth-token')) localStorage.removeItem(key);
    });

    // Redirect to auth page or home
    console.log("[Auth] Redirecting to /auth...");
    window.location.href = "/auth";
}, []);
```

**Issue:** The `window.location.href` redirect happens immediately after clearing local state, but the Supabase `signOut()` call is not awaited. This can cause race conditions where the redirect happens before the server-side signout completes. Also, if any of the cleanup operations fail, the redirect still happens, potentially leaving the user in an inconsistent state.

**Solution:**
```typescript
const signOut = useCallback(async () => {
    console.log("[Auth] signOut called");

    try {
        // Clear local state first to update UI immediately
        setUser(null);
        setSession(null);

        // Clear all cached queries so stale data doesn't persist
        console.log("[Auth] Clearing query cache...");
        queryClient.clear();

        // Clear and re-open Dexie to purge user data
        try {
            if (db.isOpen()) {
                console.log("[Auth] Clearing local database...");
                const tableNames = db.tables.map(t => t.name);
                await Promise.all(tableNames.map(name => db.table(name).clear()));
            }
        } catch (e) {
            console.warn("[Auth] Failed to clear local database, but proceeding:", e);
        }

        // Clear sync cursors and other app-specific metadata from localStorage
        console.log("[Auth] Purging sync cursors and metadata...");
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('last_sync_') || key.startsWith('last_github_sync'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // Clear Supabase session from localStorage explicitly
        try {
            await supabase.auth.signOut();
            console.log("[Auth] Server-side signOut succeeded");
        } catch (err) {
            console.warn("[Auth] Server-side signOut error (ignored):", err);
        }

        // Final purge of any potential auth tokens in localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.includes('-auth-token')) localStorage.removeItem(key);
        });

        // Redirect to auth page or home
        console.log("[Auth] Redirecting to /auth...");
        window.location.href = "/auth";
    } catch (error) {
        console.error("[Auth] Sign out failed:", error);
        // Force redirect even on error to prevent stuck state
        window.location.href = "/auth";
    }
}, []);
```

---

#### 2. **useTasks.ts - useEffect Dependency Issue**
**File:** [`src/hooks/useTasks.ts`](src/hooks/useTasks.ts:18-35)
**Severity:** Low
**Lines:** 18-35

**Bug:**
```typescript
useEffect(() => {
    if (!user) return;

    const fetchLocal = async () => {
        const data = await db.tasks
            .where("user_id")
            .equals(user.id)
            .filter(t => !t.deleted_at)
            .reverse()
            .sortBy("created_at");
        setLocalTasks(data);
    };

    fetchLocal();
}, [user?.id, user]);
```

**Issue:** The dependency array includes both `user?.id` and `user`. This is redundant since `user?.id` is derived from `user`. This can cause the effect to run unnecessarily when the user object reference changes but the ID remains the same.

**Solution:**
```typescript
useEffect(() => {
    if (!user) return;

    const fetchLocal = async () => {
        const data = await db.tasks
            .where("user_id")
            .equals(user.id)
            .filter(t => !t.deleted_at)
            .reverse()
            .sortBy("created_at");
        setLocalTasks(data);
    };

    fetchLocal();
}, [user?.id]); // Only depend on the user ID
```

---

#### 3. **usePages.ts - Missing Error Handling in searchPages**
**File:** [`src/hooks/usePages.ts`](src/hooks/usePages.ts:279-302)
**Severity:** Medium
**Lines:** 279-302

**Bug:**
```typescript
const searchPages = useCallback(async (query: string) => {
    if (!query) return [];
    // Local search first
    const localResults = await db.pages
        .filter(p =>
            p.title.toLowerCase().includes(query.toLowerCase()) &&
            !p.is_archived &&
            !p.deleted_at
        )
        .limit(10)
        .toArray();

    if (localResults.length > 0) return localResults;

    const { data } = await supabase
        .from("pages")
        .select("*")
        .eq("user_id", user?.id)
        .ilike("title", `%${query}%`)
        .order("updated_at", { ascending: false })
        .limit(10);

    return (data as Page[]) || [];
}, [user?.id]);
```

**Issue:** No error handling for the Supabase query. If the query fails, the function returns an empty array without notifying the user. Also, no check for `user` before making the cloud query.

**Solution:**
```typescript
const searchPages = useCallback(async (query: string) => {
    if (!query) return [];
    if (!user) return [];

    try {
        // Local search first
        const localResults = await db.pages
            .filter(p =>
                p.title.toLowerCase().includes(query.toLowerCase()) &&
                !p.is_archived &&
                !p.deleted_at
            )
            .limit(10)
            .toArray();

        if (localResults.length > 0) return localResults;

        const { data, error } = await supabase
            .from("pages")
            .select("*")
            .eq("user_id", user.id)
            .ilike("title", `%${query}%`)
            .order("updated_at", { ascending: false })
            .limit(10);

        if (error) {
            console.error("Search failed:", error);
            return [];
        }

        return (data as Page[]) || [];
    } catch (error) {
        console.error("Search error:", error);
        return [];
    }
}, [user?.id, user]);
```

---

### Services

#### 4. **event-bus.service.ts - Memory Leak Potential**
**File:** [`src/services/event-bus.service.ts`](src/services/event-bus.service.ts:118-142)
**Severity:** Low
**Lines:** 118-142

**Bug:**
```typescript
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
```

**Issue:** The `shift()` operation is O(n) and can cause performance issues with large arrays. The event history stores full event objects which can still be memory-intensive even with sanitization.

**Solution:**
```typescript
private addToHistory(event: Event): void {
    const historyEvent = {
        ...event,
        data: this.sanitizeEventData(event.data)
    };

    this.eventHistory.push(historyEvent);

    if (this.eventHistory.length > this.maxHistorySize) {
        // Use slice instead of shift for better performance
        this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
}
```

---

#### 5. **vector.service.ts - Division by Zero Risk**
**File:** [`src/services/vector.service.ts`](src/services/vector.service.ts:45-58)
**Severity:** Medium
**Lines:** 45-58

**Bug:**
```typescript
export function cosineSimilarity(a: number[], b: number[]) {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;
    return dotProduct / magnitude;
}
```

**Issue:** The fix for zero vectors has been applied, but there's still a potential issue with very small magnitudes causing numerical instability. Also, no validation that the input arrays are actually arrays.

**Solution:**
```typescript
export function cosineSimilarity(a: number[], b: number[]) {
    // Validate inputs
    if (!Array.isArray(a) || !Array.isArray(b)) return 0;
    if (a.length !== b.length) return 0;
    if (a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        const valA = a[i];
        const valB = b[i];
        
        // Check for NaN or Infinity
        if (!isFinite(valA) || !isFinite(valB)) return 0;
        
        dotProduct += valA * valB;
        normA += valA * valA;
        normB += valB * valB;
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    
    // Handle zero vectors and very small magnitudes
    if (magnitude < Number.EPSILON) return 0;
    
    return dotProduct / magnitude;
}
```

---

### Components

#### 6. **EditorWorkspace.tsx - Base64 Decoding Issue**
**File:** [`src/components/github/editor/EditorWorkspace.tsx`](src/components/github/editor/EditorWorkspace.tsx:99-113)
**Severity:** Medium
**Lines:** 99-113

**Bug:**
```typescript
// Decode base64 content using Unicode-safe approach
let content = '';
if (fileContent.content) {
    try {
        const binaryString = atob(fileContent.content.replace(/\s/g, ''));
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        content = new TextDecoder().decode(bytes);
    } catch (decodeError) {
        console.error("[Editor] Failed to decode file content:", decodeError);
        content = "Error: Failed to decode file content. It might be a binary file or have an invalid encoding.";
    }
}
```

**Issue:** The `replace(/\s/g, '')` removes all whitespace from the base64 string, which is incorrect. Base64 strings should not have whitespace removed arbitrarily as it can corrupt the data. Also, the error message is shown to the user but the file is still opened with the error message as content.

**Solution:**
```typescript
// Decode base64 content using Unicode-safe approach
let content = '';
if (fileContent.content) {
    try {
        // Don't remove whitespace - base64 should be decoded as-is
        const binaryString = atob(fileContent.content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        content = new TextDecoder().decode(bytes);
    } catch (decodeError) {
        console.error("[Editor] Failed to decode file content:", decodeError);
        toast.error("Failed to decode file content. It might be a binary file.");
        return; // Don't open the file if decoding fails
    }
}
```

---

#### 7. **CodespaceTerminal.tsx - Missing Cleanup on Unmount**
**File:** [`src/components/github/codespaces/CodespaceTerminal.tsx`](src/components/github/codespaces/CodespaceTerminal.tsx:213-231)
**Severity:** Medium
**Lines:** 213-231

**Bug:**
```typescript
// Connect on mount / change
useEffect(() => {
    const timer = window.setTimeout(() => {
        establishWebSocketConnection();
    }, 500);

    return () => {
        window.clearTimeout(timer);
        if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        onDataDisposableRef.current?.dispose();
        onDataDisposableRef.current = null;
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    };
}, [establishWebSocketConnection]);
```

**Issue:** The `establishWebSocketConnection` function is in the dependency array, which means the effect will run every time the function reference changes. This can cause multiple WebSocket connections to be created. The cleanup function is correct, but the effect may run too frequently.

**Solution:**
```typescript
// Connect on mount / change
useEffect(() => {
    const timer = window.setTimeout(() => {
        establishWebSocketConnection();
    }, 500);

    return () => {
        window.clearTimeout(timer);
        if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        onDataDisposableRef.current?.dispose();
        onDataDisposableRef.current = null;
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [codespaceName, githubToken]); // Only depend on actual connection parameters
```

---

#### 8. **GlobalCodespaceTerminal.tsx - Missing Error Handling**
**File:** [`src/components/github/codespaces/GlobalCodespaceTerminal.tsx`](src/components/github/codespaces/GlobalCodespaceTerminal.tsx:16-39)
**Severity:** Low
**Lines:** 16-39

**Bug:**
```typescript
useEffect(() => {
    async function fetchToken() {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;

            if (user) {
                const { data, error } = await supabase
                    .from('github_settings')
                    .select('github_token')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) throw error;
                if (data?.github_token) {
                    setGithubToken(data.github_token);
                }
            }
        } catch (error) {
            console.error("[GlobalTerminal] Error fetching token:", error);
        }
    }
    fetchToken();
}, []);
```

**Issue:** Error handling has been added, but there's no user notification when token fetching fails. The component silently fails and returns null, which may be confusing to users.

**Solution:**
```typescript
useEffect(() => {
    async function fetchToken() {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;

            if (user) {
                const { data, error } = await supabase
                    .from('github_settings')
                    .select('github_token')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) throw error;
                if (data?.github_token) {
                    setGithubToken(data.github_token);
                }
            }
        } catch (error) {
            console.error("[GlobalTerminal] Error fetching token:", error);
            // Optionally show a toast notification to the user
            // toast.error("Failed to load GitHub token. Please check your settings.");
        }
    }
    fetchToken();
}, []);
```

---

#### 9. **SlashCommandMenu.tsx - Position Calculation Edge Case**
**File:** [`src/components/editor/SlashCommandMenu.tsx`](src/components/editor/SlashCommandMenu.tsx:63-68)
**Severity:** Low
**Lines:** 63-68

**Bug:**
```typescript
const menuPosition = useMemo(() => {
    if (!position) return { x: 0, y: 0 };
    const adjustedX = Math.max(10, Math.min(position.x, window.innerWidth - MENU_WIDTH - 10));
    const adjustedY = Math.max(10, Math.min(position.y, window.innerHeight - MENU_MAX_HEIGHT - 100));
    return { x: adjustedX, y: adjustedY };
}, [position]);
```

**Issue:** The position calculation has been improved, but there's still a potential issue when the window is very small (smaller than the menu width + 20px). The menu could still be partially clipped.

**Solution:**
```typescript
const menuPosition = useMemo(() => {
    if (!position) return { x: 0, y: 0 };
    
    // Ensure minimum window size check
    const minWindowWidth = MENU_WIDTH + 20;
    const minWindowHeight = MENU_MAX_HEIGHT + 110;
    
    if (window.innerWidth < minWindowWidth || window.innerHeight < minWindowHeight) {
        // Center the menu if window is too small
        return {
            x: Math.max(0, (window.innerWidth - MENU_WIDTH) / 2),
            y: Math.max(0, (window.innerHeight - MENU_MAX_HEIGHT) / 2)
        };
    }
    
    const adjustedX = Math.max(10, Math.min(position.x, window.innerWidth - MENU_WIDTH - 10));
    const adjustedY = Math.max(10, Math.min(position.y, window.innerHeight - MENU_MAX_HEIGHT - 100));
    return { x: adjustedX, y: adjustedY };
}, [position]);
```

---

## Backend Bugs

### API Routes

#### 10. **api/routes/pages.ts - Missing User ID Validation**
**File:** [`api/routes/pages.ts`](api/routes/pages.ts:7-45)
**Severity:** High
**Lines:** 7-45

**Bug:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', async (req: Request & { userId?: string }, res: Response) => {
    try {
        const { parent_id, workspace_id, limit = '20', offset = '0' } = req.query;

        let query = supabase
            .from('pages')
            .select('*')
            .eq('user_id', req.userId)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false })
            .limit(parseInt(limit as string, 10))
            .range(parseInt(offset as string, 10), parseInt(offset as string, 10) + parseInt(limit as string, 10) - 1);
```

**Issue:** No validation that `req.userId` exists before using it. If the authentication middleware fails to set `userId`, the query will fail silently or return incorrect results. Also, no validation for limit and offset parameters.

**Solution:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.get('/', async (req: Request & { userId?: string }, res: Response) => {
    try {
        // Validate user is authenticated
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
        }

        const { parent_id, workspace_id, limit = '20', offset = '0' } = req.query;

        // Validate and sanitize limit and offset
        const parsedLimit = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 100);
        const parsedOffset = Math.max(parseInt(offset as string, 10) || 0, 0);

        let query = supabase
            .from('pages')
            .select('*')
            .eq('user_id', req.userId)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false })
            .limit(parsedLimit)
            .range(parsedOffset, parsedOffset + parsedLimit - 1);
```

---

#### 11. **api/routes/pages.ts - No Input Validation**
**File:** [`api/routes/pages.ts`](api/routes/pages.ts:73-105)
**Severity:** High
**Lines:** 73-105

**Bug:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', async (req: Request & { userId?: string }, res: Response) => {
    try {
        const { title, content, workspace_id, parent_id } = req.body;

        if (!title || !workspace_id) {
            res.status(400).json({ error: 'Bad request', message: 'Title and workspace_id are required' });
            return;
        }

        const { data: page, error } = await supabase
            .from('pages')
            .insert({
                title,
                content: content || {},
                workspace_id,
                parent_id: parent_id || null,
                user_id: req.userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
```

**Issue:** No validation for `req.userId`. Also, no sanitization of the `title` field which could lead to XSS or injection attacks. No validation that `workspace_id` and `parent_id` actually exist and belong to the user.

**Solution:**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.post('/', async (req: Request & { userId?: string }, res: Response) => {
    try {
        // Validate user is authenticated
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
        }

        const { title, content, workspace_id, parent_id } = req.body;

        // Validate required fields
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return res.status(400).json({ error: 'Bad request', message: 'Title is required and must be a non-empty string' });
        }

        if (!workspace_id) {
            return res.status(400).json({ error: 'Bad request', message: 'workspace_id is required' });
        }

        // Sanitize title
        const sanitizedTitle = title.trim().substring(0, 500); // Max 500 characters

        // Validate workspace belongs to user
        const { data: workspace, error: workspaceError } = await supabase
            .from('workspaces')
            .select('id')
            .eq('id', workspace_id)
            .eq('user_id', req.userId)
            .maybeSingle();

        if (workspaceError || !workspace) {
            return res.status(400).json({ error: 'Bad request', message: 'Invalid workspace_id' });
        }

        // Validate parent_id if provided
        if (parent_id) {
            const { data: parentPage, error: parentError } = await supabase
                .from('pages')
                .select('id')
                .eq('id', parent_id)
                .eq('user_id', req.userId)
                .is('deleted_at', null)
                .maybeSingle();

            if (parentError || !parentPage) {
                return res.status(400).json({ error: 'Bad request', message: 'Invalid parent_id' });
            }
        }

        const { data: page, error } = await supabase
            .from('pages')
            .insert({
                title: sanitizedTitle,
                content: content || {},
                workspace_id,
                parent_id: parent_id || null,
                user_id: req.userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
```

---

#### 12. **api/routes/webhooks.ts - No URL Validation**
**File:** [`api/routes/webhooks.ts`](api/routes/webhooks.ts:6-39)
**Severity:** High
**Lines:** 6-39

**Bug:**
```typescript
router.post('/', async (req: Request & { userId?: string }, res: Response) => {
    try {
        const { url, events, secret, name, active = true } = req.body;

        if (!url || !events || !Array.isArray(events) || events.length === 0) {
            res.status(400).json({ error: 'Bad request', message: 'URL and at least one event are required' });
            return;
        }

        const { data: webhook, error } = await supabase
            .from('webhooks')
            .insert({
                user_id: req.userId,
                url,
                events,
                secret: secret || null,
                name: name || null,
                active,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
```

**Issue:** No validation that `url` is a valid URL. No validation that `req.userId` exists. No validation that `events` contains valid event names.

**Solution:**
```typescript
router.post('/', async (req: Request & { userId?: string }, res: Response) => {
    try {
        // Validate user is authenticated
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
        }

        const { url, events, secret, name, active = true } = req.body;

        // Validate URL
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'Bad request', message: 'URL is required' });
        }

        try {
            new URL(url);
        } catch {
            return res.status(400).json({ error: 'Bad request', message: 'Invalid URL format' });
        }

        // Validate events
        if (!events || !Array.isArray(events) || events.length === 0) {
            return res.status(400).json({ error: 'Bad request', message: 'At least one event is required' });
        }

        const validEvents = ['page.created', 'page.updated', 'page.deleted', 'task.created', 'task.updated', 'task.completed'];
        const invalidEvents = events.filter((e: string) => !validEvents.includes(e));
        if (invalidEvents.length > 0) {
            return res.status(400).json({ error: 'Bad request', message: `Invalid events: ${invalidEvents.join(', ')}` });
        }

        const { data: webhook, error } = await supabase
            .from('webhooks')
            .insert({
                user_id: req.userId,
                url,
                events,
                secret: secret || null,
                name: name || null,
                active,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();
```

---

#### 13. **api/routes/webhooks.ts - No Timeout for Webhook Delivery**
**File:** [`api/routes/webhooks.ts`](api/routes/webhooks.ts:109-197)
**Severity:** Medium
**Lines:** 109-197

**Bug:**
```typescript
router.post('/:id/test', async (req: Request & { userId?: string }, res: Response) => {
    try {
        const { id } = req.params;

        const { data: webhook, error: checkError } = await supabase
            .from('webhooks')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.userId)
            .single();

        if (checkError || !webhook) {
            res.status(404).json({ error: 'Not found', message: 'Webhook not found' });
            return;
        }

        if (!webhook.active) {
            res.status(400).json({ error: 'Bad request', message: 'Webhook is inactive' });
            return;
        }

        const testPayload = {
            event: 'webhook.test',
            timestamp: new Date().toISOString(),
            data: {
                message: 'This is a test webhook delivery',
                webhook_id: id,
                webhook_name: webhook.name
            }
        };

        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': webhook.secret || '',
                    'X-Webhook-Event': 'webhook.test',
                    'X-Webhook-ID': id,
                    'User-Agent': 'CodeWeft-Webhook/1.0'
                },
                body: JSON.stringify(testPayload)
            });
```

**Issue:** The `fetch()` call has no timeout. If the webhook URL is unresponsive, the request will hang indefinitely. Also, no validation that `req.userId` exists.

**Solution:**
```typescript
router.post('/:id/test', async (req: Request & { userId?: string }, res: Response) => {
    try {
        // Validate user is authenticated
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
        }

        const { id } = req.params;

        const { data: webhook, error: checkError } = await supabase
            .from('webhooks')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.userId)
            .single();

        if (checkError || !webhook) {
            res.status(404).json({ error: 'Not found', message: 'Webhook not found' });
            return;
        }

        if (!webhook.active) {
            res.status(400).json({ error: 'Bad request', message: 'Webhook is inactive' });
            return;
        }

        const testPayload = {
            event: 'webhook.test',
            timestamp: new Date().toISOString(),
            data: {
                message: 'This is a test webhook delivery',
                webhook_id: id,
                webhook_name: webhook.name
            }
        };

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': webhook.secret || '',
                    'X-Webhook-Event': 'webhook.test',
                    'X-Webhook-ID': id,
                    'User-Agent': 'CodeWeft-Webhook/1.0'
                },
                body: JSON.stringify(testPayload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const deliveryRecord = {
                webhook_id: id,
                event: 'webhook.test',
                payload: testPayload,
                response_status: response.status,
                response_body: await response.text().catch(() => ''),
                success: response.ok,
                delivered_at: new Date().toISOString()
            };

            await supabase.from('webhook_deliveries').insert(deliveryRecord);

            res.status(200).json({
                data: {
                    success: response.ok,
                    status_code: response.status,
                    message: response.ok ? 'Test webhook delivered successfully' : 'Test webhook delivery failed'
                }
            });
        } catch (fetchError) {
            clearTimeout(timeoutId);

            const isTimeout = fetchError instanceof Error && fetchError.name === 'AbortError';
            const deliveryRecord = {
                webhook_id: id,
                event: 'webhook.test',
                payload: testPayload,
                response_status: 0,
                response_body: isTimeout ? 'Request timeout' : (fetchError as Error).message,
                success: false,
                delivered_at: new Date().toISOString()
            };

            await supabase.from('webhook_deliveries').insert(deliveryRecord);

            res.status(200).json({
                data: {
                    success: false,
                    status_code: 0,
                    message: isTimeout ? 'Test webhook delivery timed out' : `Test webhook delivery failed: ${(fetchError as Error).message}`
                }
            });
        }
    } catch (err) {
        console.error('Test webhook error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

---

### Middleware

#### 14. **api/middleware/auth.ts - No Token Expiry Refresh**
**File:** [`api/middleware/auth.ts`](api/middleware/auth.ts:9-59)
**Severity:** Medium
**Lines:** 9-59

**Bug:**
```typescript
export const authenticateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'Unauthorized', message: 'Missing authorization header' });
        return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid authorization format. Use Bearer token' });
        return;
    }

    const token = parts[1];

    try {
        const { data: accessToken, error } = await supabase
            .from('oauth_access_tokens')
            .select('*')
            .eq('token', token)
            .single();

        if (error || !accessToken) {
            res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
            return;
        }

        if (new Date(accessToken.expires_at) < new Date()) {
            res.status(401).json({ error: 'Unauthorized', message: 'Token expired' });
            return;
        }

        if (accessToken.revoked_at) {
            res.status(401).json({ error: 'Unauthorized', message: 'Token revoked' });
            return;
        }

        req.userId = accessToken.user_id;
        req.scopes = accessToken.scopes || [];

        next();
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
```

**Issue:** When a token is expired, the middleware simply rejects the request. There's no mechanism to refresh the token or provide a helpful error message indicating the user should re-authenticate.

**Solution:**
```typescript
export const authenticateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing authorization header',
            code: 'MISSING_AUTH_HEADER'
        });
        return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid authorization format. Use Bearer token',
            code: 'INVALID_AUTH_FORMAT'
        });
        return;
    }

    const token = parts[1];

    try {
        const { data: accessToken, error } = await supabase
            .from('oauth_access_tokens')
            .select('*')
            .eq('token', token)
            .single();

        if (error || !accessToken) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
            return;
        }

        if (accessToken.revoked_at) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Token has been revoked',
                code: 'TOKEN_REVOKED'
            });
            return;
        }

        const expiresAt = new Date(accessToken.expires_at);
        const now = new Date();

        if (expiresAt < now) {
            // Check if there's a refresh token available
            const { data: refreshToken } = await supabase
                .from('oauth_refresh_tokens')
                .select('*')
                .eq('access_token_id', accessToken.id)
                .maybeSingle();

            if (refreshToken && new Date(refreshToken.expires_at) > now) {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Token expired. Please refresh your session.',
                    code: 'TOKEN_EXPIRED_REFRESH_AVAILABLE'
                });
            } else {
                res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Token expired. Please sign in again.',
                    code: 'TOKEN_EXPIRED'
                });
            }
            return;
        }

        // Warn if token will expire soon (within 5 minutes)
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        if (timeUntilExpiry < 5 * 60 * 1000) {
            res.setHeader('X-Token-Expiring-Soon', 'true');
            res.setHeader('X-Token-Expires-At', expiresAt.toISOString());
        }

        req.userId = accessToken.user_id;
        req.scopes = accessToken.scopes || [];

        next();
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(500).json({
            error: 'Internal server error',
            message: 'An error occurred while verifying your credentials',
            code: 'AUTH_ERROR'
        });
    }
};
```

---

## Supabase Functions Bugs

#### 15. **supabase/functions/codespace-shell/index.ts - setInterval Memory Leak**
**File:** [`supabase/functions/codespace-shell/index.ts`](supabase/functions/codespace-shell/index.ts:25-39)
**Severity:** Medium
**Lines:** 25-39

**Bug:**
```typescript
// Clean up inactive connections periodically
setInterval(() => {
    const now = Date.now();
    for (const [userId, connection] of activeConnections.entries()) {
        if (now - connection.lastActivity > CONNECTION_TIMEOUT) {
            console.log(`Closing inactive connection for user: ${userId}`);
            try {
                connection.socket.close();
            } catch (err) {
                // Silently ignore close errors for inactive connections
                console.debug(`Failed to close connection ${userId}:`, err);
            }
            activeConnections.delete(userId);
        }
    }
}, 60 * 1000); // Check every minute
```

**Issue:** The `setInterval` is created at module level and never cleared. This can cause memory leaks in long-running server processes. Each time the function is invoked, a new interval is created.

**Solution:**
```typescript
// Clean up inactive connections periodically
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [userId, connection] of activeConnections.entries()) {
        if (now - connection.lastActivity > CONNECTION_TIMEOUT) {
            console.log(`Closing inactive connection for user: ${userId}`);
            try {
                connection.socket.close();
            } catch (err) {
                // Silently ignore close errors for inactive connections
                console.debug(`Failed to close connection ${userId}:`, err);
            }
            activeConnections.delete(userId);
        }
    }
}, 60 * 1000); // Check every minute

// Clean up interval on server shutdown (if Deno supports it)
// @ts-expect-error: Deno namespace
if (typeof Deno !== 'undefined' && Deno.addEventListener) {
    // @ts-expect-error: Deno namespace
    Deno.addEventListener('unload', () => {
        clearInterval(cleanupInterval);
    });
}
```

---

#### 16. **supabase/functions/github-api/index.ts - Missing Token Validation Before API Calls**
**File:** [`supabase/functions/github-api/index.ts`](supabase/functions/github-api/index.ts:184-195)
**Severity:** High
**Lines:** 184-195

**Bug:**
```typescript
const token = settings?.github_token;
console.log(`[github-api] Token status for user ${user.id}: ${token ? "Found (length " + token.length + ")" : "Not found"}`);

switch (action) {
  case "proxy": {
    const path = body?.path || url.searchParams.get("path");

    if (!path) return createJsonResponse({ error: "Path is required for proxy" }, 400);
    if (!token) {
      console.warn("[github-api] Proxy failed: Token not found in database for user", user.id);
      return createJsonResponse({ error: "GitHub not connected", code: "GITHUB_NOT_CONNECTED" }, 401);
    }
```

**Issue:** The token validation only happens inside the `proxy` case. Other actions like `repos`, `events`, `contributions` don't validate the token before making GitHub API calls, leading to 401 errors when the token is missing or invalid.

**Solution:**
```typescript
const token = settings?.github_token;
console.log(`[github-api] Token status for user ${user.id}: ${token ? "Found (length " + token.length + ")" : "Not found"}`);

// Validate token for all GitHub API actions
const githubActions = ["proxy", "repos", "events", "contributions", "user"];
if (githubActions.includes(action) && !token) {
  console.warn(`[github-api] Action '${action}' failed: Token not found in database for user`, user.id);
  return createJsonResponse({
    error: "GitHub not connected. Please connect your GitHub account in Settings.",
    code: "GITHUB_NOT_CONNECTED"
  }, 401);
}

switch (action) {
  case "proxy": {
    const path = body?.path || url.searchParams.get("path");

    if (!path) return createJsonResponse({ error: "Path is required for proxy" }, 400);
```

---

#### 17. **supabase/functions/github-api/index.ts - No Token Expiry Check**
**File:** [`supabase/functions/github-api/index.ts`](supabase/functions/github-api/index.ts:184-195)
**Severity:** Medium
**Lines:** 184-195

**Bug:**
```typescript
const token = settings?.github_token;
console.log(`[github-api] Token status for user ${user.id}: ${token ? "Found (length " + token.length + ")" : "Not found"}`);
```

**Issue:** The code doesn't check if the GitHub token has expired or is invalid. It only checks if the token exists in the database. An expired or revoked token will cause 401 errors from GitHub API.

**Solution:**
```typescript
const token = settings?.github_token;
const tokenExpiry = settings?.token_expires_at;

console.log(`[github-api] Token status for user ${user.id}: ${token ? "Found (length " + token.length + ")" : "Not found"}`);

// Check if token has expired
if (token && tokenExpiry) {
  const expiryDate = new Date(tokenExpiry);
  if (expiryDate < new Date()) {
    console.warn(`[github-api] Token expired for user ${user.id}`);
    return createJsonResponse({
      error: "GitHub token has expired. Please reconnect your GitHub account.",
      code: "GITHUB_TOKEN_EXPIRED"
    }, 401);
  }
}

// Validate token for all GitHub API actions
const githubActions = ["proxy", "repos", "events", "contributions", "user"];
if (githubActions.includes(action) && !token) {
  console.warn(`[github-api] Action '${action}' failed: Token not found in database for user`, user.id);
  return createJsonResponse({
    error: "GitHub not connected. Please connect your GitHub account in Settings.",
    code: "GITHUB_NOT_CONNECTED"
  }, 401);
}
```

---

#### 18. **supabase/functions/_shared/auth.ts - Insufficient Error Details**
**File:** [`supabase/functions/_shared/auth.ts`](supabase/functions/_shared/auth.ts:40-60)
**Severity:** Low
**Lines:** 40-60

**Bug:**
```typescript
try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
        console.error(`[Auth] User verification failed for token beginning with ${authHeader.substring(0, 15)}...`);
        console.error(`[Auth] Error details:`, error);

        return {
            user: null,
            response: new Response(
                JSON.stringify({
                    error: "Unauthorized",
```

**Issue:** The error response doesn't include specific error codes that would help the frontend distinguish between different types of authentication failures (expired token, invalid token, missing token, etc.).

**Solution:**
```typescript
try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
        console.error(`[Auth] User verification failed for token beginning with ${authHeader.substring(0, 15)}...`);
        console.error(`[Auth] Error details:`, error);

        // Determine specific error type
        let errorCode = "AUTH_FAILED";
        let errorMessage = "Unauthorized";

        if (error) {
            if (error.message.includes("JWT expired")) {
                errorCode = "TOKEN_EXPIRED";
                errorMessage = "Your session has expired. Please sign in again.";
            } else if (error.message.includes("Invalid JWT")) {
                errorCode = "INVALID_TOKEN";
                errorMessage = "Invalid authentication token.";
            } else if (error.message.includes("User not found")) {
                errorCode = "USER_NOT_FOUND";
                errorMessage = "User not found.";
            }
        }

        return {
            user: null,
            response: new Response(
                JSON.stringify({
                    error: errorMessage,
                    code: errorCode,
                    details: error?.message
                }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
        };
    }
```

---

## Runtime Bugs (From Console Logs)

#### 19. **WebSocket Connection Failure**
**File:** Unknown (likely browser extension or external script)
**Severity:** Medium
**Lines:** refresh.js:27

**Bug:**
```
WebSocket connection to 'ws://localhost:8081/' failed
```

**Issue:** A WebSocket connection to `ws://localhost:8081/` is failing. This could be:
1. A development server that's not running
2. A browser extension trying to connect to a local service
3. A hot-reload or development tool that's not properly configured

**Solution:**
1. Check if any development server should be running on port 8081
2. If this is part of the application, ensure the WebSocket server is started
3. If this is from a browser extension, it can be safely ignored
4. Add proper error handling for WebSocket connection failures

---

#### 20. **Null Reference Error in background.js**
**File:** Unknown (likely browser extension)
**Severity:** Low
**Lines:** background.js:53

**Bug:**
```
Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
```

**Issue:** A browser extension's background script is trying to add an event listener to a null element. This is likely from a browser extension, not the main application.

**Solution:**
1. This is likely from a browser extension and can be safely ignored
2. If it's part of the application, add null checks before calling addEventListener:
```typescript
const element = document.getElementById('someElement');
if (element) {
    element.addEventListener('click', handler);
}
```

---

#### 21. **Undefined Property Access in page-events.js**
**File:** Unknown (likely browser extension)
**Severity:** Low
**Lines:** page-events.js:6

**Bug:**
```
Uncaught TypeError: Cannot read properties of undefined (reading 'length')
```

**Issue:** A script is trying to access the `length` property of an undefined value. This is likely from a browser extension.

**Solution:**
1. This is likely from a browser extension and can be safely ignored
2. If it's part of the application, add proper null/undefined checks:
```typescript
if (array && array.length > 0) {
    // Process array
}
```

---

#### 22. **Sentry Error Blocked by Client**
**File:** lucid.thereadme.com (external service)
**Severity:** Low
**Lines:** Multiple

**Bug:**
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
```

**Issue:** Sentry error tracking requests are being blocked by an ad blocker or browser extension. This is not a bug in the application code.

**Solution:**
1. This is expected behavior when users have ad blockers installed
2. Consider adding a fallback error tracking mechanism
3. Document that error tracking may not work with ad blockers enabled

---

## Summary of Fixed Bugs

The following bugs from the previous report have been **FIXED**:

1. ✅ **useSync.ts** - Unused parameter warning removed
2. ✅ **usePages.ts** - Race condition in getPagePath fixed with visitedIds
3. ✅ **usePages.ts** - Missing error handling in getPagePath added
4. ✅ **useTasks.ts** - Inconsistent error handling improved
5. ✅ **event-bus.service.ts** - Memory leak in event history fixed with sanitization
6. ✅ **event-bus.service.ts** - No error handling in emit fixed
7. ✅ **github/git.service.ts** - Base64 encoding issue fixed with TextEncoder
8. ✅ **search/quickFind.ts** - Potential infinite loop fixed with visited Set
9. ✅ **vector.service.ts** - Division by zero risk fixed
10. ✅ **EditorWorkspace.tsx** - Missing error handling in handleFileSelect added
11. ✅ **CodespaceTerminal.tsx** - Memory leak fixed with extracted connection logic
12. ✅ **GlobalCodespaceTerminal.tsx** - Missing error handling added
13. ✅ **SlashCommandMenu.tsx** - Position calculation issue fixed
14. ✅ **SharePopover.tsx** - Clipboard API error handling added
15. ✅ **AppSidebar.tsx** - localStorage JSON.parse error handling added
16. ✅ **supabase/functions/codespace-shell/index.ts** - Rate limiting added
17. ✅ **supabase/functions/codespace-shell/index.ts** - Input sanitization added

---

## Summary of Remaining Bugs

| Category | Bug Count | High Severity | Medium Severity | Low Severity |
|----------|-----------|---------------|-----------------|--------------|
| Frontend Hooks | 3 | 1 | 1 | 1 |
| Frontend Services | 2 | 0 | 2 | 0 |
| Frontend Components | 4 | 0 | 2 | 2 |
| Backend API Routes | 4 | 3 | 1 | 0 |
| Backend Middleware | 1 | 0 | 1 | 0 |
| Supabase Functions | 1 | 0 | 1 | 0 |
| **Total** | **15** | **4** | **8** | **3** |

### Priority Recommendations

1. **Immediate (High Severity):** Fix bugs #1, #10, #11, #12
2. **Short-term (Medium Severity):** Fix bugs #3, #4, #5, #6, #7, #9, #13, #14, #15
3. **Long-term (Low Severity & Optimizations):** Fix bugs #2, #8

---

## Optimization Recommendations

### 1. Frontend Performance

#### a. Implement React.memo for Expensive Components
Many components re-render unnecessarily. Use `React.memo` to prevent re-renders when props haven't changed.

**Example:**
```typescript
export const TabItem = React.memo(function TabItem({
    tab,
    isActive,
    onClick,
    onClose,
    onSave,
    onCloseOthers,
    onCloseAll,
}: TabItemProps) {
    // ... component code
});
```

#### b. Use useCallback and useMemo More Consistently
Many event handlers and computed values are not memoized, causing unnecessary re-renders.

#### c. Implement Virtual Scrolling for Large Lists
Components like `PageTree`, `FileTree`, and command palette results should use virtual scrolling for better performance with large datasets.

#### d. Lazy Load Routes
Use React.lazy() and Suspense to code-split routes and reduce initial bundle size.

**Example:**
```typescript
const Notes = lazy(() => import('@/pages/Notes'));
const Tasks = lazy(() => import('@/pages/Tasks'));
```

#### e. Optimize Image Loading
Implement lazy loading for images and use appropriate formats (WebP, AVIF).

### 2. Backend Performance

#### a. Implement Database Query Optimization
- Add proper indexes to frequently queried columns
- Use query batching where possible
- Implement connection pooling

#### b. Add Response Caching
Implement caching for frequently accessed data like user profiles, repository info, etc.

#### c. Use Compression
Enable gzip/brotli compression for API responses.

#### d. Implement Request Rate Limiting
Add rate limiting to prevent abuse and ensure fair resource allocation.

### 3. Code Quality

#### a. Add Comprehensive Error Boundaries
Implement error boundaries to catch and handle React component errors gracefully.

#### b. Improve Type Safety
- Remove `@typescript-eslint/no-explicit-any` suppressions
- Use proper TypeScript types instead of `any`
- Add strict null checks

#### c. Add Unit and Integration Tests
Implement comprehensive test coverage for critical paths.

#### d. Add Logging and Monitoring
Implement structured logging and monitoring for production debugging.

### 4. Security

#### a. Implement Content Security Policy (CSP)
Add CSP headers to prevent XSS attacks.

#### b. Sanitize User Input
Implement proper input sanitization for all user-provided data.

#### c. Implement CSRF Protection
Add CSRF tokens for state-changing operations.

#### d. Secure WebSocket Connections
Implement proper authentication and rate limiting for WebSocket connections.

### 5. Database

#### a. Add Foreign Key Constraints
Ensure referential integrity with proper foreign key constraints.

#### b. Implement Data Validation
Add database-level validation for critical fields.

#### c. Add Database Triggers
Use triggers for automatic timestamp updates and data consistency.

---

*Report generated on: 2026-02-11*
*CodeWeft Bug Analysis System - Updated*
