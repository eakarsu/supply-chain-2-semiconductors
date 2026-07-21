const crypto = require('crypto');

class DomainError extends Error {
  constructor(status, code, message, details) {
    super(message); this.name = 'DomainError'; this.status = status; this.code = code; this.details = details;
  }
}

const canonicalize = value => {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') return Object.keys(value).sort().reduce((out, key) => { out[key] = canonicalize(value[key]); return out; }, {});
  return value;
};
const checksum = value => crypto.createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
const id = () => crypto.randomUUID();
const text = (value, label, max = 255) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || normalized.length > max || /[\u0000-\u001f\u007f]/.test(normalized)) throw new DomainError(400, 'VALIDATION_ERROR', `${label} is required and must be at most ${max} characters`);
  return normalized;
};
const number = (value, label, { min = 0, max = Number.MAX_SAFE_INTEGER, positive = false } = {}) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max || (positive && parsed <= 0)) throw new DomainError(400, 'VALIDATION_ERROR', `${label} is outside its allowed range`);
  return parsed;
};
const integer = (value, label, options) => {
  const parsed = number(value, label, options);
  if (!Number.isInteger(parsed)) throw new DomainError(400, 'VALIDATION_ERROR', `${label} must be an integer`);
  return parsed;
};
const timestamp = (value, label) => {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) throw new DomainError(400, 'VALIDATION_ERROR', `${label} must be an ISO-8601 timestamp`);
  return parsed;
};
const oneOf = (value, label, allowed) => {
  const normalized = text(value, label, 80).toUpperCase();
  if (!allowed.includes(normalized)) throw new DomainError(400, 'VALIDATION_ERROR', `${label} must be one of ${allowed.join(', ')}`);
  return normalized;
};
const uuid = (value, label = 'id') => {
  const normalized = text(value, label, 36).toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)) throw new DomainError(400, 'VALIDATION_ERROR', `${label} must be a UUID`);
  return normalized;
};

module.exports = { DomainError, canonicalize, checksum, id, integer, number, oneOf, text, timestamp, uuid };
