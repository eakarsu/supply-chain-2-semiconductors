const jwt = require('jsonwebtoken');
const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Bearer token required' } });
  try {
    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'semichain', audience: 'semichain-ui' });
    next();
  } catch { res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' } }); }
};
authenticate.requireRole = (...roles) => (req, res, next) => roles.includes(req.user?.role)
  ? next()
  : res.status(403).json({ error: { code: 'FORBIDDEN', message: `Requires one of: ${roles.join(', ')}` } });
module.exports = authenticate;
