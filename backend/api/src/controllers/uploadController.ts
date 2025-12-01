import { Request, Response } from 'express';
import { RequestWithUser } from '../types';
import { supabase } from '../config/supabase';
import logger from '../config/logger';
import { randomUUID } from 'crypto';

/**
 * Controlador para manejar la subida de archivos (avatares)
 */
export class UploadController {
  /**
   * POST /api/upload/avatar
   * Sube un avatar de usuario a Supabase Storage
   */
  static async uploadAvatar(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      // Verificar que se envió un archivo
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'No se proporcionó ningún archivo',
        });
        return;
      }

      const file = req.file;

      // Validar tipo de archivo
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG y WebP',
        });
        return;
      }

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'El archivo es demasiado grande. Tamaño máximo: 5MB',
        });
        return;
      }

      // Generar nombre único para el archivo
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${randomUUID()}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;

      // Eliminar avatar anterior si existe
      try {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('id', userId)
          .single();

        if (userProfile?.avatar_url) {
          // Extraer el path del avatar anterior
          const oldAvatarPath = userProfile.avatar_url.split('/avatars/')[1];
          if (oldAvatarPath) {
            await supabase.storage.from('avatars').remove([oldAvatarPath]);
            logger.info(`🗑️ Deleted old avatar: ${oldAvatarPath}`);
          }
        }
      } catch (error) {
        logger.warn('Error deleting old avatar:', error);
        // No es crítico, continuamos con la subida
      }

      // Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        logger.error('Error uploading avatar to storage:', uploadError);
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Error al subir el archivo',
        });
        return;
      }

      // Obtener URL pública del archivo
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Actualizar el perfil del usuario con la nueva URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        logger.error('Error updating user profile with avatar URL:', updateError);
        // Intentar eliminar el archivo subido
        await supabase.storage.from('avatars').remove([filePath]);
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Error al actualizar el perfil con el avatar',
        });
        return;
      }

      logger.info(`✅ Avatar uploaded successfully for user ${userId}: ${avatarUrl}`);

      res.status(200).json({
        success: true,
        data: {
          avatar_url: avatarUrl,
          file_path: filePath,
        },
        message: 'Avatar subido exitosamente',
      });
    } catch (error: unknown) {
      logger.error('Error in uploadAvatar:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
      });
    }
  }

  /**
   * DELETE /api/upload/avatar
   * Elimina el avatar del usuario
   */
  static async deleteAvatar(req: RequestWithUser, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      // Obtener el avatar actual
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (!userProfile?.avatar_url) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'No se encontró ningún avatar para eliminar',
        });
        return;
      }

      // Extraer el path del avatar
      const avatarPath = userProfile.avatar_url.split('/avatars/')[1];
      
      if (avatarPath) {
        // Eliminar archivo del storage
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([avatarPath]);

        if (deleteError) {
          logger.error('Error deleting avatar from storage:', deleteError);
        }
      }

      // Actualizar el perfil para eliminar la URL del avatar
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        logger.error('Error updating user profile after avatar deletion:', updateError);
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: 'Error al eliminar el avatar del perfil',
        });
        return;
      }

      logger.info(`✅ Avatar deleted successfully for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Avatar eliminado exitosamente',
      });
    } catch (error: unknown) {
      logger.error('Error in deleteAvatar:', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
      });
    }
  }
}
