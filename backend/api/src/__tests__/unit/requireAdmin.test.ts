import { requireAdmin } from '../../middleware/auth';
import type { Response, NextFunction } from 'express';
import type { RequestWithUser } from '../../types';

function createMockRes(): Partial<Response> & { body?: any; statusCode: number } {
  const res: any = {};
  res.statusCode = 200;
  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((payload: any) => {
    res.body = payload;
    return res;
  });
  return res;
}

describe('requireAdmin middleware', () => {
  it('returns 401 when user is not authenticated', () => {
    const req = { user: undefined } as RequestWithUser;
    const res = createMockRes();
    const next: NextFunction = jest.fn();

    requireAdmin(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Autenticación requerida');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user is not admin', () => {
    const req = { user: { id: 'u1', email: 'user@test.com', role: 'player' } } as RequestWithUser;
    const res = createMockRes();
    const next: NextFunction = jest.fn();

    requireAdmin(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Acceso denegado');
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when user is admin', () => {
    const req = { user: { id: 'u1', email: 'admin@test.com', role: 'admin' } } as RequestWithUser;
    const res = createMockRes();
    const next: NextFunction = jest.fn();

    requireAdmin(req, res as Response, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});