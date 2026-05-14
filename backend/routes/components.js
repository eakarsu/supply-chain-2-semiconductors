const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

router.get('/', auth, async (req, res) => {
  try { const r = await db.query('SELECT c.*, s.name as supplier_name FROM components c JOIN suppliers s ON c.supplier_id = s.id ORDER BY c.criticality, c.name'); res.json(r.rows); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get('/:id', auth, async (req, res) => {
  try { const r = await db.query('SELECT c.*, s.name as supplier_name FROM components c JOIN suppliers s ON c.supplier_id = s.id WHERE c.id = $1', [req.params.id]); if (!r.rows[0]) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, process_node_nm, supplier_id, lead_time_weeks, allocated_to, status, monthly_capacity_k_units, current_allocation_pct, price_usd, criticality } = req.body;
    const r = await db.query('INSERT INTO components (name, type, process_node_nm, supplier_id, lead_time_weeks, allocated_to, status, monthly_capacity_k_units, current_allocation_pct, price_usd, criticality) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *', [name, type, process_node_nm, supplier_id, lead_time_weeks, allocated_to, status||'available', monthly_capacity_k_units, current_allocation_pct, price_usd, criticality||'medium']);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, process_node_nm, supplier_id, lead_time_weeks, allocated_to, status, monthly_capacity_k_units, current_allocation_pct, price_usd, criticality } = req.body;
    const r = await db.query('UPDATE components SET name=$1, type=$2, process_node_nm=$3, supplier_id=$4, lead_time_weeks=$5, allocated_to=$6, status=$7, monthly_capacity_k_units=$8, current_allocation_pct=$9, price_usd=$10, criticality=$11 WHERE id=$12 RETURNING *', [name, type, process_node_nm, supplier_id, lead_time_weeks, allocated_to, status, monthly_capacity_k_units, current_allocation_pct, price_usd, criticality, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM components WHERE id = $1', [req.params.id]); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
