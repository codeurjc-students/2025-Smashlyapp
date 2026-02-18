import { ReviewController } from '../../controllers/reviewController';
import { ReviewService } from '../../services/reviewService';
import type { Request, Response } from 'express';

vi.mock('../../services/reviewService', () => ({
  ReviewService: {
    getReviewsByRacket: vi.fn(),
    getReviewsByUser: vi.fn(),
    getReviewById: vi.fn(),
    createReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
    toggleLike: vi.fn(),
    addComment: vi.fn(),
    getComments: vi.fn(),
    deleteComment: vi.fn(),
  },
}));

function createMockReq(overrides: any = {}): any {
  return {
    params: {},
    query: {},
    body: {},
    user: undefined,
    ...overrides,
  };
}

function createMockRes(): Partial<Response> & { body?: any; statusCode: number } {
  const res: any = {};
  res.statusCode = 200;
  res.status = vi.fn((code: number) => { res.statusCode = code; return res; });
  res.json = vi.fn((payload: any) => { res.body = payload; return res; });
  res.send = vi.fn(() => res);
  return res;
}

describe('ReviewController.getReviewsByRacket', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns reviews with default filters', async () => {
    (ReviewService.getReviewsByRacket as vi.Mock).mockResolvedValueOnce({ items: [], page: 1, total: 0 });
    const req = createMockReq({ params: { racketId: '10' }, query: {} });
    const res = createMockRes();
    await ReviewController.getReviewsByRacket(req as any, res as Response);
    expect(ReviewService.getReviewsByRacket).toHaveBeenCalledWith(10, { rating: undefined, sort: 'recent', page: 1, limit: 5 }, undefined);
    expect(res.statusCode).toBe(200);
  });
});

describe('ReviewController.getReviewsByUser', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns reviews for user with pagination', async () => {
    (ReviewService.getReviewsByUser as vi.Mock).mockResolvedValueOnce({ items: [], page: 2, total: 0 });
    const req = createMockReq({ params: { userId: 'u1' }, query: { page: '2', limit: '10' } });
    const res = createMockRes();
    await ReviewController.getReviewsByUser(req as Request, res as Response);
    expect(ReviewService.getReviewsByUser).toHaveBeenCalledWith('u1', 2, 10);
    expect(res.statusCode).toBe(200);
  });
});

describe('ReviewController.getReviewById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 if review not found', async () => {
    (ReviewService.getReviewById as vi.Mock).mockResolvedValueOnce(null);
    const req = createMockReq({ params: { reviewId: 'r1' }, user: { id: 'u1' } });
    const res = createMockRes();
    await ReviewController.getReviewById(req as any, res as Response);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Review no encontrada');
  });

  it('returns review when found', async () => {
    (ReviewService.getReviewById as vi.Mock).mockResolvedValueOnce({ id: 'r1', title: 'Nice' });
    const req = createMockReq({ params: { reviewId: 'r1' }, user: { id: 'u1' } });
    const res = createMockRes();
    await ReviewController.getReviewById(req as any, res as Response);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 'r1', title: 'Nice' });
  });
});

describe('ReviewController.createReview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 if unauthenticated', async () => {
    const req = createMockReq({ body: {} });
    const res = createMockRes();
    await ReviewController.createReview(req as any, res as Response);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('No autenticado');
  });

  it('returns 400 if validation fails (missing fields)', async () => {
    const req = createMockReq({ user: { id: 'u1' }, body: { title: 'abc', content: 'short', rating: 0 } });
    const res = createMockRes();
    await ReviewController.createReview(req as any, res as Response);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 201 on successful creation', async () => {
    (ReviewService.createReview as vi.Mock).mockResolvedValueOnce({ id: 'r2' });
    const req = createMockReq({ user: { id: 'u1' }, body: { racket_id: 1, title: 'Great Review', content: 'This is a very detailed review content...', rating: 5 } });
    const res = createMockRes();
    await ReviewController.createReview(req as any, res as Response);
    expect(ReviewService.createReview).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id: 'r2' });
  });

  it('returns 409 when duplicate review error occurs', async () => {
    (ReviewService.createReview as vi.Mock).mockRejectedValueOnce(new Error('Ya has publicado una review para esta pala'));
    const req = createMockReq({ user: { id: 'u1' }, body: { racket_id: 1, title: 'Great Review', content: 'This is a very detailed review content...', rating: 5 } });
    const res = createMockRes();
    await ReviewController.createReview(req as any, res as Response);
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toContain('Ya has publicado');
  });
});

