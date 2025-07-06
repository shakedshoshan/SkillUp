import { Router } from 'express';
import { UserController } from '../controller/user.controller';

const userRouter = Router();

// GET /api/v1/users/:id - Get user by ID
userRouter.get('/:id', UserController.getUserById);


export default userRouter; 