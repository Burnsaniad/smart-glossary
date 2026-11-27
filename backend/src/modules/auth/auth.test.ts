import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express from 'express';
import cookieParser from 'cookie-parser';
import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '../../config/env.js';
import { errorHandler } from '../../middlewares/errorHandler.js';
import { notFoundHandler } from '../../middlewares/notFound.js';
import { UserRole, UserStatus } from '../../generated/prisma/index.js';
import {
  requireAuthentication,
  requireRoles,
  requireShopAccess,
  requireShopOwner,
} from './auth.middleware.js';
import { authRouter } from './auth.routes.js';

const dbMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock('../../lib/db.js', () => ({
  getPrisma: () => ({
    user: {
      findUnique: dbMocks.findUnique,
      create: dbMocks.create,
    },
    shop: {
      findUnique: dbMocks.findUnique,
    },
    shopStaff: {
      findUnique: dbMocks.findUnique,
    },
  }),
}));

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use('/api/v1/auth', authRouter);

  app.get('/test/admin', requireAuthentication(), requireRoles(UserRole.ADMIN), (_req, res) => {
    res.json({ success: true });
  });
  app.get('/test/shop-owner/:shopId', requireAuthentication(), requireShopOwner(), (_req, res) => {
    res.json({ success: true });
  });
  app.get(
    '/test/shop-access/:shopId',
    requireAuthentication(),
    requireShopAccess(),
    (_req, res) => {
      res.json({ success: true });
    },
  );

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

function createToken(id: string, role: UserRole, status = UserStatus.ACTIVE): string {
  const payload: Record<string, unknown> = { sub: id, role, status };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
}

describe('authentication', () => {
  beforeEach(() => {
    dbMocks.findUnique.mockReset();
    dbMocks.create.mockReset();
  });

  it('registers a customer and never accepts a client role', async () => {
    dbMocks.create.mockImplementation((args: { data: Record<string, unknown> }) => ({
      id: 'customer-1',
      name: args.data.name,
      email: args.data.email,
      role: args.data.role,
      status: args.data.status,
    }));

    const res = await supertest(createTestApp()).post('/api/v1/auth/register').send({
      name: 'Test Customer',
      email: 'Customer@Example.com',
      phone: '01700000000',
      password: 'Secure123',
      role: 'ADMIN',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe(UserRole.CUSTOMER);
    expect(res.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(dbMocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: UserRole.CUSTOMER }),
      }),
    );
  });

  it('rejects duplicate customer accounts', async () => {
    dbMocks.create.mockRejectedValue({ code: 'P2002' });

    const res = await supertest(createTestApp()).post('/api/v1/auth/register').send({
      name: 'Test Customer',
      email: 'duplicate@example.com',
      password: 'Secure123',
    });

    expect(res.status).toBe(409);
  });

  it('logs in valid active users and exposes /me', async () => {
    const passwordHash = await bcrypt.hash('Secure123', 4);
    dbMocks.findUnique.mockResolvedValue({
      id: 'customer-1',
      name: 'Test Customer',
      email: 'customer@example.com',
      passwordHash,
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });

    const agent = supertest.agent(createTestApp());
    const login = await agent.post('/api/v1/auth/login').send({
      email: 'customer@example.com',
      password: 'Secure123',
    });

    expect(login.status).toBe(200);
    expect(login.body.data.user).not.toHaveProperty('passwordHash');

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.id).toBe('customer-1');
  });

  it('rejects invalid passwords without revealing account details', async () => {
    dbMocks.findUnique.mockResolvedValue({
      id: 'customer-1',
      name: 'Test Customer',
      email: 'customer@example.com',
      passwordHash: await bcrypt.hash('OtherPassword123', 4),
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });

    const res = await supertest(createTestApp())
      .post('/api/v1/auth/login')
      .send({ email: 'customer@example.com', password: 'Secure123' });

    expect(res.status).toBe(401);
  });

  it('rejects suspended accounts', async () => {
    dbMocks.findUnique.mockResolvedValue({
      id: 'customer-1',
      name: 'Test Customer',
      email: 'customer@example.com',
      passwordHash: await bcrypt.hash('Secure123', 4),
      role: UserRole.CUSTOMER,
      status: UserStatus.SUSPENDED,
    });

    const res = await supertest(createTestApp())
      .post('/api/v1/auth/login')
      .send({ email: 'customer@example.com', password: 'Secure123' });

    expect(res.status).toBe(401);
  });

  it('requires authentication for protected endpoints', async () => {
    const res = await supertest(createTestApp()).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('enforces role authorization', async () => {
    dbMocks.findUnique.mockResolvedValue({
      id: 'customer-1',
      name: 'Test Customer',
      email: 'customer@example.com',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });

    const token = createToken('customer-1', UserRole.CUSTOMER);
    const res = await supertest(createTestApp())
      .get('/test/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows an authorized admin role', async () => {
    dbMocks.findUnique.mockResolvedValue({
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    const token = createToken('admin-1', UserRole.ADMIN);
    const res = await supertest(createTestApp())
      .get('/test/admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('enforces shop ownership', async () => {
    dbMocks.findUnique
      .mockResolvedValueOnce({
        id: 'owner-1',
        name: 'Owner',
        email: 'owner@example.com',
        role: UserRole.SHOP_OWNER,
        status: UserStatus.ACTIVE,
      })
      .mockResolvedValueOnce({ ownerId: 'another-owner' });

    const token = createToken('owner-1', UserRole.SHOP_OWNER);
    const res = await supertest(createTestApp())
      .get('/test/shop-owner/shop-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows staff only for their assigned shop', async () => {
    dbMocks.findUnique
      .mockResolvedValueOnce({
        id: 'staff-1',
        name: 'Staff',
        email: 'staff@example.com',
        role: UserRole.SHOP_STAFF,
        status: UserStatus.ACTIVE,
      })
      .mockResolvedValueOnce({ shopId: 'shop-1' });

    const token = createToken('staff-1', UserRole.SHOP_STAFF);
    const res = await supertest(createTestApp())
      .get('/test/shop-access/shop-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('rejects staff access outside their assigned shop', async () => {
    dbMocks.findUnique
      .mockResolvedValueOnce({
        id: 'staff-1',
        name: 'Staff',
        email: 'staff@example.com',
        role: UserRole.SHOP_STAFF,
        status: UserStatus.ACTIVE,
      })
      .mockResolvedValueOnce({ shopId: 'shop-2' });

    const token = createToken('staff-1', UserRole.SHOP_STAFF);
    const res = await supertest(createTestApp())
      .get('/test/shop-access/shop-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('clears the access cookie on logout', async () => {
    dbMocks.findUnique.mockResolvedValue({
      id: 'customer-1',
      name: 'Test Customer',
      email: 'customer@example.com',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
    });
    const token = createToken('customer-1', UserRole.CUSTOMER);

    const res = await supertest(createTestApp())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.loggedOut).toBe(true);
  });
});
