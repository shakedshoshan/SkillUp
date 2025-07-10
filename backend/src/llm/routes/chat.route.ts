import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';

const router = Router();

/**
 * GET /api/v1/chat
 * Get chat API information and status
 */
router.get('/info', chatController.info);

/**
 * POST /api/v1/chat
 * Send a message to CourseBot and get a response
 * 
 * Body:
 * {
 *   "message": "Hi, I want to create an online course",
 *   "history": [
 *     { "role": "user", "content": "Previous message" },
 *     { "role": "assistant", "content": "Previous response" }
 *   ]
 * }
 */
router.post('/', chatController.chat);

/**
 * GET /api/v1/chat/health
 * Check the health status of the chat service
 */
router.get('/health', chatController.health);

/**
 * GET /api/v1/chat/models
 * Get available Ollama models
 */
router.get('/models', chatController.getModels);

export default router; 