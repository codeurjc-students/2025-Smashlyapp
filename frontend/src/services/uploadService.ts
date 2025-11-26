import { buildApiUrl, getCommonHeaders } from "../config/api";

interface UploadAvatarResponse {
  success: boolean;
  data?: {
    avatar_url: string;
    file_path: string;
  };
  message?: string;
  error?: string;
}

/**
 * Servicio para manejar la subida de archivos (avatares)
 */
export class UploadService {
  /**
   * Sube un avatar de usuario
   * @param file - Archivo de imagen a subir
   * @returns URL pública del avatar subido
   */
  static async uploadAvatar(file: File): Promise<string> {
    try {
      // Validar el archivo antes de enviarlo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG y WebP');
      }

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('El archivo es demasiado grande. Tamaño máximo: 5MB');
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('avatar', file);

      // Enviar el archivo al backend
      const url = buildApiUrl('/api/v1/upload/avatar');
      const headers = getCommonHeaders() as Record<string, string>;
      
      // Eliminar Content-Type para que el navegador lo configure automáticamente con el boundary
      delete headers['Content-Type'];

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData,
      });

      const data: UploadAvatarResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Error al subir el avatar');
      }

      if (!data.data?.avatar_url) {
        throw new Error('No se recibió la URL del avatar');
      }

      return data.data.avatar_url;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      throw new Error(error.message || 'Error al subir el avatar');
    }
  }

  /**
   * Elimina el avatar del usuario
   */
  static async deleteAvatar(): Promise<void> {
    try {
      const url = buildApiUrl('/api/v1/upload/avatar');
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getCommonHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Error al eliminar el avatar');
      }
    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      throw new Error(error.message || 'Error al eliminar el avatar');
    }
  }

  /**
   * Valida si un archivo es una imagen válida
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Tipo de archivo no válido. Solo se permiten imágenes JPEG, PNG y WebP',
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'El archivo es demasiado grande. Tamaño máximo: 5MB',
      };
    }

    return { isValid: true };
  }

  /**
   * Crea una URL de vista previa para una imagen
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Libera una URL de vista previa creada con createPreviewUrl
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
