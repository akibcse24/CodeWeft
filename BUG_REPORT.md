# CodeWeft - Comprehensive Bug Report & Solutions

## Executive Summary

This report documents all identified bugs in the CodeWeft codebase across both frontend (React/TypeScript) and backend (Express/Supabase) components. Each bug includes severity rating, root cause analysis, and recommended solutions.

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

#### 1. **useSync.ts - Unused Parameter Warning**
**File:** [`src/hooks/useSync.ts`](src/hooks/useSync.ts:35)
**Severity:** Low
**Line:** 35

**Bug:**
```typescript
export function useSync(enableBackgroundSync = true) {
    // Note: enableBackgroundSync is now ignored as it's handled by SyncProvider
    const context = useSyncContext();
    return context;
}
```

**Issue:** The `enableBackgroundSync` parameter is declared but never used, causing a linter warning and potential confusion for developers.

**Solution:**
```typescript
export function useSync() {
    const context = useSyncContext();
    return context;
}
```

---

#### 2. **usePages.ts - Race Condition in getPagePath**
**File:** [`src/hooks/usePages.ts`](src/hooks/usePages.ts:57-81)
**Severity:** Medium
**Lines:** 57-81

**Bug:**
```typescript
const getPagePath = async (pageId: string): Promise<Page[]> => {
    const path: Page[] = [];
    let currentId: string | null = pageId;

    while (currentId) {
        // Check local first
        let page = await db.pages.get(currentId);

        if (!page) {
            const { data, error } = await supabase
                .from("pages")
                .select("*")
                .eq("id", currentId)
                .single();
            if (error || !data) break;
            page = data as Page;
            await db.pages.put(page);
        }

        path.unshift(page);
        currentId = page.parent_id;
    }

    return path;
};
```

**Issue:** No error handling for the `db.pages.put()` operation. If the local database write fails, the page won't be cached for future requests. Also, no protection against infinite loops if there's a circular reference in parent_id.

**Solution:**
```typescript
const getPagePath = async (pageId: string): Promise<Page[]> => {
    const path: Page[] = [];
    const visitedIds = new Set<string>();
    let currentId: string | null = pageId;

    while (currentId && !visitedIds.has(currentId)) {
        visitedIds.add(currentId);

        // Check local first
        let page = await db.pages.get(currentId);

        if (!page) {
            const { data, error } = await supabase
                .from("pages")
                .select("*")
                .eq("id", currentId)
                .single();
            if (error || !data) break;
            page = data as Page;

            // Cache the page locally with error handling
            try {
                await db.pages.put(page);
            } catch (cacheError) {
                console.warn("Failed to cache page locally:", cacheError);
            }
        }

        path.unshift(page);
        currentId = page.parent_id;
    }

    return path;
};
```

---

#### 3. **usePages.ts - Missing Error Handling in searchPages**
**File:** [`src/hooks/usePages.ts`](src/hooks/usePages.ts:256-275)
**Severity:** Medium
**Lines:** 256-275

**Bug:**
```typescript
const searchPages = async (query: string) => {
    if (!query) return [];
    // Local search first
    const localResults = await db.pages
        .filter(p => p.title.toLowerCase().includes(query.toLowerCase()) && !p.is_archived)
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
};
```

**Issue:** No error handling for the Supabase query. If the query fails, the function returns an empty array without notifying the user. Also, no check for `user` before making the cloud query.

**Solution:**
```typescript
const searchPages = async (query: string) => {
    if (!query) return [];
    if (!user) return [];

    try {
        // Local search first
        const localResults = await db.pages
            .filter(p => p.title.toLowerCase().includes(query.toLowerCase()) && !p.is_archived)
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
};
```

---

#### 4. **useTasks.ts - Inconsistent Error Handling**
**File:** [`src/hooks/useTasks.ts`](src/hooks/useTasks.ts:92-106)
**Severity:** Medium
**Lines:** 92-106

**Bug:**
```typescript
// 3. Attempt Background Cloud Sync
try {
    const { error } = await supabase
        .from("tasks")
        .insert(newTask);

    if (!error) {
        // Success, cleanup queue entry
        // Use a find and delete approach since we don't have the sync_queue ID directly here
        const items = await db.sync_queue.where({ table: 'tasks' }).toArray();
        const target = items.find(i => i.data.id === newTask.id);
        if (target) await db.sync_queue.delete(target.id!);
    }
} catch (e) {
    console.warn("Background sync failed, will retry later.");
}
```

**Issue:** The sync queue cleanup is only performed if there's no error from Supabase, but the error is not logged. If the insert fails, the item remains in the sync queue indefinitely. Also, the `target.id!` assertion could fail if `target.id` is undefined.

