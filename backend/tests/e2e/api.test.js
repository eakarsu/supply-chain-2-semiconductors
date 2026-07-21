const bcrypt = require('bcryptjs');
const request = require('supertest');
const { createApp } = require('../../server');
const db = require('../../db');

let app; let token; let operatorToken;
beforeAll(async () => {
  app = createApp();
  const passwordHash = await bcrypt.hash('Strong-e2e-password-123', 4);
  await db.query(`INSERT INTO users (email,password_hash,name,role) VALUES ('e2e@test.invalid',$1,'E2E','admin') ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash,role='admin'`, [passwordHash]);
  await db.query(`INSERT INTO users (email,password_hash,name,role) VALUES ('operator@test.invalid',$1,'Operator','operator') ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash,role='operator'`, [passwordHash]);
});
afterAll(() => db.end());

test('login rejects bad credentials and issues a bounded token for valid credentials', async () => {
  await request(app).post('/api/auth/login').send({ email: 'e2e@test.invalid', password: 'wrong-password-value' }).expect(401);
  const response = await request(app).post('/api/auth/login').send({ email: 'e2e@test.invalid', password: 'Strong-e2e-password-123' }).expect(200);
  expect(response.body.user).toMatchObject({ email: 'e2e@test.invalid', role: 'admin' }); token = response.body.token;
  operatorToken = (await request(app).post('/api/auth/login').send({ email: 'operator@test.invalid', password: 'Strong-e2e-password-123' }).expect(200)).body.token;
});

test('health is public but control-tower data is authenticated', async () => {
  await request(app).get('/api/health').expect(200, { status: 'ok', service: 'semichain-traceability' });
  await request(app).get('/api/traceability/dashboard').expect(401);
  const response = await request(app).get('/api/traceability/dashboard').set('Authorization', `Bearer ${token}`).expect(200);
  expect(response.body).toHaveProperty('counts'); expect(response.body).toHaveProperty('sources');
});

test('unsupported generated and AI routes are absent', async () => {
  await request(app).post('/api/ai/risk-assessment').set('Authorization', `Bearer ${token}`).send({}).expect(404);
  await request(app).get('/api/admin/sample-data').set('Authorization', `Bearer ${token}`).expect(404);
});

test('least-privilege roles cannot impersonate authoritative integrations', async () => {
  const response = await request(app).post('/api/traceability/events').set('Authorization', `Bearer ${operatorToken}`).send({}).expect(403);
  expect(response.body.error.code).toBe('FORBIDDEN');
});
