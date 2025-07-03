import { Router } from 'express';
import { UserController } from '../controller/user.controller';

const userRouter = Router();

// GET /api/v1/users - Get all users
userRouter.get('/', UserController.getAllUsers);

// GET /api/v1/users/:id - Get user by ID
userRouter.get('/:id', UserController.getUserById);

// POST /api/v1/users - Create new user
userRouter.post('/', UserController.createUser);

export default userRouter; 