**Solution:**
```typescript
// 3. Attempt Background Cloud Sync
try {
    const { error } = await supabase
        .from("tasks")
        .insert(newTask);

    if (error) {
        console.error("Background sync failed:", error);
        // Item remains in sync_queue for retry
    } else {
        // Success, cleanup queue entry
        const items = await db.sync_queue.where({ table: 'tasks' }).toArray();
        const target = items.find(i => i.data.id === newTask.id);
        if (target && target.id) {
            await db.sync_queue.delete(target.id);
        }
    }
} catch (e) {
    console.error("Background sync exception:", e);
}
```

---

#### 5. **useAuth.tsx - Race Condition in signOut**
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

    // ... rest of cleanup

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

### Services

#### 6. **event-bus.service.ts - Memory Leak in Event History**
**File:** [`src/services/event-bus.service.ts`](src/services/event-bus.service.ts:102-108)
**Severity:** Medium
**Lines:** 102-108

**Bug:**
```typescript
private addToHistory(event: Event): void {
    this.eventHistory.push(event);

    if (this.eventHistory.length > this.maxHistorySize) {
        this.eventHistory.shift();
    }
}
```

**Issue:** The event history stores full event objects with potentially large `data` payloads. This can cause memory issues in long-running sessions. The `shift()` operation is O(n) and can cause performance issues with large arrays.

**Solution:**
```typescript
private addToHistory(event: Event): void {
    // Store a lightweight version of the event
    const lightweightEvent: Event = {
        id: event.id,
        type: event.type,
        timestamp: event.timestamp,
        source: event.source,
        userId: event.userId,
        data: this.sanitizeEventData(event.data) // Truncate large data
    };

    this.eventHistory.push(lightweightEvent);

    if (this.eventHistory.length > this.maxHistorySize) {
        this.eventHistory.shift();
    }
}

private sanitizeEventData(data: any): any {
    if (!data) return data;

    // Convert to string and truncate if too large
    const dataStr = JSON.stringify(data);
    if (dataStr.length > 1000) {
        return { _truncated: true, _length: dataStr.length };
    }
    return data;
}
```

---

#### 7. **event-bus.service.ts - No Error Handling in emit**
**File:** [`src/services/event-bus.service.ts`](src/services/event-bus.service.ts:72-100)
**Severity:** Medium
**Lines:** 72-100

**Bug:**
```typescript
async emit(event: Omit<Event, "id" | "timestamp">): Promise<void> {
    const fullEvent: Event = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...event
    };

    if (this.eventLogEnabled) {
        this.addToHistory(fullEvent);
    }

    memoryService.storeShortTerm({
        type: "event",
        content: { type: fullEvent.type, data: fullEvent.data }
    });

    const handlers = this.handlers.get(fullEvent.type) || [];
    const promises: Promise<void>[] = [];

    for (const handler of handlers) {
        promises.push(Promise.resolve(handler(fullEvent)));
    }

    for (const handler of this.wildcardHandlers) {
        promises.push(Promise.resolve(handler(fullEvent)));
    }

    await Promise.allSettled(promises);
}
```

**Issue:** If `memoryService.storeShortTerm()` throws an error, the event emission will fail. Also, there's no way to track which handlers failed or succeeded.

**Solution:**
```typescript
async emit(event: Omit<Event, "id" | "timestamp">): Promise<void> {
    const fullEvent: Event = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        ...event
    };

    if (this.eventLogEnabled) {
        this.addToHistory(fullEvent);
    }

    // Store in memory service with error handling
    try {
        memoryService.storeShortTerm({
            type: "event",
            content: { type: fullEvent.type, data: fullEvent.data }
        });
    } catch (error) {
        console.warn("[EventBus] Failed to store event in memory service:", error);
    }

    const handlers = this.handlers.get(fullEvent.type) || [];
    const promises: Promise<{ handler: string; success: boolean; error?: Error }>[] = [];

    for (const handler of handlers) {
        promises.push(
            Promise.resolve(handler(fullEvent))
                .then(() => ({ handler: handler.name || 'anonymous', success: true }))
                .catch((error) => ({ handler: handler.name || 'anonymous', success: false, error }))
        );
    }

    for (const handler of this.wildcardHandlers) {
        promises.push(
            Promise.resolve(handler(fullEvent))
                .then(() => ({ handler: 'wildcard', success: true }))
                .catch((error) => ({ handler: 'wildcard', success: false, error }))
        );
    }

    const results = await Promise.allSettled(promises);

    // Log failed handlers
    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(`[EventBus] Handler failed for event ${fullEvent.type}:`, result.reason);
        }
    });
}
```

