import { Router, Request, Response } from 'express';
import axios from 'axios';
import logger from '../config/logger';

const router = Router();

/**
 * Proxy endpoint for fetching images from external sources
 * This solves CORS issues when trying to load images in PDFs
 */
router.get('/image', async (req: Request, res: Response) => {
  try {
    const imageUrl = req.query.url as string;

    if (!imageUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL
    try {
      new URL(imageUrl);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }

    // Fetch the image
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // Get content type from response
    const contentType = response.headers['content-type'] || 'image/jpeg';

    // Set CORS headers
    res.set({
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    });

    res.send(response.data);
  } catch (error: any) {
    logger.error('Error proxying image:', error);

    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Failed to fetch image from source',
      });
    }

    res.status(500).json({ error: 'Internal server error while fetching image' });
  }
});

export default router;
