import { z } from "zod";

export const createPageSchema = z.object({
    title: z.string().min(1, "Title is required").max(500, "Title too long"),
    content: z.string().max(50000, "Content too long").optional(),
});

export const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required").max(500, "Title too long"),
    description: z.string().max(5000, "Description too long").optional(),
    dueDate: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const createCourseSchema = z.object({
    name: z.string().min(1, "Course name required").max(200, "Name too long"),
    code: z.string().max(50, "Code too long").optional(),
    instructor: z.string().max(200, "Instructor name too long").optional(),
    semester: z.string().max(50, "Semester too long").optional(),
});
