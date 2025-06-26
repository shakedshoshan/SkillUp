import { Router } from 'express';
import learningPathRoutes from './modules/learning-path/learning-path.routes';

const router = Router();

// API routes
router.use('/api/learning-paths', learningPathRoutes);

export default router; 