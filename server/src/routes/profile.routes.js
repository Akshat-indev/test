import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', getProfile);
router.patch('/', updateProfile);

export default router;

