import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { listJobs, getJob, getSupportedLocations } from '../controllers/jobs.controller.js';

const router = Router();

router.get('/locations', getSupportedLocations);
router.use(authenticate);
router.get('/', listJobs);
router.get('/:id', getJob);

export default router;

