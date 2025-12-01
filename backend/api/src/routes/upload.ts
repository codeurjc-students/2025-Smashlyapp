import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/uploadController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Configurar multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Validar tipo de archivo
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG y WebP'));
    }
  },
});

// POST /api/upload/avatar - Sube un avatar de usuario
router.post('/avatar', authenticateUser, upload.single('avatar'), UploadController.uploadAvatar);

// DELETE /api/upload/avatar - Elimina el avatar del usuario
router.delete('/avatar', authenticateUser, UploadController.deleteAvatar);

export default router;