---

#### 8. **github/git.service.ts - Base64 Encoding Issue**
**File:** [`src/services/github/git.service.ts`](src/services/github/git.service.ts:223)
**Severity:** High
**Lines:** 209-237

**Bug:**
```typescript
export async function updateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch = 'main',
    sha?: string
): Promise<unknown> {
    return withRetry(async () => {
        const octokit = await getOctokit();

        // Convert content to base64
        const contentBase64 = btoa(unescape(encodeURIComponent(content)));

        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message,
            content: contentBase64,
            branch,
            sha,
        });

        return data;
    });
}
```

**Issue:** The `btoa(unescape(encodeURIComponent(content)))` pattern is outdated and can cause issues with certain Unicode characters. Modern browsers support `btoa()` with Unicode strings directly when using `TextEncoder`.

**Solution:**
```typescript
export async function updateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch = 'main',
    sha?: string
): Promise<unknown> {
    return withRetry(async () => {
        const octokit = await getOctokit();

        // Convert content to base64 using modern approach
        const contentBase64 = btoa(String.fromCharCode(...new TextEncoder().encode(content)));

        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message,
            content: contentBase64,
            branch,
            sha,
        });

        return data;
    });
}
```

---

#### 9. **github/git.service.ts - Same Issue in createCommit**
**File:** [`src/services/github/git.service.ts`](src/services/github/git.service.ts:323)
**Severity:** High
**Line:** 323

**Bug:** Same base64 encoding issue as above in the `createCommit` function.

**Solution:** Apply the same fix using `TextEncoder`.

---

#### 10. **search/quickFind.ts - Potential Infinite Loop**
**File:** [`src/services/search/quickFind.ts`](src/services/search/quickFind.ts:93-144)
**Severity:** Medium
**Lines:** 93-144

**Bug:**
```typescript
private searchBlocks(
    blocks: Block[],
    page: Page,
    path: string[],
    query: string
): SearchMatch[] {
    const matches: SearchMatch[] = [];

    for (const block of blocks) {
        const currentPath = [...path, block.type];
        let relevance = 0;

        if (block.content && block.content.toLowerCase().includes(query)) {
            relevance += this.calculateRelevance(block, page, query);

            if (relevance > 0) {
                matches.push({
                    block,
                    page,
                    path: currentPath,
                    relevance,
                });
            }
        }

        if (block.children && block.children.length > 0) {
            const childMatches = this.searchBlocks(
                block.children,
                page,
                currentPath,
                query
            );
            matches.push(...childMatches);
        }

        if (block.columns && block.columns.length > 0) {
            for (const column of block.columns) {
                if (Array.isArray(column)) {
                    const columnMatches = this.searchBlocks(
                        column,
                        page,
                        [...currentPath, "column"],
                        query
                    );
                    matches.push(...columnMatches);
                }
            }
        }
    }

    return matches;
}
```

**Issue:** No protection against circular references in the block structure. If a block references itself or creates a cycle, this will cause a stack overflow.

**Solution:**
```typescript
private searchBlocks(
    blocks: Block[],
    page: Page,
    path: string[],
    query: string,
    visited = new Set<string>()
): SearchMatch[] {
    const matches: SearchMatch[] = [];

    for (const block of blocks) {
        // Prevent infinite loops from circular references
        if (visited.has(block.id)) {
            console.warn(`[QuickFind] Circular reference detected for block ${block.id}`);
            continue;
        }
        visited.add(block.id);

        const currentPath = [...path, block.type];
        let relevance = 0;

        if (block.content && block.content.toLowerCase().includes(query)) {
            relevance += this.calculateRelevance(block, page, query);

            if (relevance > 0) {
                matches.push({
                    block,
                    page,
                    path: currentPath,
                    relevance,
                });
            }
        }

        if (block.children && block.children.length > 0) {
            const childMatches = this.searchBlocks(
                block.children,
                page,
                currentPath,
                query,
                new Set(visited) // Create new set for each branch
            );
            matches.push(...childMatches);
        }

        if (block.columns && block.columns.length > 0) {
            for (const column of block.columns) {
                if (Array.isArray(column)) {
                    const columnMatches = this.searchBlocks(
                        column,
                        page,
                        [...currentPath, "column"],
                        query,
                        new Set(visited)
                    );
                    matches.push(...columnMatches);
                }
            }
        }
    }

    return matches;
}
```

---

#### 11. **vector.service.ts - Division by Zero Risk**
**File:** [`src/services/vector.service.ts`](src/services/vector.service.ts:45-56)
**Severity:** Medium
**Lines:** 45-56

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
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