describe('ReviewController.updateReview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 if unauthenticated', async () => {
    const req = createMockReq({ params: { reviewId: 'r1' }, body: { title: 'Updated Title' } });
    const res = createMockRes();
    await ReviewController.updateReview(req as any, res as Response);
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 on invalid updates', async () => {
    const req = createMockReq({ user: { id: 'u1' }, params: { reviewId: 'r1' }, body: { title: 'x' } });
    const res = createMockRes();
    await ReviewController.updateReview(req as any, res as Response);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Title must be between 5 and 100 characters');
  });

  it('returns 200 on successful update', async () => {
    (ReviewService.updateReview as vi.Mock).mockResolvedValueOnce({ id: 'r1', title: 'Updated Title' });
    const req = createMockReq({ user: { id: 'u1' }, params: { reviewId: 'r1' }, body: { title: 'Updated Title' } });
    const res = createMockRes();
    await ReviewController.updateReview(req as any, res as Response);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ id: 'r1', title: 'Updated Title' });
  });

  it('returns 403 when permission error occurs', async () => {
    (ReviewService.updateReview as vi.Mock).mockRejectedValueOnce(new Error('No tienes permiso'));
    const req = createMockReq({ user: { id: 'u1' }, params: { reviewId: 'r1' }, body: { content: 'Valid content long enough here...' } });
    const res = createMockRes();
    await ReviewController.updateReview(req as any, res as Response);
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('permiso');
  });
});

describe('ReviewController.deleteReview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 if unauthenticated', async () => {
    const req = createMockReq({ params: { reviewId: 'r1' } });
    const res = createMockRes();
    await ReviewController.deleteReview(req as any, res as Response);
    expect(res.statusCode).toBe(401);
  });

  it('returns 204 after delete', async () => {
    (ReviewService.deleteReview as vi.Mock).mockResolvedValueOnce(undefined);
    const req = createMockReq({ user: { id: 'u1' }, params: { reviewId: 'r1' } });
    const res = createMockRes();
    await ReviewController.deleteReview(req as any, res as Response);
    expect(ReviewService.deleteReview).toHaveBeenCalledWith('r1', 'u1');
    expect(res.statusCode).toBe(204);
  });
});

describe('ReviewController.toggleLike', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 if unauthenticated', async () => {
    const req = createMockReq({ params: { reviewId: 'r1' } });
    const res = createMockRes();
    await ReviewController.toggleLike(req as any, res as Response);
    expect(res.statusCode).toBe(401);
  });

  it('returns liked state', async () => {
    (ReviewService.toggleLike as vi.Mock).mockResolvedValueOnce(true);
    const req = createMockReq({ user: { id: 'u1' }, params: { reviewId: 'r1' } });
    const res = createMockRes();
    await ReviewController.toggleLike(req as any, res as Response);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ liked: true });
  });
});

describe('ReviewController.comments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('addComment validates content length', async () => {
    const req = createMockReq({ user: { id: 'u1' }, params: { reviewId: 'r1' }, body: { content: '' } });
    const res = createMockRes();
    await ReviewController.addComment(req as any, res as Response);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('El comentario debe tener entre 1 y 500 caracteres');
  });

  it('addComment returns 201 on success', async () => {
    (ReviewService.addComment as vi.Mock).mockResolvedValueOnce({ id: 'c1', content: 'Nice!' });
    const req = createMockReq({ user: { id: 'u1' }, params: { reviewId: 'r1' }, body: { content: 'Nice!' } });
    const res = createMockRes();
    await ReviewController.addComment(req as any, res as Response);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id: 'c1', content: 'Nice!' });
  });

  it('getComments returns list', async () => {
    (ReviewService.getComments as vi.Mock).mockResolvedValueOnce([{ id: 'c1' }]);
    const req = createMockReq({ params: { reviewId: 'r1' } });
    const res = createMockRes();
    await ReviewController.getComments(req as Request, res as Response);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 'c1' }]);
  });

  it('deleteComment returns 204', async () => {
    (ReviewService.deleteComment as vi.Mock).mockResolvedValueOnce(undefined);
    const req = createMockReq({ user: { id: 'u1' }, params: { commentId: 'c1' } });
    const res = createMockRes();
    await ReviewController.deleteComment(req as any, res as Response);
    expect(ReviewService.deleteComment).toHaveBeenCalledWith('c1', 'u1');
    expect(res.statusCode).toBe(204);
  });
});