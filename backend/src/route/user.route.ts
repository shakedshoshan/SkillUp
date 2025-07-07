import { Router } from 'express';
import { UserController } from '../controller/user.controller';
import { CourseController } from '../controller/course.controller';

const userRouter = Router();

// GET /api/v1/users/:id - Get user by ID
userRouter.get('/:id', UserController.getUserById);

// GET /api/v1/users/:userId/enrolled-courses - Get enrolled courses for user
userRouter.get('/:userId/enrolled-courses', CourseController.getEnrolledCourses);

export default userRouter; 