**Issue:** If both vectors are zero vectors (all elements are 0), the result will be `0/0 = NaN`. This can cause issues in search results.

**Solution:**
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

    // Handle zero vectors
    if (magnitude === 0) {
        return 0;
    }

    return dotProduct / magnitude;
}
```

---

### Components

#### 12. **EditorWorkspace.tsx - Missing Error Handling**
**File:** [`src/components/github/editor/EditorWorkspace.tsx`](src/components/github/editor/EditorWorkspace.tsx:83-118)
**Severity:** Medium
**Lines:** 83-118

**Bug:**
```typescript
const handleFileSelect = useCallback(async (file: FileNode) => {
    if (file.type !== 'file' || !owner || !repo) return;

    // Check if already open
    const existingTab = tabs.find(t => t.path === file.path);
    if (existingTab) {
        setActiveTabId(existingTab.id);
        return;
    }

    try {
        // Fetch file content
        const fileContent = await getFileContent(owner, repo, file.path, branch);

        // Decode base64 content
        const content = fileContent.content
            ? atob(fileContent.content)
            : '';

        const newTab: EditorTab = {
            id: file.path,
            filename: file.name,
            path: file.path,
            content,
            language: getLanguageFromFilename(file.name),
            isDirty: false,
            isNew: false,
            sha: fileContent.sha,
        };

        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
    } catch (error) {
        toast.error(`Failed to open file: ${(error as Error).message}`);
    }
}, [tabs, owner, repo, branch]);
```

**Issue:** The `atob()` function can throw an error if the base64 string is malformed. Also, there's no validation that `fileContent.content` is actually a valid base64 string.

**Solution:**
```typescript
const handleFileSelect = useCallback(async (file: FileNode) => {
    if (file.type !== 'file' || !owner || !repo) return;

    // Check if already open
    const existingTab = tabs.find(t => t.path === file.path);
    if (existingTab) {
        setActiveTabId(existingTab.id);
        return;
    }

    try {
        // Fetch file content
        const fileContent = await getFileContent(owner, repo, file.path, branch);

        // Decode base64 content with error handling
        let content = '';
        if (fileContent.content) {
            try {
                content = atob(fileContent.content);
            } catch (decodeError) {
                console.error("Failed to decode base64 content:", decodeError);
                toast.error("Failed to decode file content");
                return;
            }
        }

        const newTab: EditorTab = {
            id: file.path,
            filename: file.name,
            path: file.path,
            content,
            language: getLanguageFromFilename(file.name),
            isDirty: false,
            isNew: false,
            sha: fileContent.sha,
        };

        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
    } catch (error) {
        console.error("Failed to open file:", error);
        toast.error(`Failed to open file: ${(error as Error).message}`);
    }
}, [tabs, owner, repo, branch, toast]);
```

---

#### 13. **CodespaceTerminal.tsx - Memory Leak in useEffect**
**File:** [`src/components/github/codespaces/CodespaceTerminal.tsx`](src/components/github/codespaces/CodespaceTerminal.tsx:340-361)
**Severity:** High
**Lines:** 340-361

**Bug:**
```typescript
useEffect(() => {
    connectAttemptRef.current = 0;
    if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
    }

    const timer = window.setTimeout(() => {
        connect();
    }, 250);

    return () => {
        window.clearTimeout(timer);
        if (reconnectTimerRef.current) {
            window.clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
        onDataDisposableRef.current?.dispose();
        onDataDisposableRef.current = null;
        wsRef.current?.close();
    };
}, [connect]);
```

**Issue:** The `connect` function is in the dependency array, but it's recreated on every render due to the `useCallback` dependencies. This causes the effect to run repeatedly, creating multiple WebSocket connections and event listeners.

**Solution:**
```typescript
useEffect(() => {
    connectAttemptRef.current = 0;
    if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
    }

    const timer = window.setTimeout(() => {
        connect();
    }, 250);

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
}, [codespaceName, githubToken]); // Only depend on the actual connection parameters
```

---

#### 14. **CodespaceTerminal.tsx - Duplicate WebSocket Handler Logic**
**File:** [`src/components/github/codespaces/CodespaceTerminal.tsx`](src/components/github/codespaces/CodespaceTerminal.tsx:402-490)
**Severity:** High
**Lines:** 402-490

**Bug:** The `handleRetry` function duplicates the entire WebSocket connection logic from the `connect` function. This is a code duplication issue that makes maintenance difficult and increases the risk of bugs.

**Solution:** Extract the WebSocket connection logic into a separate function:

```typescript
const establishWebSocketConnection = useCallback((
    terminal: Xterm,
    wsUrl: string,
    token: string,
    onConnected: () => void,
    onError: (message: string) => void
) => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
        terminal.writeln('\x1b[32m✓ Connected to proxy\x1b[0m');
        terminal.writeln('\x1b[90mAuthenticating with GitHub...\x1b[0m');
        ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'auth_success':
                    terminal.writeln('\x1b[32m✓ Authenticated\x1b[0m');
                    terminal.writeln('\x1b[90mEstablishing session...\x1b[0m');
                    break;
                case 'connected':
                    terminal.writeln('\x1b[32m✓ Session established\x1b[0m');
                    terminal.writeln('');
                    onConnected();
                    break;
                case 'output':
                    terminal.write(data.data);
                    break;
                case 'error':
                    terminal.writeln(`\x1b[31mError: ${data.message}\x1b[0m`);
                    onError(data.message);
                    break;
                case 'disconnected':
                    terminal.writeln('\x1b[33mDisconnected from codespace\x1b[0m');
                    updateStatus('disconnected');
                    break;
            }
        } catch {
            terminal.write(event.data);
        }
    };

    ws.onerror = () => {
        terminal.writeln('\r\n\x1b[31m✗ WebSocket connection error\x1b[0m');
        onError('WebSocket connection failed');
    };

    ws.onclose = () => {
        updateStatus('disconnected');
        wsRef.current = null;
    };

    onDataDisposableRef.current = terminal.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'input', data }));
        }
    });
}, [updateStatus]);

