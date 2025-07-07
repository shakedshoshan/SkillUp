import { Router } from 'express';
import { CourseController } from '../controller/course.controller';

const courseRouter = Router();

// GET /api/v1/courses - Get all courses
courseRouter.get('/', CourseController.getAllCourses);

// GET /api/v1/courses/published - Get published courses only
courseRouter.get('/published', CourseController.getPublishedCourses);

// GET /api/v1/courses/user/:userId - Get courses by user ID (basic data only)
courseRouter.get('/user/:userId', CourseController.getCoursesByUser);

// POST /api/v1/courses/:courseId/enroll - Enroll user in course
courseRouter.post('/:courseId/enroll', CourseController.enrollInCourse);

// GET /api/v1/courses/:courseId/enrollment/:userId - Get course enrollment
courseRouter.get('/:courseId/enrollment/:userId', CourseController.getCourseEnrollment);

// PUT /api/v1/courses/:courseId/progress - Update course progress
courseRouter.put('/:courseId/progress', CourseController.updateProgress);

// GET /api/v1/courses/:courseId/completions/:userId - Get all lesson completions for a course
courseRouter.get('/:courseId/completions/:userId', CourseController.getCourseCompletions);

// GET /api/v1/courses/:id - Get course by ID with all nested data
courseRouter.get('/:id', CourseController.getCourseById);

export default courseRouter; 