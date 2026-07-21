const runtime = require('../../src/runtime');

const original = { ...process.env };
afterEach(() => { for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key]; Object.assign(process.env, original); });

test('authoritative bindings reject a source outside its domain', () => {
  process.env.AUTHORITATIVE_SOURCE_BINDINGS = 'erp:INVENTORY|WORK_ORDER';
  expect(() => runtime.assertSourceDomain('erp', 'INVENTORY')).not.toThrow();
  expect(() => runtime.assertSourceDomain('erp', 'QUALITY')).toThrow(/not authoritative/);
});

test('production rejects wildcard CORS and missing source bindings', () => {
  Object.assign(process.env, { NODE_ENV: 'production', DATABASE_URL: 'postgresql://invalid', JWT_SECRET: 'a'.repeat(32), CORS_ORIGINS: '*', AUTHORITATIVE_SOURCE_BINDINGS: '' });
  expect(() => runtime.validateRuntime()).toThrow(/explicit production origins/);
});

test('startup fails closed if a legacy AI or demo switch is enabled', () => {
  Object.assign(process.env, { NODE_ENV: 'test', JWT_SECRET: 'a'.repeat(32), ENABLE_AI: 'true', ENABLE_DEMO_ROUTES: 'false' });
  expect(() => runtime.validateRuntime()).toThrow(/unsupported/);
});