// Then use this function in both connect() and handleRetry()
```

---

#### 15. **GlobalCodespaceTerminal.tsx - Missing Error Handling**
**File:** [`src/components/github/codespaces/GlobalCodespaceTerminal.tsx`](src/components/github/codespaces/GlobalCodespaceTerminal.tsx:16-31)
**Severity:** Medium
**Lines:** 16-31

**Bug:**
```typescript
useEffect(() => {
    async function fetchToken() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('github_settings')
                .select('github_token')
                .eq('user_id', user.id)
                .maybeSingle();
            if (data?.github_token) {
                setGithubToken(data.github_token);
            }
        }
    }
    fetchToken();
}, []);
```

**Issue:** No error handling for the Supabase queries. If the queries fail, the component silently fails without notifying the user.

**Solution:**
```typescript
useEffect(() => {
    async function fetchToken() {
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) {
                console.error("Failed to get user:", userError);
                return;
            }

            if (user) {
                const { data, error } = await supabase
                    .from('github_settings')
                    .select('github_token')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) {
                    console.error("Failed to fetch GitHub token:", error);
                    return;
                }

                if (data?.github_token) {
                    setGithubToken(data.github_token);
                }
            }
        } catch (error) {
            console.error("Error fetching token:", error);
        }
    }
    fetchToken();
}, []);
```

---

#### 16. **SlashCommandMenu.tsx - Position Calculation Issue**
**File:** [`src/components/editor/SlashCommandMenu.tsx`](src/components/editor/SlashCommandMenu.tsx:119-123)
**Severity:** Medium
**Lines:** 119-123

**Bug:**
```typescript
style={{
    left: Math.min(position?.x || 0, window.innerWidth - 300),
    top: Math.min(position?.y || 0, window.innerHeight - 400),
}}
```

**Issue:** The position calculation doesn't account for the menu's actual height and width. If the menu is near the bottom or right edge of the screen, it may still be partially clipped. Also, no handling for negative positions.

**Solution:**
```typescript
const MENU_WIDTH = 288; // w-72 = 18rem = 288px
const MENU_MAX_HEIGHT = 320; // max-h-[320px]

const calculatePosition = (x: number, y: number) => {
    const adjustedX = Math.max(10, Math.min(x, window.innerWidth - MENU_WIDTH - 10));
    const adjustedY = Math.max(10, Math.min(y, window.innerHeight - MENU_MAX_HEIGHT - 10));
    return { x: adjustedX, y: adjustedY };
};

// In the component:
const menuPosition = position ? calculatePosition(position.x, position.y) : { x: 0, y: 0 };

