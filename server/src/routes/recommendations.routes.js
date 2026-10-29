import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getRecommendations, generateNewRecommendations } from '../controllers/recommendations.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', getRecommendations);
router.post('/generate', generateNewRecommendations);

export default router;

