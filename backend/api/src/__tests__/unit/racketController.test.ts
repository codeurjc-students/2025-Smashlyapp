import { RacketController } from '../../controllers/racketController';
import { RacketService } from '../../services/racketService';
import type { Request, Response } from 'express';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../services/racketService', () => ({
  RacketService: {
    getAllRackets: vi.fn(),
    getRacketsWithPagination: vi.fn(),
    getRacketById: vi.fn(),
    searchRackets: vi.fn(),
    getFilteredRackets: vi.fn(),
    getRacketsByBrand: vi.fn(),
    getBestsellerRackets: vi.fn(),
    getRacketsOnSale: vi.fn(),
    getBrands: vi.fn(),
    getStats: vi.fn(),
  },
}));

const mockRackets = [
  { id: 1, name: 'Alpha', brand: 'BrandA' },
  { id: 2, name: 'Beta', brand: 'BrandB' },
] as any[];

function createMockReq(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    params: {},
    query: {},
    ...overrides,
  } as Partial<Request>;
}

function createMockRes(): Partial<Response> & { body?: any; statusCode: number } {
  const res: any = {};
  res.statusCode = 200;
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((payload: any) => {
    res.body = payload;
    return res;
  });
  res.send = vi.fn(() => res);
  return res;
}

describe('RacketController.getAllRackets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all rackets when not paginated', async () => {
    (RacketService.getAllRackets as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRackets);

    const req = createMockReq({ query: { paginated: 'false' } });
    const res = createMockRes();

    await RacketController.getAllRackets(req as Request, res as Response);

    expect(RacketService.getAllRackets).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual(mockRackets);
  });

  it('returns paginated data when paginated=true', async () => {
    const paginated = { items: mockRackets, total: 2, page: 1, limit: 50 };
    (RacketService.getRacketsWithPagination as ReturnType<typeof vi.fn>).mockResolvedValueOnce(paginated);

    const req = createMockReq({ query: { paginated: 'true', page: '1', limit: '50' } });
    const res = createMockRes();

    await RacketController.getAllRackets(req as Request, res as Response);

    expect(RacketService.getRacketsWithPagination).toHaveBeenCalledWith(1, 50);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(paginated);
  });
});

describe('RacketController.getRacketById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 on invalid id', async () => {
    const req = createMockReq({ params: { id: 'abc' } });
    const res = createMockRes();

    await RacketController.getRacketById(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid ID');
  });

  it('returns 404 when racket not found', async () => {
    (RacketService.getRacketById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const req = createMockReq({ params: { id: '99' } });
    const res = createMockRes();

    await RacketController.getRacketById(req as Request, res as Response);

    expect(RacketService.getRacketById).toHaveBeenCalledWith(99);
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Pala no encontrada');
  });

  it('returns 200 with racket data when found', async () => {
    (RacketService.getRacketById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRackets[0]);
    const req = createMockReq({ params: { id: '1' } });
    const res = createMockRes();

    await RacketController.getRacketById(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(mockRackets[0]);
  });
});

describe('RacketController.searchRackets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for short query', async () => {
    const req = createMockReq({ query: { q: 'a' } });
    const res = createMockRes();

    await RacketController.searchRackets(req as Request, res as Response);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Invalid query');
  });

  it('returns matched rackets', async () => {
    (RacketService.searchRackets as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRackets);
    const req = createMockReq({ query: { q: 'ab' } });
    const res = createMockRes();

    await RacketController.searchRackets(req as Request, res as Response);

    expect(RacketService.searchRackets).toHaveBeenCalledWith('ab');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(mockRackets);
  });
});

describe('RacketController.getFilteredRackets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds filters and sort and returns paginated result', async () => {
    const paginated = { items: mockRackets, total: 2, page: 0, limit: 50 };
    (RacketService.getFilteredRackets as ReturnType<typeof vi.fn>).mockResolvedValueOnce(paginated);
    const req = createMockReq({
      query: {
        brand: 'BrandA',
        shape: 'round',
        balance: 'medium',
        level: 'intermediate',
        min_price: '100',
        max_price: '200',
        on_sale: 'true',
        bestseller: 'false',
        sortBy: 'price',
        sortOrder: 'desc',
        page: '0',
        limit: '50',
      },
    });
    const res = createMockRes();

    await RacketController.getFilteredRackets(req as Request, res as Response);

    expect(RacketService.getFilteredRackets).toHaveBeenCalledWith(
      {
        brand: 'BrandA',
        shape: 'round',
        balance: 'medium',
        game_level: 'intermediate',
        min_price: 100,
        max_price: 200,
        on_offer: true,
        is_bestseller: false,
      },
      { field: 'price', order: 'desc' },
      0,
      50,
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(paginated);
  });
});

describe('RacketController.brand and lists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRacketsByBrand returns 400 if brand missing', async () => {
    const req = createMockReq({ params: { brand: '' } });
    const res = createMockRes();
    await RacketController.getRacketsByBrand(req as Request, res as Response);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Brand required');
  });

  it('getRacketsByBrand returns rackets for brand', async () => {
    (RacketService.getRacketsByBrand as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRackets);
    const req = createMockReq({ params: { brand: 'BrandA' } });
    const res = createMockRes();
    await RacketController.getRacketsByBrand(req as Request, res as Response);
    expect(RacketService.getRacketsByBrand).toHaveBeenCalledWith('BrandA');
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(mockRackets);
  });

  it('getBestsellerRackets returns list', async () => {
    (RacketService.getBestsellerRackets as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRackets);
    const req = createMockReq();
    const res = createMockRes();
    await RacketController.getBestsellerRackets(req as Request, res as Response);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(mockRackets);
  });

  it('getRacketsOnSale returns list', async () => {
    (RacketService.getRacketsOnSale as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockRackets);
    const req = createMockReq();
    const res = createMockRes();
    await RacketController.getRacketsOnSale(req as Request, res as Response);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(mockRackets);
  });

  it('getBrands returns list of brands', async () => {
    (RacketService.getBrands as ReturnType<typeof vi.fn>).mockResolvedValueOnce(['BrandA', 'BrandB']);
    const req = createMockReq();
    const res = createMockRes();
    await RacketController.getBrands(req as Request, res as Response);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual(['BrandA', 'BrandB']);
  });

  it('getStats returns stats object', async () => {
    (RacketService.getStats as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ total: 10 });
    const req = createMockReq();
    const res = createMockRes();
    await RacketController.getStats(req as Request, res as Response);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({ total: 10 });
  });
});
