// CoWoS calendar — quarterly capacity & bookings view for visualization.
//
// Endpoints:
//   GET /api/cf-cowos-calendar/calendar?from=2026Q1&to=2027Q2
//   GET /api/cf-cowos-calendar/quarters

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

function quarterKey(q) {
  const m = /^(\d{4})Q([1-4])$/.exec(q || '');
  if (!m) return 0;
  return parseInt(m[1], 10) * 10 + parseInt(m[2], 10);
}

router.get('/calendar', async (req, res) => {
  try {
    const from = String(req.query.from || '2026Q1');
    const to = String(req.query.to || '2027Q4');
    const fromKey = quarterKey(from);
    const toKey = quarterKey(to);
    if (!fromKey || !toKey || fromKey > toKey) {
      return res.status(400).json({ error: 'Invalid from/to (use e.g. 2026Q1)' });
    }

    const caps = await pool.query(`
      SELECT pc.id, pc.technology, pc.quarter, pc.monthly_capacity_units,
             pc.reserved_pct, pc.available_pct, pc.notes,
             f.name AS fab_name, f.operator
      FROM packaging_capacity pc
      LEFT JOIN fabs f ON f.id = pc.fab_id
      ORDER BY pc.quarter, pc.technology
    `);
    const bookings = await pool.query(`
      SELECT pb.*, pc.technology, pc.quarter AS capacity_quarter
      FROM packaging_bookings pb
      JOIN packaging_capacity pc ON pc.id = pb.capacity_id
    `);

    const inRange = q => {
      const k = quarterKey(q);
      return k >= fromKey && k <= toKey;
    };
    const capsInRange = caps.rows.filter(c => inRange(c.quarter));
    const bookingsInRange = bookings.rows.filter(b => inRange(b.delivery_quarter));

    const byQuarter = {};
    capsInRange.forEach(c => {
      byQuarter[c.quarter] = byQuarter[c.quarter] || {};
      byQuarter[c.quarter][c.technology] = byQuarter[c.quarter][c.technology] || {
        technology: c.technology,
        capacity_units: 0,
        capacity_rows: [],
        bookings: []
      };
      byQuarter[c.quarter][c.technology].capacity_units += Number(c.monthly_capacity_units || 0);
      byQuarter[c.quarter][c.technology].capacity_rows.push(c);
    });
    bookingsInRange.forEach(b => {
      const q = b.delivery_quarter;
      const tech = b.technology;
      if (!byQuarter[q]) byQuarter[q] = {};
      if (!byQuarter[q][tech]) {
        byQuarter[q][tech] = { technology: tech, capacity_units: 0, capacity_rows: [], bookings: [] };
      }
      byQuarter[q][tech].bookings.push(b);
    });

    const calendar = Object.keys(byQuarter).sort((a, b) => quarterKey(a) - quarterKey(b)).map(q => ({
      quarter: q,
      technologies: Object.values(byQuarter[q]).map(t => {
        const booked = t.bookings.reduce((s, b) => s + Number(b.quantity_units || 0), 0);
        return {
          ...t,
          booked_units: booked,
          remaining_units: t.capacity_units - booked,
          utilization_pct: t.capacity_units > 0 ? +(100 * booked / t.capacity_units).toFixed(1) : 0
        };
      })
    }));

    res.json({ from, to, calendar });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/quarters', async (_req, res) => {
  try {
    const r = await pool.query('SELECT DISTINCT quarter FROM packaging_capacity ORDER BY quarter');
    res.json(r.rows.map(x => x.quarter));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
