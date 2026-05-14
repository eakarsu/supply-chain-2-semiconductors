const db = require('../db');

async function logAudit(req, action, entityType, entityId, details) {
  try {
    const email = req.user?.email || 'system';
    const ip = req.ip || req.connection?.remoteAddress || '';
    await db.query(
      'INSERT INTO audit_log (user_email, action, entity_type, entity_id, details, ip_address) VALUES ($1,$2,$3,$4,$5,$6)',
      [email, action, entityType, entityId || null, typeof details === 'string' ? details : JSON.stringify(details || {}), ip]
    );
  } catch (e) { /* non-fatal */ }
}

module.exports = { logAudit };
