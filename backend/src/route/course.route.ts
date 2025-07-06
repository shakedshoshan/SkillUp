import { Router } from 'express';
import { CourseController } from '../controller/course.controller';

const courseRouter = Router();

// GET /api/v1/courses - Get all courses
courseRouter.get('/', CourseController.getAllCourses);

// GET /api/v1/courses/published - Get published courses only
courseRouter.get('/published', CourseController.getPublishedCourses);

// GET /api/v1/courses/user/:userId - Get courses by user ID (basic data only)
courseRouter.get('/user/:userId', CourseController.getCoursesByUser);

// GET /api/v1/courses/:id - Get course by ID with all nested data
courseRouter.get('/:id', CourseController.getCourseById);

export default courseRouter; 