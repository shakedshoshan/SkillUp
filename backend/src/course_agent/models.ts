import { z } from 'zod';

// Lesson Content Schema
export const LessonContentSchema = z.object({
  title: z.string(),
  learning_objectives: z.array(z.string()),
  content: z.string(),
  key_concepts: z.array(z.string()),
  examples: z.array(z.string()),
  exercises: z.array(z.string()),
  estimated_duration: z.string(),
});

// Course Lesson Schema
export const CourseLessonSchema = z.object({
  lesson_number: z.number(),
  title: z.string(),
  description: z.string(),
  content: LessonContentSchema.optional(),
});

// Course Part Schema
export const CoursePartSchema = z.object({
  part_number: z.number(),
  title: z.string(),
  description: z.string(),
  learning_goals: z.array(z.string()),
  lessons: z.array(CourseLessonSchema).default([]),
});

// Course Structure Schema
export const CourseStructureSchema = z.object({
  title: z.string(),
  description: z.string(),
  target_audience: z.string(),
  prerequisites: z.array(z.string()),
  total_duration: z.string(),
  parts: z.array(CoursePartSchema).default([]),
});

// Workflow State Schema
export const WorkflowStateSchema = z.object({
  user_query: z.string(),
  course_subject: z.string().default(''),
  course_structure: CourseStructureSchema.optional(),
  current_part_index: z.number().default(0),
  current_lesson_index: z.number().default(0),
  status_message: z.string().default(''),
});

// TypeScript Types (inferred from schemas)
export type LessonContent = z.infer<typeof LessonContentSchema>;
export type CourseLesson = z.infer<typeof CourseLessonSchema>;
export type CoursePart = z.infer<typeof CoursePartSchema>;
export type CourseStructure = z.infer<typeof CourseStructureSchema>;
export type WorkflowState = z.infer<typeof WorkflowStateSchema>; 