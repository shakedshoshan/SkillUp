// Export web API classes and utilities
export { StreamingCourseBuilderAgent } from './course-builder-stream';
export { CourseBuilderWorkflow } from './workflow';
export { CourseFormatter } from './course-formatter';
export { KnowledgeService } from './knowledge-service';
export { CoursePrompts } from './prompts';
export { CourseSaver } from './course-saver';

// Export types and schemas
export {
  WorkflowState,
  CourseStructure,
  CoursePart,
  CourseLesson,
  LessonContent,
  CourseActivation,
  WorkflowStateSchema,
  CourseStructureSchema,
  CoursePartSchema,
  CourseLessonSchema,
  LessonContentSchema,
  CourseActivationSchema
} from './models'; 