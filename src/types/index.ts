import { z } from "zod";

// User and Auth Types
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  user_metadata: z.record(z.unknown()).optional(),
});

export type User = z.infer<typeof UserSchema>;

// Page/Note Types
export const BlockSchema = z.object({
  id: z.string(),
  type: z.enum([
    "text",
    "heading",
    "list",
    "checklist",
    "code",
    "quote",
    "image",
    "video",
    "file",
    "bookmark",
    "divider",
    "callout",
    "table",
    "diagram",
    "equation",
  ]),
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  order: z.number().optional(),
});

export type Block = z.infer<typeof BlockSchema>;

export const PageSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  content: z.union([z.array(BlockSchema), z.string()]),
  user_id: z.string().uuid(),
  is_favorite: z.boolean().default(false),
  is_public: z.boolean().default(false),
  parent_id: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  tags: z.array(z.string()).default([]),
  properties: z.record(z.unknown()).optional(),
});

export type Page = z.infer<typeof PageSchema>;

// Task Types
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  completed: z.boolean().default(false),
  due_date: z.string().datetime().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  user_id: z.string().uuid(),
  tags: z.array(z.string()).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Task = z.infer<typeof TaskSchema>;

// Course Types
export const CourseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  code: z.string().max(50).optional(),
  instructor: z.string().max(200).optional(),
  semester: z.string().max(50).optional(),
  progress: z.number().min(0).max(100).default(0),
  status: z.enum(["active", "completed", "dropped"]).default("active"),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Course = z.infer<typeof CourseSchema>;

// DSA Problem Types
export const DSAProblemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(300),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.string().max(100),
  platform: z.string().max(100),
  url: z.string().url().optional(),
  solved: z.boolean().default(false),
  notes: z.string().max(5000).optional(),
  solution_code: z.string().optional(),
  time_complexity: z.string().max(50).optional(),
  space_complexity: z.string().max(50).optional(),
  user_id: z.string().uuid(),
  tags: z.array(z.string()).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type DSAProblem = z.infer<typeof DSAProblemSchema>;

// Resource Types
export const ResourceSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(300),
  url: z.string().url(),
  description: z.string().max(1000).optional(),
  category: z.string().max(100),
  user_id: z.string().uuid(),
  tags: z.array(z.string()).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Resource = z.infer<typeof ResourceSchema>;

// Flashcard Types
export const FlashcardSchema = z.object({
  id: z.string().uuid(),
  front: z.string().min(1).max(1000),
  back: z.string().min(1).max(2000),
  deck_id: z.string().uuid(),
  difficulty: z.number().min(0).max(5).default(0),
  last_reviewed: z.string().datetime().nullable().optional(),
  next_review: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Flashcard = z.infer<typeof FlashcardSchema>;

// Project Types
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  status: z.enum(["planning", "in_progress", "completed", "on_hold"]).default("planning"),
  github_url: z.string().url().optional(),
  tech_stack: z.array(z.string()).default([]),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Project = z.infer<typeof ProjectSchema>;

// Habit Types
export const HabitSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  frequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  target_count: z.number().min(1).default(1),
  current_streak: z.number().min(0).default(0),
  best_streak: z.number().min(0).default(0),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Habit = z.infer<typeof HabitSchema>;

// Paper Types
export const PaperSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  authors: z.array(z.string()).default([]),
  venue: z.string().max(300).optional(),
  year: z.number().min(1800).max(new Date().getFullYear() + 1).optional(),
  doi: z.string().max(100).optional(),
  arxiv_id: z.string().max(50).optional(),
  abstract: z.string().max(10000).optional(),
  pdf_url: z.string().url().optional(),
  notes: z.string().max(10000).optional(),
  read_status: z.enum(["unread", "reading", "read"]).default("unread"),
  importance: z.enum(["low", "medium", "high"]).default("medium"),
  user_id: z.string().uuid(),
  tags: z.array(z.string()).default([]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Paper = z.infer<typeof PaperSchema>;

// GitHub Types
export const GitHubRepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  html_url: z.string().url(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  open_issues_count: z.number(),
  private: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  pushed_at: z.string().datetime().nullable(),
});

export type GitHubRepository = z.infer<typeof GitHubRepositorySchema>;

// API Response Types
export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    error: z.instanceof(Error).nullable(),
    loading: z.boolean(),
  });

export type ApiResponse<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
};

// Form Validation Schemas
export const CreatePageSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  content: z.union([z.array(BlockSchema), z.string()]).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).default([]),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(5000).optional(),
  due_date: z.string().datetime().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  tags: z.array(z.string()).default([]),
});

export const CreateCourseSchema = z.object({
  name: z.string().min(1, "Course name is required").max(200),
  code: z.string().max(50).optional(),
  instructor: z.string().max(200).optional(),
  semester: z.string().max(50).optional(),
});

export const CreateResourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  url: z.string().url("Please enter a valid URL"),
  description: z.string().max(1000).optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
});

export type CreatePageInput = z.infer<typeof CreatePageSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;