// Then use:
style={{
    left: menuPosition.x,
    top: menuPosition.y,
}}
```

---

#### 17. **SharePopover.tsx - Clipboard API Error Handling**
**File:** [`src/components/notes/SharePopover.tsx`](src/components/notes/SharePopover.tsx:56-63)
**Severity:** Medium
**Lines:** 56-63

**Bug:**
```typescript
const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
        description: "Link copied to clipboard",
    });
};
```

**Issue:** The Clipboard API can throw errors if the page is not in a secure context (HTTPS) or if the user has denied permission. No error handling is provided.

**Solution:**
```typescript
const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            description: "Link copied to clipboard",
        });
    } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        // Fallback for older browsers or non-secure contexts
        try {
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast({
                description: "Link copied to clipboard",
            });
        } catch (fallbackError) {
            toast({
                variant: "destructive",
                description: "Failed to copy link to clipboard",
            });
        }
    }
};
```

---

#### 18. **AppSidebar.tsx - localStorage JSON.parse Error**
**File:** [`src/components/layout/AppSidebar.tsx`](src/components/layout/AppSidebar.tsx:75-78)
**Severity:** Medium
**Lines:** 75-78

**Bug:**
```typescript
const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem(`sidebar-section-${title}`);
    return saved ? JSON.parse(saved) : defaultOpen;
});
```

**Issue:** If the localStorage value is corrupted or not valid JSON, `JSON.parse()` will throw an error and crash the component.

**Solution:**
```typescript
const [isOpen, setIsOpen] = useState(() => {
    try {
        const saved = localStorage.getItem(`sidebar-section-${title}`);
        return saved ? JSON.parse(saved) : defaultOpen;
    } catch (error) {
        console.warn(`Failed to parse sidebar state for ${title}:`, error);
        return defaultOpen;
    }
});
```

---

## Backend Bugs

### API Routes

#### 19. **api/routes/pages.ts - Missing User ID Validation**
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

**Issue:** No validation that `req.userId` exists before using it. If the authentication middleware fails to set `userId`, the query will fail silently or return incorrect results.

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

        // Validate limit and offset
        const parsedLimit = Math.min(parseInt(limit as string, 10) || 20, 100); // Max 100
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

#### 20. **api/routes/pages.ts - No Input Validation**
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
            .single();

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
                .single();

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

#### 21. **api/routes/webhooks.ts - No URL Validation**
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

#### 22. **api/routes/webhooks.ts - No Timeout for Webhook Delivery**
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

#### 23. **api/middleware/auth.ts - No Token Expiry Refresh**
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

#### 24. **supabase/functions/codespace-shell/index.ts - No Rate Limiting**
**File:** [`supabase/functions/codespace-shell/index.ts`](supabase/functions/codespace-shell/index.ts:104-321)
**Severity:** High
**Lines:** 104-321

**Bug:** The WebSocket endpoint has no rate limiting or connection limits. A malicious user could open multiple connections and exhaust server resources.

**Solution:**
```typescript
// Add at the top of the file
const activeConnections = new Map<string, { socket: WebSocket; lastActivity: number }>();
const MAX_CONNECTIONS_PER_USER = 3;
const CONNECTION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Clean up inactive connections periodically
setInterval(() => {
    const now = Date.now();
    for (const [userId, connection] of activeConnections.entries()) {
        if (now - connection.lastActivity > CONNECTION_TIMEOUT) {
            console.log(`Closing inactive connection for user: ${userId}`);
            connection.socket.close();
            activeConnections.delete(userId);
        }
    }
}, 60 * 1000); // Check every minute

