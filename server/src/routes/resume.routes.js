import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { uploadMiddleware, handleUploadErrors } from '../middleware/upload.js';
import { uploadResume, getLatestResume, deleteResume } from '../controllers/resume.controller.js';

const router = Router();

router.use(authenticate);
router.post('/upload', uploadMiddleware, handleUploadErrors, uploadResume);
router.get('/latest', getLatestResume);
router.delete('/:id', deleteResume);

export default router;

