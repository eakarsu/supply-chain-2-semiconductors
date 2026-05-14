const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try { const r = await db.query('SELECT a.*, c.name as component_name FROM allocations a JOIN components c ON a.component_id = c.id ORDER BY a.priority, a.created_at DESC'); res.json(r.rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try { const r = await db.query('SELECT a.*, c.name as component_name FROM allocations a JOIN components c ON a.component_id = c.id WHERE a.id = $1', [req.params.id]); if (!r.rows[0]) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { component_id, customer, quantity_k_units, priority, locked_until, status, contract_value_millions, notes } = req.body;
    const r = await db.query('INSERT INTO allocations (component_id, customer, quantity_k_units, priority, locked_until, status, contract_value_millions, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [component_id, customer, quantity_k_units, priority||5, locked_until, status||'provisional', contract_value_millions, notes]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { component_id, customer, quantity_k_units, priority, locked_until, status, contract_value_millions, notes } = req.body;
    const r = await db.query('UPDATE allocations SET component_id=$1, customer=$2, quantity_k_units=$3, priority=$4, locked_until=$5, status=$6, contract_value_millions=$7, notes=$8 WHERE id=$9 RETURNING *', [component_id, customer, quantity_k_units, priority, locked_until, status, contract_value_millions, notes, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM allocations WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
