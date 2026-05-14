// HTS / ECCN fuzzy lookup — non-AI reference search across both tables.
//
// Endpoints:
//   GET /api/gap-nonai-hts-eccn-lookup/search?q=...&kind=eccn|hts|all
//   GET /api/gap-nonai-hts-eccn-lookup/hts/:code
//   GET /api/gap-nonai-hts-eccn-lookup/recent  (recent classifications)

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const kind = String(req.query.kind || 'all').toLowerCase();
    if (!q) return res.json({ eccn: [], hts: [], total: 0 });

    const like = `%${q}%`;
    const out = { eccn: [], hts: [] };

    if (kind === 'all' || kind === 'eccn') {
      const r = await pool.query(
        `SELECT code, category, product_group, description, controls, license_required_to
         FROM eccn_codes
         WHERE code ILIKE $1
            OR description ILIKE $1
            OR controls ILIKE $1
            OR license_required_to ILIKE $1
         ORDER BY
           CASE WHEN code ILIKE $2 THEN 0 ELSE 1 END,
           code
         LIMIT 25`,
        [like, `${q}%`]
      );
      out.eccn = r.rows;
    }

    if (kind === 'all' || kind === 'hts') {
      const r = await pool.query(
        `SELECT code, description, general_rate, special_rate, unit_of_measure
         FROM hts_codes
         WHERE code ILIKE $1
            OR description ILIKE $1
         ORDER BY
           CASE WHEN code ILIKE $2 THEN 0 ELSE 1 END,
           code
         LIMIT 25`,
        [like, `${q}%`]
      );
      out.hts = r.rows;
    }

    res.json({ ...out, total: out.eccn.length + out.hts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/hts/:code', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM hts_codes WHERE code = $1', [req.params.code]);
    if (!r.rows[0]) return res.status(404).json({ error: 'HTS not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recent', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, eccn, hts, destination_country, license_required, classified_at
       FROM classifications ORDER BY classified_at DESC LIMIT 25`
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
