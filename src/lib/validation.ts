import { z } from "zod";
import { sanitizeText, sanitizeUrl } from "@/lib/sanitize";

// Base schemas with common transformations
const BaseSchema = {
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
};

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
});

export type UserFormData = z.infer<typeof userSchema>;

// Page/Note schemas
export const pageSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(500, "Title must be less than 500 characters")
    .transform(sanitizeText),
  content: z.union([z.string(), z.array(z.any())]).optional(),
  icon: z.string().max(10).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_favorite: z.boolean().optional(),
  is_public: z.boolean().optional(),
  tags: z.array(z.string().max(50)).default([]),
});

export const pageUpdateSchema = pageSchema.partial();

export type PageFormData = z.infer<typeof pageSchema>;
export type PageUpdateFormData = z.infer<typeof pageUpdateSchema>;

// Task schemas
export const taskSchema = z.object({
  title: z.string()
    .min(1, "Task title is required")
    .max(500, "Title must be less than 500 characters")
    .transform(sanitizeText),
  description: z.string()
    .max(5000, "Description must be less than 5000 characters")
    .transform(val => val ? sanitizeText(val) : val)
    .optional()
    .nullable(),
  status: z.enum(["todo", "in_progress", "completed", "archived"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_date: z.string().datetime().nullable().optional(),
  tags: z.array(z.string().max(50)).default([]),
  course_id: z.string().uuid().nullable().optional(),
});

export const taskUpdateSchema = taskSchema.partial();

export type TaskFormData = z.infer<typeof taskSchema>;
export type TaskUpdateFormData = z.infer<typeof taskUpdateSchema>;

// Course schemas
export const courseSchema = z.object({
  name: z.string()
    .min(1, "Course name is required")
    .max(200, "Name must be less than 200 characters")
    .transform(sanitizeText),
  code: z.string()
    .max(50, "Course code must be less than 50 characters")
    .transform(val => val ? sanitizeText(val) : val)
    .optional()
    .nullable(),
  instructor: z.string()
    .max(200, "Instructor name must be less than 200 characters")
    .transform(val => val ? sanitizeText(val) : val)
    .optional()
    .nullable(),
  semester: z.string()
    .max(50, "Semester must be less than 50 characters")
    .optional()
    .nullable(),
  progress: z.number().min(0).max(100).default(0),
  status: z.enum(["active", "completed", "dropped"]).default("active"),
});

export const courseUpdateSchema = courseSchema.partial();

export type CourseFormData = z.infer<typeof courseSchema>;
export type CourseUpdateFormData = z.infer<typeof courseUpdateSchema>;

// DSA Problem schemas
export const dsaProblemSchema = z.object({
  title: z.string()
    .min(1, "Problem title is required")
    .max(300, "Title must be less than 300 characters")
    .transform(sanitizeText),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.string().min(1, "Category is required"),
  platform: z.string().min(1, "Platform is required"),
  url: z.string()
    .url("Please enter a valid URL")
    .refine(val => {
      const sanitized = sanitizeUrl(val);
      return sanitized !== null;
    }, "Invalid URL format")
    .optional()
    .nullable(),
  notes: z.string().max(5000).optional().nullable(),
  solution_code: z.string().optional().nullable(),
  time_complexity: z.string().max(50).optional().nullable(),
  space_complexity: z.string().max(50).optional().nullable(),
  solved: z.boolean().default(false),
  tags: z.array(z.string().max(50)).default([]),
});

export const dsaProblemUpdateSchema = dsaProblemSchema.partial();

export type DSAProblemFormData = z.infer<typeof dsaProblemSchema>;
export type DSAProblemUpdateFormData = z.infer<typeof dsaProblemUpdateSchema>;

// Resource schemas
export const resourceSchema = z.object({
  title: z.string()
    .min(1, "Resource title is required")
    .max(300, "Title must be less than 300 characters")
    .transform(sanitizeText),
  url: z.string()
    .url("Please enter a valid URL")
    .refine(val => sanitizeUrl(val) !== null, "Invalid URL"),
  description: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .transform(val => val ? sanitizeText(val) : val)
    .optional()
    .nullable(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string().max(50)).default([]),
});

export const resourceUpdateSchema = resourceSchema.partial();

export type ResourceFormData = z.infer<typeof resourceSchema>;
export type ResourceUpdateFormData = z.infer<typeof resourceUpdateSchema>;

// Project schemas
export const projectSchema = z.object({
  name: z.string()
    .min(1, "Project name is required")
    .max(200, "Name must be less than 200 characters")
    .transform(sanitizeText),
  description: z.string()
    .max(5000, "Description must be less than 5000 characters")
    .optional()
    .nullable(),
  status: z.enum(["planning", "in_progress", "completed", "on_hold"]).default("planning"),
  github_url: z.string()
    .url("Please enter a valid GitHub URL")
    .refine(val => !val || val.includes("github.com"), "Must be a GitHub URL")
    .optional()
    .nullable(),
  tech_stack: z.array(z.string().max(50)).default([]),
});

export const projectUpdateSchema = projectSchema.partial();

export type ProjectFormData = z.infer<typeof projectSchema>;
export type ProjectUpdateFormData = z.infer<typeof projectUpdateSchema>;

// Habit schemas
export const habitSchema = z.object({
  name: z.string()
    .min(1, "Habit name is required")
    .max(200, "Name must be less than 200 characters")
    .transform(sanitizeText),
  description: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .nullable(),
  frequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  target_count: z.number().min(1).default(1),
});

export const habitUpdateSchema = habitSchema.partial();

export type HabitFormData = z.infer<typeof habitSchema>;
export type HabitUpdateFormData = z.infer<typeof habitUpdateSchema>;

// Paper schemas
export const paperSchema = z.object({
  title: z.string()
    .min(1, "Paper title is required")
    .max(500, "Title must be less than 500 characters")
    .transform(sanitizeText),
  authors: z.array(z.string().max(200)).default([]),
  venue: z.string().max(300).optional().nullable(),
  year: z.number()
    .min(1800)
    .max(new Date().getFullYear() + 1)
    .optional()
    .nullable(),
  doi: z.string().max(100).optional().nullable(),
  arxiv_id: z.string().max(50).optional().nullable(),
  abstract: z.string().max(10000).optional().nullable(),
  pdf_url: z.string().url().optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  read_status: z.enum(["unread", "reading", "read"]).default("unread"),
  importance: z.enum(["low", "medium", "high"]).default("medium"),
  tags: z.array(z.string().max(50)).default([]),
});

export const paperUpdateSchema = paperSchema.partial();

export type PaperFormData = z.infer<typeof paperSchema>;
export type PaperUpdateFormData = z.infer<typeof paperUpdateSchema>;

// Flashcard schemas
export const flashcardSchema = z.object({
  front: z.string()
    .min(1, "Front side is required")
    .max(1000, "Front must be less than 1000 characters")
    .transform(sanitizeText),
  back: z.string()
    .min(1, "Back side is required")
    .max(2000, "Back must be less than 2000 characters")
    .transform(sanitizeText),
  deck_id: z.string().uuid(),
  difficulty: z.number().min(0).max(5).default(0),
});

export const flashcardUpdateSchema = flashcardSchema.partial();

export type FlashcardFormData = z.infer<typeof flashcardSchema>;
export type FlashcardUpdateFormData = z.infer<typeof flashcardUpdateSchema>;

// Search query schema
export const searchQuerySchema = z.object({
  query: z.string()
    .min(1, "Search query is required")
    .max(100, "Query must be less than 100 characters")
    .transform(val => val.trim()),
  filters: z.object({
    type: z.enum(["all", "pages", "tasks", "courses", "resources", "papers"]).default("all"),
    tags: z.array(z.string()).default([]),
    dateRange: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }).optional(),
  }).default({}),
});

export type SearchQueryFormData = z.infer<typeof searchQuerySchema>;

// Form validation helper
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Type-safe form error extractor
export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });
  return errors;
}
