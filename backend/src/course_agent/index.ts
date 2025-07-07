// Export all main classes and types
export { CourseBuilderAgent } from './course-builder-agent';
export { JsonCourseBuilderAgent } from './course-builder-json';
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