// In the WebSocket handler:
// @ts-expect-error: Deno namespace
Deno.serve(async (req: Request) => {
    // ... existing code ...

    // Upgrade to WebSocket
    // @ts-expect-error: Deno namespace
    const { socket, response } = Deno.upgradeWebSocket(req);

    let authenticated = false;
    let githubToken: string | null = null;
    let username: string | null = null;
    let cmdBuffer = "";

    socket.onopen = () => {
        console.log(`WebSocket opened for codespace: ${codespaceName}`);
    };

    socket.onmessage = async (event: MessageEvent) => {
        try {
            const message: ClientMessage = JSON.parse(event.data);

            switch (message.type) {
                case "auth": {
                    const authResult = await verifyGitHubToken(message.token);

                    if (authResult.valid) {
                        // Check connection limits
                        const userId = authResult.username || 'unknown';
                        const existingConnection = activeConnections.get(userId);

                        if (existingConnection) {
                            existingConnection.lastActivity = Date.now();
                        } else {
                            // Count existing connections for this user
                            const userConnections = Array.from(activeConnections.entries())
                                .filter(([id]) => id === userId).length;

                            if (userConnections >= MAX_CONNECTIONS_PER_USER) {
                                socket.send(JSON.stringify({
                                    type: 'error',
                                    message: 'Maximum connection limit reached. Please close other connections.'
                                }));
                                socket.close();
                                return;
                            }

                            activeConnections.set(userId, {
                                socket,
                                lastActivity: Date.now()
                            });
                        }

                        authenticated = true;
                        githubToken = message.token;
                        username = authResult.username || null;

                        socket.send(JSON.stringify({
                            type: "auth_success",
                            username,
                        }));

                        // ... rest of auth logic
                    } else {
                        socket.send(JSON.stringify({
                            type: "error",
                            message: "Invalid GitHub token. Please update your token in Settings.",
                        }));
                    }
                    break;
                }

                case "input": {
                    // Update last activity
                    if (username) {
                        const connection = activeConnections.get(username);
                        if (connection) {
                            connection.lastActivity = Date.now();
                        }
                    }

                    // ... rest of input handling
                    break;
                }
            }
        } catch (error) {
            console.error("Error processing message:", error);
            socket.send(JSON.stringify({
                type: "error",
                message: "Failed to process message",
            }));
        }
    };

    socket.onclose = () => {
        console.log(`WebSocket closed for codespace: ${codespaceName}`);
        // Clean up connection tracking
        if (username) {
            activeConnections.delete(username);
        }
    };

    return response;
});
```

---

#### 25. **supabase/functions/codespace-shell/index.ts - No Input Sanitization**
**File:** [`supabase/functions/codespace-shell/index.ts`](supabase/functions/codespace-shell/index.ts:245-294)
**Severity:** Medium
**Lines:** 245-294

**Bug:**
```typescript
case "input": {
    if (!authenticated) {
        socket.send(JSON.stringify({
            type: "error",
            message: "Not authenticated",
        }));
        return;
    }

    const input = message.data;

    if (input === "\r" || input === "\n") {
        const cmd = cmdBuffer.trim();
        cmdBuffer = "";
        socket.send(JSON.stringify({ type: "output", data: "\r\n" }));

        if (cmd === "ls") {
            socket.send(JSON.stringify({
                type: "output",
                data: "\x1b[1;34m.\x1b[0m  \x1b[1;34m..\x1b[0m  \x1b[1;34m.git\x1b[0m  \x1b[1;34msrc\x1b[0m  \x1b[1;34mpublic\x1b[0m  package.json  README.md\r\n",
            }));
        } else if (cmd === "pwd") {
            socket.send(JSON.stringify({ type: "output", data: `/workspaces/${codespaceName}\r\n` }));
        } else if (cmd === "whoami") {
            socket.send(JSON.stringify({ type: "output", data: `${username || "codespace"}\r\n` }));
        } else if (cmd === "uname -a") {
            socket.send(JSON.stringify({ type: "output", data: "Linux codespace 6.1.0-13-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.55-1 x86_64 GNU/Linux\r\n" }));
        } else if (cmd === "git status") {
            socket.send(JSON.stringify({
                type: "output",
                data: "On branch main\r\nYour branch is up to date with 'origin/main'.\r\n\r\nnothing to commit, working tree clean\r\n",
            }));
        } else if (cmd === "clear") {
            socket.send(JSON.stringify({ type: "output", data: "\x1bc" }));
        } else if (cmd === "help") {
            socket.send(JSON.stringify({
                type: "output",
                data: "\r\n\x1b[1;36mAvailable commands:\x1b[0m\r\n  ls, pwd, whoami, uname -a, git status, clear, help\r\n\r\nThis is a proxy shell that mimics a real terminal experience.\r\n",
            }));
        } else if (cmd !== "") {
            socket.send(JSON.stringify({
                type: "output",
                data: `\x1b[31mCommand not found: ${cmd}\x1b[0m\r\nTip: Use 'help' to see available proxy commands.\r\n`,
            }));
        }

        socket.send(JSON.stringify({ type: "output", data: "\x1b[1;32m$\x1b[0m " }));

    } else if (input === "\x7f" || input === "\x08") { // Backspace
        if (cmdBuffer.length > 0) {
            cmdBuffer = cmdBuffer.slice(0, -1);
            socket.send(JSON.stringify({ type: "output", data: "\b \b" }));
        }
    } else if (input === "\x03") { // Ctrl+C
        cmdBuffer = "";
        socket.send(JSON.stringify({ type: "output", data: "^C\r\n\x1b[1;32m$\x1b[0m " }));
    } else {
        cmdBuffer += input;
        socket.send(JSON.stringify({ type: "output", data: input }));
    }
    break;
}
```

**Issue:** The `cmdBuffer` can grow indefinitely if the user keeps typing without pressing enter. This could lead to memory exhaustion. Also, no sanitization of the command before echoing it back, which could lead to terminal injection attacks.

**Solution:**
```typescript
case "input": {
    if (!authenticated) {
        socket.send(JSON.stringify({
            type: "error",
            message: "Not authenticated",
        }));
        return;
    }

    const input = message.data;

    // Limit command buffer size to prevent memory exhaustion
    const MAX_CMD_BUFFER_SIZE = 10000;

    if (input === "\r" || input === "\n") {
        const cmd = cmdBuffer.trim();
        cmdBuffer = "";
        socket.send(JSON.stringify({ type: "output", data: "\r\n" }));

        // Sanitize command for display
        const sanitizedCmd = cmd.replace(/[\x00-\x1F\x7F]/g, '');

        if (cmd === "ls") {
            socket.send(JSON.stringify({
                type: "output",
                data: "\x1b[1;34m.\x1b[0m  \x1b[1;34m..\x1b[0m  \x1b[1;34m.git\x1b[0m  \x1b[1;34msrc\x1b[0m  \x1b[1;34mpublic\x1b[0m  package.json  README.md\r\n",
            }));
        } else if (cmd === "pwd") {
            socket.send(JSON.stringify({ type: "output", data: `/workspaces/${codespaceName}\r\n` }));
        } else if (cmd === "whoami") {
            socket.send(JSON.stringify({ type: "output", data: `${username || "codespace"}\r\n` }));
        } else if (cmd === "uname -a") {
            socket.send(JSON.stringify({ type: "output", data: "Linux codespace 6.1.0-13-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.55-1 x86_64 GNU/Linux\r\n" }));
        } else if (cmd === "git status") {
            socket.send(JSON.stringify({
                type: "output",
                data: "On branch main\r\nYour branch is up to date with 'origin/main'.\r\n\r\nnothing to commit, working tree clean\r\n",
            }));
        } else if (cmd === "clear") {
            socket.send(JSON.stringify({ type: "output", data: "\x1bc" }));
        } else if (cmd === "help") {
            socket.send(JSON.stringify({
                type: "output",
                data: "\r\n\x1b[1;36mAvailable commands:\x1b[0m\r\n  ls, pwd, whoami, uname -a, git status, clear, help\r\n\r\nThis is a proxy shell that mimics a real terminal experience.\r\n",
            }));
        } else if (sanitizedCmd !== "") {
            socket.send(JSON.stringify({
                type: "output",
                data: `\x1b[31mCommand not found: ${sanitizedCmd}\x1b[0m\r\nTip: Use 'help' to see available proxy commands.\r\n`,
            }));
        }

        socket.send(JSON.stringify({ type: "output", data: "\x1b[1;32m$\x1b[0m " }));

    } else if (input === "\x7f" || input === "\x08") { // Backspace
        if (cmdBuffer.length > 0) {
            cmdBuffer = cmdBuffer.slice(0, -1);
            socket.send(JSON.stringify({ type: "output", data: "\b \b" }));
        }
    } else if (input === "\x03") { // Ctrl+C
        cmdBuffer = "";
        socket.send(JSON.stringify({ type: "output", data: "^C\r\n\x1b[1;32m$\x1b[0m " }));
    } else {
        // Only add printable characters
        if (input.length === 1 && input >= ' ' && input <= '~') {
            if (cmdBuffer.length < MAX_CMD_BUFFER_SIZE) {
                cmdBuffer += input;
                socket.send(JSON.stringify({ type: "output", data: input }));
            } else {
                // Buffer full, ignore input
                socket.send(JSON.stringify({ type: "output", data: "\x07" })); // Bell character
            }
        }
    }
    break;
}
```

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

## Summary

| Category | Bug Count | High Severity | Medium Severity | Low Severity |
|----------|-----------|---------------|-----------------|--------------|
| Frontend Hooks | 5 | 1 | 3 | 1 |
| Frontend Services | 6 | 2 | 4 | 0 |
| Frontend Components | 7 | 2 | 4 | 1 |
| Backend API Routes | 4 | 3 | 1 | 0 |
| Backend Middleware | 1 | 0 | 1 | 0 |
| Supabase Functions | 2 | 1 | 1 | 0 |
| **Total** | **25** | **9** | **14** | **2** |

### Priority Recommendations

1. **Immediate (High Severity):** Fix bugs #5, #8, #9, #13, #14, #19, #20, #21, #24
2. **Short-term (Medium Severity):** Fix bugs #2, #3, #4, #6, #7, #10, #11, #12, #15, #16, #17, #18, #22, #23, #25
3. **Long-term (Low Severity & Optimizations):** Implement all optimization recommendations

---

*Report generated on: 2026-02-11*
*CodeWeft Bug Analysis System*
