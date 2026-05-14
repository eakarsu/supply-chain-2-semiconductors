const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const { entity_type, user_email, action, q, limit } = req.query;
    const conds = [];
    const params = [];
    if (entity_type) { params.push(entity_type); conds.push(`entity_type = $${params.length}`); }
    if (user_email) { params.push(user_email); conds.push(`user_email = $${params.length}`); }
    if (action) { params.push(action); conds.push(`action = $${params.length}`); }
    if (q) { params.push(`%${q}%`); conds.push(`(details ILIKE $${params.length} OR entity_type ILIKE $${params.length} OR user_email ILIKE $${params.length})`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const lim = Math.min(parseInt(limit) || 200, 1000);
    params.push(lim);
    const r = await db.query(`SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${params.length}`, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { action, entity_type, entity_id, details } = req.body;
    const ip = req.ip || '';
    const r = await db.query(
      'INSERT INTO audit_log (user_email, action, entity_type, entity_id, details, ip_address) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user?.email || 'system', action || 'manual', entity_type || null, entity_id || null, typeof details === 'string' ? details : JSON.stringify(details || {}), ip]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
