import { Router } from 'express';
import { handleGenerateQuiz, handleValidateMission } from '../controllers/workerController';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// Apply Authentication Middleware to all routes below
// Security: Verifies Supabase Session Token
router.use(authenticateUser);

// Route for generating quiz from mission log (Learning/Work)
router.post('/quiz', handleGenerateQuiz);

// Route for validating mission via image (General/Physical)
router.post('/validate', handleValidateMission);

export default router;
