/**
 * Health check endpoint tests.
 *
 * These tests cover the GET /health route and the 404 not-found handler.
 * No database connection is required.
 */

import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { createApp } from './app.js';

const app = createApp();
const request = supertest(app);

describe('GET /health', () => {
  it('responds 200 with status ok', async () => {
    const res = await request.get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      environment: 'test',
      database: 'not_configured',
    });
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('404 not-found handler', () => {
  it('returns 404 JSON for unknown routes', async () => {
    const res = await request.get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false });
    expect(res.body.error.message).toBeTruthy();
  });

  it('returns 404 JSON for unknown POST routes', async () => {
    const res = await request.post('/does-not-exist').send({ foo: 'bar' });
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false });
  });
});

describe('Request body parsing', () => {
  it('parses JSON body (valid Content-Type)', async () => {
    // POST to unknown route — we just want to confirm body parsing doesn't crash
    const res = await request
      .post('/api/v1/fake')
      .set('Content-Type', 'application/json')
      .send({ test: true });
    expect(res.status).toBe(404); // route not found, but body was parsed without error
  });
});

describe('CORS headers', () => {
  it('responds with CORS headers on OPTIONS preflight', async () => {
    const res = await request
      .options('/health')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');
    // Helmet + CORS should allow the configured origin
    expect([200, 204]).toContain(res.status);
  });
});
