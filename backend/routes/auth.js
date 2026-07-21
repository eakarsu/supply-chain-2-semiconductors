const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const authenticate = require('../middleware/auth');

const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: { code: 'LOGIN_RATE_LIMITED', message: 'Too many sign-in attempts' } }) });

router.post('/login', loginLimit, async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || password.length < 12 || password.length > 200) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
    const result = await db.query('SELECT id,email,password_hash,name,role FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    const valid = user && await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { algorithm: 'HS256', issuer: 'semichain', audience: 'semichain-ui', expiresIn: '12h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch { res.status(500).json({ error: { code: 'AUTH_UNAVAILABLE', message: 'Authentication is temporarily unavailable' } }); }
});

router.get('/me', authenticate, async (req, res) => {
  const result = await db.query('SELECT id,email,name,role FROM users WHERE id = $1', [req.user.id]);
  if (!result.rows[0]) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User is no longer active' } });
  return res.json({ user: result.rows[0] });
});

module.exports = router;
