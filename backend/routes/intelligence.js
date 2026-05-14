const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try { const r = await db.query('SELECT * FROM market_intelligence ORDER BY published_date DESC'); res.json(r.rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try { const r = await db.query('SELECT * FROM market_intelligence WHERE id = $1', [req.params.id]); if (!r.rows[0]) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { title, topic, summary, impact_level, source, published_date, affected_components, analyst, action_items } = req.body;
    const r = await db.query('INSERT INTO market_intelligence (title, topic, summary, impact_level, source, published_date, affected_components, analyst, action_items) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *', [title, topic, summary, impact_level||'medium', source, published_date, affected_components, analyst, action_items]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, topic, summary, impact_level, source, published_date, affected_components, analyst, action_items } = req.body;
    const r = await db.query('UPDATE market_intelligence SET title=$1, topic=$2, summary=$3, impact_level=$4, source=$5, published_date=$6, affected_components=$7, analyst=$8, action_items=$9 WHERE id=$10 RETURNING *', [title, topic, summary, impact_level, source, published_date, affected_components, analyst, action_items, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM market_intelligence WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
