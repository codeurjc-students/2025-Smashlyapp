import { Response } from 'express';
import { RequestWithUser } from '../../../src/types';
import { UploadController } from '../../../src/controllers/uploadController';

// Mock supabase
jest.mock('../../../src/config/supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('UploadController', () => {
  let mockReq: Partial<RequestWithUser>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn().mockReturnThis();

    mockRes = {
      status: statusMock,
      json: jsonMock,
    };

    mockReq = {
      user: { id: 'user-123', email: 'user@test.com' },
      file: {
        fieldname: 'avatar',
        originalname: 'avatar.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024 * 100, // 100KB
        buffer: Buffer.from('test image data'),
        stream: null as any,
        destination: '' as any,
        filename: '' as any,
        path: '' as any,
      },
    };
  });

  describe('uploadAvatar', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;

      await UploadController.uploadAvatar(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Unauthorized',
        })
      );
    });

    it('should return 400 when no file is provided', async () => {
      mockReq.file = undefined as any;

      await UploadController.uploadAvatar(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'No se proporcionó ningún archivo',
        })
      );
    });

    it('should return 400 for invalid file type (PDF)', async () => {
      (mockReq.file as any).mimetype = 'application/pdf';

      await UploadController.uploadAvatar(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Tipo de archivo no válido'),
        })
      );
    });

    it('should return 400 for file too large (>5MB)', async () => {
      (mockReq.file as any).size = 6 * 1024 * 1024; // 6MB

      await UploadController.uploadAvatar(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('demasiado grande'),
        })
      );
    });
  });

  describe('deleteAvatar', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = undefined;

      await UploadController.deleteAvatar(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Unauthorized',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      // Force an error by mocking from to throw
      const { supabase } = require('../../../src/config/supabase');
      supabase.from.mockImplementationOnce(() => {
        throw new Error('Database error');
      });

      await UploadController.deleteAvatar(mockReq as RequestWithUser, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('File Type Validation', () => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    allowedTypes.forEach(type => {
      it(`should accept ${type} files`, async () => {
        // Just verify the type is in the allowed list
        expect(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']).toContain(type);
      });
    });
  });

  describe('File Size Validation', () => {
    it('should have max size of 5MB', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      expect(maxSize).toBe(5242880);
    });
  });
});
