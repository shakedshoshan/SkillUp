import { z } from 'zod'; // zod is a library for validating and parsing data

// Quiz Option Schema
export const QuizOptionSchema = z.object({
  option: z.string(), // A, B, C, D
  text: z.string(),
  is_correct: z.boolean(),
});

// Quiz Question Schema
export const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(QuizOptionSchema).length(4), // Exactly 4 options
  explanation: z.string().optional(), // Optional explanation of the correct answer
});

// Quiz Schema
export const QuizSchema = z.object({
  questions: z.array(QuizQuestionSchema).length(3), // Exactly 3 questions per lesson
});

// Lesson Content Schema
export const LessonContentSchema = z.object({
  title: z.string(),
  learning_objectives: z.array(z.string()),
  content: z.string(),
  key_concepts: z.array(z.string()),
  examples: z.array(z.string()),
  exercises: z.array(z.string()),
  estimated_duration: z.string(),
  quiz: QuizSchema, // Add quiz to every lesson
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
  parts: z.array(CoursePartSchema).default([]).transform(parts => parts || []),
});

// Workflow State Schema
export const WorkflowStateSchema = z.object({
  user_query: z.string(),
  course_subject: z.string().default(''),
  course_structure: CourseStructureSchema.optional(),
  current_part_index: z.number().default(0),
  current_lesson_index: z.number().default(0),
  status_message: z.string().default(''),
  web_search_enabled: z.boolean().optional(),
});

// JSON Activation Schema for file-based course generation
export const CourseActivationSchema = z.object({
  course_topic: z.string().min(1, "Course topic is required"),
  search_web: z.boolean().default(false),
  user_id: z.string().uuid("Invalid UUID format for user_id"),
  output_file: z.string().optional(), // Optional output file path
});

// TypeScript Types (inferred from schemas)
export type QuizOption = z.infer<typeof QuizOptionSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type LessonContent = z.infer<typeof LessonContentSchema>;
export type CourseLesson = z.infer<typeof CourseLessonSchema>;
export type CoursePart = z.infer<typeof CoursePartSchema>;
export type CourseStructure = z.infer<typeof CourseStructureSchema>;
export type WorkflowState = z.infer<typeof WorkflowStateSchema>;
export type CourseActivation = z.infer<typeof CourseActivationSchema>; 