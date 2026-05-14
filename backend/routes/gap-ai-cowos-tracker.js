// CoWoS / advanced-packaging capacity tracker.
//
// Endpoints:
//   GET  /api/gap-ai-cowos-tracker/capacity          group capacity by technology + quarter
//   GET  /api/gap-ai-cowos-tracker/capacity-detail   raw capacity rows with fab join
//   GET  /api/gap-ai-cowos-tracker/forecast?customer=NVIDIA
//   GET  /api/gap-ai-cowos-tracker/bookings
//   POST /api/gap-ai-cowos-tracker/book              {capacity_id,customer,quantity_units,delivery_quarter,contract_value_millions}

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

router.get('/capacity', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT pc.technology, pc.quarter,
             SUM(pc.monthly_capacity_units) AS monthly_capacity_units,
             AVG(pc.reserved_pct) AS reserved_pct,
             AVG(pc.available_pct) AS available_pct,
             COUNT(*) AS line_count
      FROM packaging_capacity pc
      GROUP BY pc.technology, pc.quarter
      ORDER BY pc.technology, pc.quarter
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/capacity-detail', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT pc.id, pc.technology, pc.quarter, pc.monthly_capacity_units,
             pc.reserved_pct, pc.available_pct, pc.notes,
             f.name AS fab_name, f.operator, f.location
      FROM packaging_capacity pc
      LEFT JOIN fabs f ON f.id = pc.fab_id
      ORDER BY pc.quarter, pc.technology
    `);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/forecast', async (req, res) => {
  try {
    const customer = String(req.query.customer || '').trim();
    if (!customer) return res.status(400).json({ error: 'customer query param required' });

    // For each (technology, quarter) compute booked-by-customer + total available.
    const r = await pool.query(`
      SELECT pc.id AS capacity_id, pc.technology, pc.quarter,
             pc.monthly_capacity_units,
             COALESCE(SUM(CASE WHEN pb.customer ILIKE $1 THEN pb.quantity_units END), 0) AS customer_booked_units,
             COALESCE(SUM(pb.quantity_units), 0) AS total_booked_units,
             pc.monthly_capacity_units - COALESCE(SUM(pb.quantity_units), 0) AS unbooked_units
      FROM packaging_capacity pc
      LEFT JOIN packaging_bookings pb ON pb.capacity_id = pc.id
      GROUP BY pc.id, pc.technology, pc.quarter, pc.monthly_capacity_units
      ORDER BY pc.quarter, pc.technology
    `, [`%${customer}%`]);

    const rows = r.rows.map(row => ({
      ...row,
      monthly_capacity_units: Number(row.monthly_capacity_units),
      customer_booked_units: Number(row.customer_booked_units),
      total_booked_units: Number(row.total_booked_units),
      unbooked_units: Number(row.unbooked_units),
      customer_share_pct: Number(row.monthly_capacity_units) > 0
        ? +(100 * Number(row.customer_booked_units) / Number(row.monthly_capacity_units)).toFixed(1)
        : 0,
      utilization_pct: Number(row.monthly_capacity_units) > 0
        ? +(100 * Number(row.total_booked_units) / Number(row.monthly_capacity_units)).toFixed(1)
        : 0
    }));

    res.json({
      customer,
      forecast: rows,
      totals: {
        customer_units: rows.reduce((s, x) => s + x.customer_booked_units, 0),
        total_units: rows.reduce((s, x) => s + x.total_booked_units, 0),
        capacity_units: rows.reduce((s, x) => s + x.monthly_capacity_units, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bookings', async (req, res) => {
  try {
    const { technology, quarter, customer } = req.query;
    const params = [];
    const where = [];
    if (technology) { params.push(technology); where.push(`pc.technology = $${params.length}`); }
    if (quarter)    { params.push(quarter);    where.push(`pb.delivery_quarter = $${params.length}`); }
    if (customer)   { params.push(`%${customer}%`); where.push(`pb.customer ILIKE $${params.length}`); }
    const sql = `
      SELECT pb.*, pc.technology, pc.monthly_capacity_units, pc.quarter AS capacity_quarter,
             f.name AS fab_name, f.operator
      FROM packaging_bookings pb
      JOIN packaging_capacity pc ON pc.id = pb.capacity_id
      LEFT JOIN fabs f ON f.id = pc.fab_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY pb.delivery_quarter, pc.technology, pb.customer
    `;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/book', async (req, res) => {
  try {
    const {
      capacity_id, customer, quantity_units, delivery_quarter,
      contract_value_millions = null, contract_status = 'provisional'
    } = req.body || {};

    if (!capacity_id || !customer || !quantity_units || !delivery_quarter) {
      return res.status(400).json({ error: 'capacity_id, customer, quantity_units, delivery_quarter required' });
    }

    const cap = await pool.query('SELECT * FROM packaging_capacity WHERE id=$1', [capacity_id]);
    if (!cap.rows[0]) return res.status(404).json({ error: 'capacity_id not found' });

    const booked = await pool.query(
      'SELECT COALESCE(SUM(quantity_units),0) AS booked FROM packaging_bookings WHERE capacity_id=$1',
      [capacity_id]
    );
    const totalBooked = Number(booked.rows[0].booked);
    const monthly = Number(cap.rows[0].monthly_capacity_units);
    const remaining = monthly - totalBooked;

    if (Number(quantity_units) > remaining) {
      return res.status(409).json({
        error: 'Over-commit',
        message: `Requested ${quantity_units} units exceeds remaining capacity (${remaining} of ${monthly}) for ${cap.rows[0].technology} ${cap.rows[0].quarter}.`,
        monthly_capacity_units: monthly,
        already_booked: totalBooked,
        remaining_units: remaining
      });
    }

    const r = await pool.query(
      `INSERT INTO packaging_bookings (capacity_id, customer, quantity_units, delivery_quarter, contract_status, contract_value_millions)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [capacity_id, customer, quantity_units, delivery_quarter, contract_status, contract_value_millions]
    );
    res.status(201).json({
      booking: r.rows[0],
      capacity_after_booking: {
        monthly_capacity_units: monthly,
        booked: totalBooked + Number(quantity_units),
        remaining: remaining - Number(quantity_units)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
