import { AuthController } from '../../controllers/authController';
import type { Request, Response } from 'express';

// Mock Supabase SDK used by the controller
jest.mock('../../config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Access the mocked supabase to control behaviors in tests
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { supabase } = require('../../config/supabase');

function createMockReq(body: any = {}, headers: Record<string, string> = {}): Partial<Request> {
  return { body, headers };
}

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

describe('AuthController.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when credentials are missing', async () => {
    const req = createMockReq({});
    const res = createMockRes();

    await AuthController.login(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Credentials required');
    expect(res.body.message).toBe('Email and password are required');
  });

  it('returns 401 when Supabase reports invalid credentials', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new Error('Invalid credentials'),
    });

    const req = createMockReq({ email: 'user@test.com', password: 'bad' });
    const res = createMockRes();

    await AuthController.login(req as Request, res as Response);

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'user@test.com', password: 'bad' });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid credentials');
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('returns 200 with tokens on successful login', async () => {
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: {
        user: { id: 'u1', email: 'user@test.com' },
        session: { access_token: 'at', refresh_token: 'rt', expires_at: 12345 },
      },
      error: null,
    });

    const req = createMockReq({ email: 'user@test.com', password: 'secret' });
    const res = createMockRes();

    await AuthController.login(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.access_token).toBe('at');
    expect(res.body.data.refresh_token).toBe('rt');
    expect(res.body.data.expires_at).toBe(12345);
  });
});

describe('AuthController.register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when required data is missing', async () => {
    const req = createMockReq({ nickname: 'nick' });
    const res = createMockRes();

    await AuthController.register(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Required data');
    expect(res.body.message).toBe('Email and password are required');
  });

  it('returns 400 when Supabase signUp fails', async () => {
    supabase.auth.signUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: new Error('signup fail') });
    const req = createMockReq({ email: 'u@test.com', password: 'pw', nickname: 'nick', full_name: 'User' });
    const res = createMockRes();

    await AuthController.register(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Error registering user');
    expect(res.body.message).toBe('signup fail');
  });

  it('returns 400 when Supabase signUp returns no user', async () => {
    supabase.auth.signUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: null });
    const req = createMockReq({ email: 'u@test.com', password: 'pw', nickname: 'nick', full_name: 'User' });
    const res = createMockRes();

    await AuthController.register(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Error al crear usuario');
    expect(res.body.message).toBe('No se pudo crear el usuario');
  });

  it('returns 201 with session tokens when signUp provides access token', async () => {
    // Mock DB chain for profile creation
    const insert = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null }) }) });
    supabase.from.mockReturnValue({ insert });

    supabase.auth.signUp.mockResolvedValueOnce({
      data: {
        user: { id: 'u1', email: 'u@test.com', user_metadata: { nickname: 'nick', full_name: 'User' } },
        session: { access_token: 'at', refresh_token: 'rt', expires_at: 111 },
      },
      error: null,
    });

    const req = createMockReq({ email: 'u@test.com', password: 'pw', nickname: 'nick', full_name: 'User' });
    const res = createMockRes();

    await AuthController.register(req as Request, res as Response);

    expect(supabase.from).toHaveBeenCalledWith('user_profiles');
    expect(insert).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.access_token).toBe('at');
    expect(res.body.data.session.refresh_token).toBe('rt');
    expect(res.body.data.session.expires_at).toBe(111);
  });

  it('auto-logins when signUp session lacks access token', async () => {
    // Mock DB chain for profile creation
    const select = jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'u1' }, error: null }) });
    const insert = jest.fn().mockReturnValue({ select });
    supabase.from.mockReturnValue({ insert });

    // signUp returns user but no access_token
    supabase.auth.signUp.mockResolvedValueOnce({
      data: {
        user: { id: 'u1', email: 'u@test.com', user_metadata: { nickname: 'nick', full_name: 'User' } },
        session: { access_token: undefined },
      },
      error: null,
    });

    // auto login returns session
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: { access_token: 'auto-at', refresh_token: 'auto-rt', expires_at: 222 } },
      error: null,
    });

    const req = createMockReq({ email: 'u@test.com', password: 'pw', nickname: 'nick', full_name: 'User' });
    const res = createMockRes();

    await AuthController.register(req as Request, res as Response);

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'u@test.com', password: 'pw' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.access_token).toBe('auto-at');
    expect(res.body.data.session.refresh_token).toBe('auto-rt');
    expect(res.body.data.session.expires_at).toBe(222);
  });
});

describe('AuthController.logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when supabase signOut fails', async () => {
    supabase.auth.signOut.mockResolvedValueOnce({ error: new Error('Oops') });
    const req = createMockReq();
    const res = createMockRes();

    await AuthController.logout(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Error al cerrar sesión');
    expect(res.body.message).toBe('Oops');
  });

  it('returns 200 when signOut succeeds', async () => {
    supabase.auth.signOut.mockResolvedValueOnce({ error: null });
    const req = createMockReq();
    const res = createMockRes();

    await AuthController.logout(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Sesión cerrada exitosamente');
  });
});

describe('AuthController.refreshToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when refresh_token is missing', async () => {
    const req = createMockReq({});
    const res = createMockRes();

    await AuthController.refreshToken(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Token de refresco requerido');
    expect(res.body.message).toBe('refresh_token es requerido');
  });

  it('returns 401 when Supabase fails to refresh', async () => {
    supabase.auth.refreshSession.mockResolvedValueOnce({
      data: { session: null },
      error: new Error('bad token'),
    });

    const req = createMockReq({ refresh_token: 'rt' });
    const res = createMockRes();

    await AuthController.refreshToken(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Token inválido');
    expect(res.body.message).toBe('bad token');
  });

  it('returns 200 with new tokens on success', async () => {
    supabase.auth.refreshSession.mockResolvedValueOnce({
      data: { session: { access_token: 'new-at', refresh_token: 'new-rt', expires_at: 99999 } },
      error: null,
    });

    const req = createMockReq({ refresh_token: 'rt' });
    const res = createMockRes();

    await AuthController.refreshToken(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.access_token).toBe('new-at');
    expect(res.body.data.refresh_token).toBe('new-rt');
    expect(res.body.data.expires_at).toBe(99999);
  });
});

describe('AuthController.getCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when Authorization header missing or invalid', async () => {
    const req = createMockReq({}, {});
    const res = createMockRes();

    await AuthController.getCurrentUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Token requerido');
  });

  it('returns 401 when Supabase returns error or no user', async () => {
    supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('bad') });
    const req = createMockReq({}, { authorization: 'Bearer at' });
    const res = createMockRes();

    await AuthController.getCurrentUser(req as Request, res as Response);

    expect(supabase.auth.getUser).toHaveBeenCalledWith('at');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Token inválido');
    expect(res.body.message).toBe('bad');
  });

  it('returns 200 with user when token is valid', async () => {
    supabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1', email: 'user@test.com' } }, error: null });
    const req = createMockReq({}, { authorization: 'Bearer good-token' });
    const res = createMockRes();

    await AuthController.getCurrentUser(req as Request, res as Response);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toEqual({ id: 'u1', email: 'user@test.com' });
  });
});