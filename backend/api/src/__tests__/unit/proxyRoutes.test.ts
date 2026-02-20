import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import axios from 'axios';
import proxyRoutes from '../../routes/proxyRoutes';

vi.mock('axios');

const app = express();
app.use('/api/v1/proxy', proxyRoutes);

describe('Proxy Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /image', () => {
    it('should return 400 when URL parameter is missing', async () => {
      const response = await request(app).get('/api/v1/proxy/image');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'URL parameter is required' });
    });

    it('should return 400 when URL is invalid', async () => {
      const response = await request(app).get('/api/v1/proxy/image?url=not-a-valid-url');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid URL provided' });
    });

    it('should fetch image and return with correct headers', async () => {
      const mockImageData = Buffer.from('fake-image-data');
      const mockImageUrl = 'https://example.com/image.jpg';

      (axios.get as vi.Mock).mockResolvedValue({
        data: mockImageData,
        headers: {
          'content-type': 'image/jpeg',
        },
      });

      const response = await request(app).get(
        `/api/v1/proxy/image?url=${encodeURIComponent(mockImageUrl)}`
      );

      expect(axios.get).toHaveBeenCalledWith(mockImageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['cache-control']).toBe('public, max-age=86400');
    });

    it('should use default content-type when not provided', async () => {
      const mockImageData = Buffer.from('fake-image-data');
      const mockImageUrl = 'https://example.com/image.png';

      (axios.get as vi.Mock).mockResolvedValue({
        data: mockImageData,
        headers: {},
      });

      const response = await request(app).get(
        `/api/v1/proxy/image?url=${encodeURIComponent(mockImageUrl)}`
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/jpeg');
    });

    it('should handle network errors', async () => {
      const mockImageUrl = 'https://example.com/image.jpg';

      (axios.get as vi.Mock).mockRejectedValue(new Error('Network error'));

      const response = await request(app).get(
        `/api/v1/proxy/image?url=${encodeURIComponent(mockImageUrl)}`
      );

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error while fetching image' });
    });

    it('should handle HTTP errors from source', async () => {
      const mockImageUrl = 'https://example.com/image.jpg';

      (axios.get as vi.Mock).mockRejectedValue({
        response: {
          status: 404,
          statusText: 'Not Found',
        },
      });

      const response = await request(app).get(
        `/api/v1/proxy/image?url=${encodeURIComponent(mockImageUrl)}`
      );

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Failed to fetch image from source' });
    });

    it('should handle timeout errors', async () => {
      const mockImageUrl = 'https://example.com/slow-image.jpg';

      (axios.get as vi.Mock).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      });

      const response = await request(app).get(
        `/api/v1/proxy/image?url=${encodeURIComponent(mockImageUrl)}`
      );

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error while fetching image' });
    });

    it('should handle different image types', async () => {
      const testCases = [
        { url: 'https://example.com/image.png', contentType: 'image/png' },
        { url: 'https://example.com/image.gif', contentType: 'image/gif' },
        { url: 'https://example.com/image.webp', contentType: 'image/webp' },
      ];

      for (const testCase of testCases) {
        const mockImageData = Buffer.from('fake-image-data');

        (axios.get as vi.Mock).mockResolvedValue({
          data: mockImageData,
          headers: {
            'content-type': testCase.contentType,
          },
        });

        const response = await request(app).get(
          `/api/v1/proxy/image?url=${encodeURIComponent(testCase.url)}`
        );

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe(testCase.contentType);
      }
    });

    it('should handle URLs with special characters', async () => {
      const mockImageData = Buffer.from('fake-image-data');
      const mockImageUrl = 'https://example.com/images/test image (1).jpg?size=large&format=jpg';

      (axios.get as vi.Mock).mockResolvedValue({
        data: mockImageData,
        headers: {
          'content-type': 'image/jpeg',
        },
      });

      const response = await request(app).get(
        `/api/v1/proxy/image?url=${encodeURIComponent(mockImageUrl)}`
      );

      expect(response.status).toBe(200);
      expect(axios.get).toHaveBeenCalledWith(mockImageUrl, expect.any(Object));
    });
  });
});
