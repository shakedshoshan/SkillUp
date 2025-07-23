import { Router } from 'express';
import { enhancedChatController } from '../controllers/enhanced-chat.controller';

const router = Router();

/**
 * GET /api/v1/chat/enhanced/info
 * Get enhanced chat API information and status
 */
router.get('/info', enhancedChatController.info);

/**
 * POST /api/v1/chat/enhanced
 * Enhanced chat with course brainstorming features
 * 
 * Body:
 * {
 *   "message": "I want to create a course about digital marketing",
 *   "history": [
 *     { "role": "user", "content": "Previous message" },
 *     { "role": "assistant", "content": "Previous response" }
 *   ],
 *   "context": {
 *     "userProfile": {
 *       "skills": ["marketing", "social media"],
 *       "experience": "5 years in digital marketing",
 *       "industry": "technology",
 *       "goals": ["help beginners", "share expertise"]
 *     },
 *     "conversationStage": "discovery",
 *     "identifiedTopics": ["digital marketing", "social media"],
 *     "suggestedCourses": []
 *   },
 *   "generateIdeas": true
 * }
 */
router.post('/', enhancedChatController.chat);

/**
 * POST /api/v1/chat/enhanced/generate-ideas
 * Generate structured course ideas based on user input
 * 
 * Body:
 * {
 *   "userInput": "I'm a graphic designer with 8 years of experience",
 *   "context": {
 *     "userProfile": {
 *       "skills": ["graphic design", "Adobe Creative Suite"],
 *       "experience": "8 years",
 *       "industry": "creative"
 *     }
 *   }
 * }
 */
router.post('/generate-ideas', enhancedChatController.generateCourseIdeas);

/**
 * POST /api/v1/chat/enhanced/analyze
 * Analyze user input for intent and context
 * 
 * Body:
 * {
 *   "userInput": "I want to teach people how to use Photoshop"
 * }
 */
router.post('/analyze', enhancedChatController.analyzeInput);

/**
 * POST /api/v1/chat/enhanced/suggestions
 * Get conversation suggestions based on current context
 * 
 * Body:
 * {
 *   "context": {
 *     "conversationStage": "ideation",
 *     "identifiedTopics": ["graphic design", "Photoshop"],
 *     "userProfile": {
 *       "skills": ["graphic design"]
 *     }
 *   },
 *   "lastMessage": "I want to create a Photoshop course"
 * }
 */
router.post('/suggestions', enhancedChatController.getSuggestions);

/**
 * GET /api/v1/chat/enhanced/health
 * Check the health status of the enhanced chat service
 */
router.get('/health', enhancedChatController.health);

export default router; 