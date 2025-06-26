import { Router } from 'express';
import { LearningPathController } from './learning-path.controller';

const router = Router();

// Learning path routes
router.get('/', LearningPathController.getLearningPaths);
router.get('/:id', LearningPathController.getLearningPathById);
router.post('/', LearningPathController.createLearningPath);
router.put('/:id', LearningPathController.updateLearningPath);
router.delete('/:id', LearningPathController.deleteLearningPath);

export default router; 