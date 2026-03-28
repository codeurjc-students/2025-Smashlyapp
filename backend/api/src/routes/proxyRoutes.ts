import { Router, Request, Response } from 'express';
import axios from 'axios';
import logger from '../config/logger';

const router = Router();

/**
 * Allowlist of trusted image domains for the proxy.
 * SECURITY: Prevents SSRF attacks — only these hostnames are reachable through the proxy.
 * Add new domains here as new data sources are integrated.
 */
const ALLOWED_IMAGE_DOMAINS: string[] = [
  // Padel stores scraped by Smashly
  'www.padelnuestro.es',
  'padelnuestro.es',
  'static.padelnuestro.es',
  'cdn.padelnuestro.es',
  // Amazon product images
  'm.media-amazon.com',
  'images-na.ssl-images-amazon.com',
  'images-eu.ssl-images-amazon.com',
  'i5.walmartimages.com',
  // Other common padel stores
  'www.decathlon.es',
  'contents.mediadecathlon.com',
  'www.jdsports.es',
  'static.jdsports.es',
  'www.totalpadel.es',
  'www.padelzoom.es',
  'www.padelmarket.com',
  'cdn.padelmarket.com',
  // Google CDN (for user avatars via Google OAuth)
  'lh3.googleusercontent.com',
  // Supabase storage
  'supabase.co',
];

/**
 * Proxy endpoint for fetching images from external sources.
 * This solves CORS issues when trying to load images in PDFs.
 * SECURITY: Only domains in ALLOWED_IMAGE_DOMAINS are accessible.
 */
router.get('/image', async (req: Request, res: Response) => {
  try {
    const imageUrl = req.query.url as string;

    if (!imageUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL structure
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }

    // SECURITY: Enforce HTTPS and domain allowlist to prevent SSRF
    if (parsedUrl.protocol !== 'https:') {
      logger.warn(`Proxy blocked non-HTTPS URL: ${imageUrl}`);
      return res.status(403).json({ error: 'Only HTTPS URLs are allowed' });
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (!ALLOWED_IMAGE_DOMAINS.includes(hostname)) {
      logger.warn(`Proxy blocked disallowed domain: ${hostname}`);
      return res.status(403).json({
        error: 'Domain not allowed',
        message: `Image domain '${hostname}' is not in the allowed list`,
      });
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
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    });

    // Remove CSP for the image proxy to avoid interference with the parent page
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Content-Security-Policy');
    res.removeHeader('X-WebKit-CSP');

    return res.send(response.data);
  } catch (error: any) {
    logger.error('Error proxying image:', error);

    if (error.response) {
      return res.status(error.response.status).json({
        error: 'Failed to fetch image from source',
      });
    }

    return res.status(500).json({ error: 'Internal server error while fetching image' });
  }
});

export default router;
