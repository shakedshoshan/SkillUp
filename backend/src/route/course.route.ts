import { Router } from 'express';
import { CourseController } from '../controller/course.controller';

const courseRouter = Router();

// Course Management Endpoints
// GET /api/v1/courses - Get all courses
courseRouter.get('/', CourseController.getAllCourses);

// GET /api/v1/courses/published - Get published courses only
courseRouter.get('/published', CourseController.getPublishedCourses);

// GET /api/v1/courses/user/:userId - Get courses by user ID (basic data only)
courseRouter.get('/user/:userId', CourseController.getCoursesByUser);

// Course Enrollment Endpoints
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

// Course Editing Endpoints
// PUT /api/v1/courses/:id - Update course details
courseRouter.put('/:id', CourseController.updateCourse);

// POST /api/v1/courses/:id/parts - Add a new part to course
courseRouter.post('/:id/parts', CourseController.addCoursePart);

// PUT /api/v1/courses/:id/parts/:partId - Update course part
courseRouter.put('/:id/parts/:partId', CourseController.updateCoursePart);

// DELETE /api/v1/courses/:id/parts/:partId - Delete course part
courseRouter.delete('/:id/parts/:partId', CourseController.deleteCoursePart);

// POST /api/v1/courses/:id/parts/:partId/lessons - Add a new lesson to part
courseRouter.post('/:id/parts/:partId/lessons', CourseController.addLesson);

// PUT /api/v1/courses/:id/parts/:partId/lessons/:lessonId - Update lesson
courseRouter.put('/:id/parts/:partId/lessons/:lessonId', CourseController.updateLesson);

// DELETE /api/v1/courses/:id/parts/:partId/lessons/:lessonId - Delete lesson
courseRouter.delete('/:id/parts/:partId/lessons/:lessonId', CourseController.deleteLesson);

export default courseRouter; 