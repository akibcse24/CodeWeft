// GitHub API Types and Interfaces

export interface GitHubRepository {
    id: number;
    name: string;
    full_name: string;
    owner: {
        login: string;
        avatar_url: string;
    };
    description: string | null;
    html_url: string;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    open_issues_count: number;
    default_branch: string;
    pushed_at: string;
    created_at: string;
    updated_at: string;
    private: boolean;
}

export interface GitHubBranch {
    name: string;
    commit: {
        sha: string;
        url: string;
        commit: {
            message: string;
            author: {
                name: string;
                date: string;
            };
        };
    };
    protected: boolean;
}

export interface GitHubCommit {
    sha: string;
    commit: {
        message: string;
        author: {
            name?: string;
            email?: string;
            date?: string;
        };
    };
    author: {
        login: string;
        avatar_url: string;
    } | null;
    html_url: string;
    parents: Array<{
        sha: string;
    }>;
}

export interface GitHubFileContent {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string | null;
    type: 'file' | 'dir';
    content?: string; // Base64 encoded
    encoding?: string;
}

export interface GitHubTree {
    sha: string;
    url?: string;
    tree: Array<{
        path: string;
        mode: string;
        type: 'blob' | 'tree' | string;
        sha: string;
        size?: number;
        url?: string;
    }>;
    truncated: boolean;
}

export interface GitHubWorkflow {
    id: number;
    name: string;
    path: string;
    state: 'active' | 'deleted' | 'disabled_fork' | 'disabled_inactivity' | 'disabled_manually';
    created_at: string;
    updated_at: string;
    url: string;
    html_url: string;
    badge_url: string;
}

export interface GitHubWorkflowRun {
    id: number;
    name: string;
    run_number: number;
    head_branch: string;
    head_sha: string;
    status: 'queued' | 'in_progress' | 'completed';
    conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
    workflow_id: number;
    url: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    run_started_at: string;
    event: string;
    actor: {
        login: string;
        avatar_url: string;
    };
}

export interface GitHubGist {
    id: string;
    url: string;
    html_url: string;
    description: string | null;
    public: boolean;
    owner: {
        login: string;
        avatar_url: string;
    };
    files: Record<string, {
        filename: string;
        type: string;
        language: string | null;
        raw_url: string;
        size: number;
        content?: string;
    }>;
    created_at: string;
    updated_at: string;
    comments: number;
}

export interface GitHubCodespace {
    id: number;
    name: string;
    display_name: string;
    environment_id: string;
    owner: {
        login: string;
        avatar_url: string;
    };
    billable_owner: {
        login: string;
    };
    repository: {
        id: number;
        full_name: string;
    };
    machine: {
        name: string;
        display_name: string;
        operating_system: string;
        storage_in_bytes: number;
        memory_in_bytes: number;
        cpus: number;
    };
    state: 'Unknown' | 'Created' | 'Queued' | 'Provisioning' | 'Available' | 'Awaiting' | 'Unavailable' | 'Deleted' | 'Moved' | 'Shutdown' | 'Archived' | 'Starting' | 'ShuttingDown' | 'Failed' | 'Exporting' | 'Updating' | 'Rebuilding';
    url: string;
    web_url: string;
    created_at: string;
    updated_at: string;
    last_used_at: string;
    idle_timeout_minutes: number;
    retention_period_minutes: number;
}

export interface RateLimitStatus {
    limit: number;
    remaining: number;
    reset: number; // Unix timestamp
    used: number;
}

export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
}

export interface FileDiff {
    filename: string;
    status: 'added' | 'removed' | 'modified' | 'renamed';
    additions: number;
    deletions: number;
    changes: number;
  patch?: string;
  hunks?: DiffHunk[];
}

// Alias for backward compatibility
export type Repository = GitHubRepository;

// Tree node for file explorer
export interface TreeNode {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | string;
  sha: string;
  size?: number;
  url?: string;
  name?: string;
  children?: TreeNode[];
}

// Backup record types
export interface BackupRecord {
  id: string;
  user_id: string;
  repository_full_name: string;
  branch: string;
  backup_type: 'full' | 'incremental';
  storage_location: 's3' | 'gdrive' | 'local';
  storage_path: string;
  sizeBytes: number;
  fileCount: number;
  encrypted: boolean;
  compression: 'zip' | 'tar.gz';
  createdAt: string;
  metadata?: {
    commit_sha?: string;
    tags?: string[];
    description?: string;
  };
}
