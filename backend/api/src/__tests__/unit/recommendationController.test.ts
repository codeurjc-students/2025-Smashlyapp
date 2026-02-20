import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { RecommendationController } from '../../controllers/recommendationController';
import { RecommendationService } from '../../services/recommendationService';
import { AuthRequest } from '../../types';

vi.mock('../../services/recommendationService');

describe('RecommendationController', () => {
  let mockRequest: Partial<Request & AuthRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: vi.Mock;
  let statusMock: vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      body: {},
      user: undefined,
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
  });

  describe('generate', () => {
    it('should return 400 when type is missing', async () => {
      mockRequest.body = { data: {} };

      await RecommendationController.generate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Missing type or data' });
    });

    it('should call RecommendationService and return result', async () => {
      const mockResult = {
        rackets: [],
        analysis: 'Test analysis',
      };

      mockRequest.body = {
        type: 'basic',
        data: { level: 'intermediate' },
      };

      (RecommendationService.generateRecommendation as vi.Mock).mockResolvedValue(mockResult);

      await RecommendationController.generate(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(RecommendationService.generateRecommendation).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('save', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockRequest.body = {
        type: 'basic',
        formData: {},
        result: {},
      };
      mockRequest.user = undefined;

      await RecommendationController.save(
        mockRequest as Request & AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should save recommendation when authenticated', async () => {
      const mockSaved = {
        id: 'rec123',
        user_id: 'user123',
        form_type: 'basic',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockRequest.body = {
        type: 'basic',
        formData: {},
        result: {},
      };
      mockRequest.user = { id: 'user123', email: 'test@test.com' };

      (RecommendationService.saveRecommendation as vi.Mock).mockResolvedValue(mockSaved);

      await RecommendationController.save(
        mockRequest as Request & AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockSaved);
    });
  });

  describe('getLast', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await RecommendationController.getLast(
        mockRequest as Request & AuthRequest,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return message when no recommendations found', async () => {
      mockRequest.user = { id: 'user123', email: 'test@test.com' };

      (RecommendationService.getLastRecommendation as vi.Mock).mockResolvedValue(null);

      await RecommendationController.getLast(
        mockRequest as Request & AuthRequest,
        mockResponse as Response
      );

      expect(jsonMock).toHaveBeenCalledWith({ message: 'No recommendations found' });
    });
  });
});
