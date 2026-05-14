const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/stats', auth, async (req, res) => {
  try {
    const [foundries, components, allocationsActive, fabs, riskOpen, recent] = await Promise.all([
      db.query("SELECT COUNT(*)::int AS c FROM suppliers WHERE tier = 1 OR LOWER(COALESCE(capabilities,'')) LIKE '%foundry%' OR LOWER(COALESCE(capabilities,'')) LIKE '%wafer%'"),
      db.query('SELECT COUNT(*)::int AS c FROM components'),
      db.query("SELECT COUNT(*)::int AS c FROM allocations WHERE status IN ('active','confirmed','provisional')"),
      db.query('SELECT COUNT(*)::int AS c FROM fabs'),
      db.query("SELECT COUNT(*)::int AS c FROM risk_alerts WHERE status = 'open'"),
      db.query('SELECT id, user_email, action, entity_type, entity_id, details, created_at FROM audit_log ORDER BY created_at DESC LIMIT 10')
    ]);

    // total suppliers as a fallback foundry baseline
    const totalSuppliers = await db.query('SELECT COUNT(*)::int AS c FROM suppliers');

    res.json({
      kpis: {
        foundries_tracked: foundries.rows[0].c || totalSuppliers.rows[0].c,
        components: components.rows[0].c,
        allocations_active: allocationsActive.rows[0].c,
        fabs: fabs.rows[0].c,
        risk_alerts_open: riskOpen.rows[0].c
      },
      recent_activity: recent.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
