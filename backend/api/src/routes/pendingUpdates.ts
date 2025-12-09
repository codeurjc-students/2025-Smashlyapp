import { Router, Response } from 'express';
import { RequestWithUser } from '../types';
import { authenticateUser } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import * as pendingUpdatesService from '../services/pendingUpdatesService';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

/**
 * GET /api/v1/pending-updates
 * Get all pending updates with optional filters
 */
router.get('/', async (req: RequestWithUser, res: Response) => {
  try {
    const { status, action_type, limit, offset } = req.query;

    const updates = await pendingUpdatesService.getPendingUpdates({
      status: status as string,
      action_type: action_type as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(updates);
  } catch (error: any) {
    console.error('Error fetching pending updates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/pending-updates/counts
 * Get counts of pending updates by status
 */
router.get('/counts', async (req: RequestWithUser, res: Response) => {
  try {
    const counts = await pendingUpdatesService.getPendingUpdatesCounts();
    res.json(counts);
  } catch (error: any) {
    console.error('Error fetching pending updates counts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/v1/pending-updates/:id
 * Update pending update's proposed data
 */
router.patch('/:id', async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const { proposed_data } = req.body;

    if (!proposed_data) {
      return res.status(400).json({ error: 'proposed_data is required' });
    }

    const updatedUpdate = await pendingUpdatesService.updatePendingUpdateData(
      parseInt(id),
      proposed_data
    );

    res.json({
      success: true,
      message: 'Pending update modified successfully',
      data: updatedUpdate,
    });
  } catch (error: any) {
    console.error('Error updating pending update:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/pending-updates/:id/approve
 * Approve a pending update
 */
router.post('/:id/approve', async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user!.id;

    const result = await pendingUpdatesService.approvePendingUpdate(parseInt(id), adminId, notes);

    res.json(result);
  } catch (error: any) {
    console.error('Error approving pending update:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/pending-updates/:id/reject
 * Reject a pending update
 */
router.post('/:id/reject', async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user!.id;

    const result = await pendingUpdatesService.rejectPendingUpdate(parseInt(id), adminId, notes);

    res.json(result);
  } catch (error: any) {
    console.error('Error rejecting pending update:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/pending-updates/merge-suggestions
 * Get merge suggestions
 */
router.get('/merge-suggestions', async (req: RequestWithUser, res: Response) => {
  try {
    const { status, limit } = req.query;

    const suggestions = await pendingUpdatesService.getMergeSuggestions({
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(suggestions);
  } catch (error: any) {
    console.error('Error fetching merge suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/pending-updates/merge-suggestions/:id/approve
 * Approve a merge suggestion
 */
router.post('/merge-suggestions/:id/approve', async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user!.id;

    const result = await pendingUpdatesService.approveMergeSuggestion(parseInt(id), adminId, notes);

    res.json(result);
  } catch (error: any) {
    console.error('Error approving merge suggestion:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/pending-updates/merge-suggestions/:id/reject
 * Reject a merge suggestion (keep rackets separate)
 */
router.post('/merge-suggestions/:id/reject', async (req: RequestWithUser, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user!.id;

    const result = await pendingUpdatesService.rejectMergeSuggestion(parseInt(id), adminId, notes);

    res.json(result);
  } catch (error: any) {
    console.error('Error rejecting merge suggestion:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/pending-updates/scraper-executions
 * Get scraper execution logs
 */
router.get('/scraper-executions', async (req: RequestWithUser, res: Response) => {
  try {
    const { limit } = req.query;

    const executions = await pendingUpdatesService.getScraperExecutions(
      limit ? parseInt(limit as string) : 10
    );

    res.json(executions);
  } catch (error: any) {
    console.error('Error fetching scraper executions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/pending-updates/scraper-executions/latest
 * Get latest scraper execution
 */
router.get('/scraper-executions/latest', async (req: RequestWithUser, res: Response) => {
  try {
    const execution = await pendingUpdatesService.getLatestScraperExecution();
    res.json(execution);
  } catch (error: any) {
    console.error('Error fetching latest scraper execution:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
