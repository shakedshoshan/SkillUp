// Export all main classes and types
export { CourseBuilderAgent } from './course-builder-agent';
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
  WorkflowStateSchema,
  CourseStructureSchema,
  CoursePartSchema,
  CourseLessonSchema,
  LessonContentSchema
} from './models'; 