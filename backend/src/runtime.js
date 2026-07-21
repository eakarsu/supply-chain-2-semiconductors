const { DomainError } = require('./domain');

const required = (name, min = 1) => {
  const value = process.env[name]?.trim();
  if (!value || value.length < min) throw new Error(`${name} is required and must contain at least ${min} characters`);
  return value;
};
const list = (name) => (process.env[name] || '').split(',').map(value => value.trim()).filter(Boolean);
const numeric = (name, fallback, min, max) => {
  const value = process.env[name] == null ? fallback : Number(process.env[name]);
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${name} must be between ${min} and ${max}`);
  return value;
};

const parseBindings = () => {
  const bindings = new Map();
  for (const entry of list('AUTHORITATIVE_SOURCE_BINDINGS')) {
    const [source, domains] = entry.split(':');
    if (!source || !domains) throw new Error('AUTHORITATIVE_SOURCE_BINDINGS entries must use source:DOMAIN|DOMAIN');
    bindings.set(source, new Set(domains.split('|').map(value => value.trim().toUpperCase()).filter(Boolean)));
  }
  return bindings;
};

const validateRuntime = () => {
  required('JWT_SECRET', 32);
  if (process.env.NODE_ENV === 'production') {
    required('DATABASE_URL');
    const origins = list('CORS_ORIGINS');
    if (!origins.length || origins.includes('*')) throw new Error('CORS_ORIGINS must contain explicit production origins');
    if (!parseBindings().size) throw new Error('AUTHORITATIVE_SOURCE_BINDINGS is required in production');
  }
  if (process.env.ENABLE_AI === 'true' || process.env.ENABLE_DEMO_ROUTES === 'true') throw new Error('AI and demo routes are unsupported by the traceability release');
};

const assertSourceDomain = (source, domain) => {
  const bindings = parseBindings();
  if (!bindings.get(source)?.has(domain)) throw new DomainError(403, 'SOURCE_DOMAIN_NOT_AUTHORIZED', `${source} is not authoritative for ${domain}`);
};

module.exports = {
  assertSourceDomain, list, numeric, parseBindings, validateRuntime,
  maxTelemetryAgeSeconds: () => numeric('MAX_TELEMETRY_AGE_SECONDS', 300, 1, 86400),
  maxSourceFutureSeconds: () => numeric('MAX_SOURCE_FUTURE_SECONDS', 300, 0, 3600),
  maxPlanningInputAgeSeconds: () => numeric('MAX_PLANNING_INPUT_AGE_SECONDS', 86400, 60, 2592000),
};
