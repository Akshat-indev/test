import multer from 'multer';
import path from 'path';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx']);

// Store files in memory so we can process and immediately discard them
const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      Object.assign(new Error('Only PDF and DOCX files are supported'), { status: 400 }),
      false
    );
  }
  cb(null, true);
}

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
}).single('resume');

/**
 * Wraps multer errors into structured Express responses.
 */
export function handleUploadErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the 5 MB limit' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
}

