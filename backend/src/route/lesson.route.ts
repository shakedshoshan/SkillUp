import { Router } from 'express';
import { LessonController } from '../controller/lesson.controller';

const lessonRouter = Router();

// POST /api/v1/lessons/:lessonId/complete - Complete a lesson
lessonRouter.post('/:lessonId/complete', LessonController.completeLesson);

// GET /api/v1/lessons/:lessonId/completion/:userId - Get lesson completion
lessonRouter.get('/:lessonId/completion/:userId', LessonController.getLessonCompletion);

// POST /api/v1/lessons/:lessonId/quiz/submit - Submit quiz for lesson
lessonRouter.post('/:lessonId/quiz/submit', LessonController.submitQuiz);

export default lessonRouter; 