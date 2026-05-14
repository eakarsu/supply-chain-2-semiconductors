// HBM bookings monitor — query open capacity by supplier × generation × quarter,
// demand-vs-supply aggregation, lock provisional bookings.
//
// Endpoints:
//   GET  /api/gap-ai-hbm-booking-monitor/availability?generation=HBM3e&quarter=2026Q3
//   GET  /api/gap-ai-hbm-booking-monitor/bookings  (optional ?customer=)
//   GET  /api/gap-ai-hbm-booking-monitor/demand-vs-supply
//   GET  /api/gap-ai-hbm-booking-monitor/matrix
//   POST /api/gap-ai-hbm-booking-monitor/lock  body: {id}
//   POST /api/gap-ai-hbm-booking-monitor/book  body: {customer,hbm_supplier,generation,quantity_GB,delivery_quarter,...}

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// Published-ish quarterly HBM supply capacity in GB (rough industry estimates for demo).
// Used to compute "available" given booked totals.
const SUPPLY_CAPACITY_GB = {
  'SK Hynix': {
    HBM3:   { '2025Q4': 12000000, '2026Q1': 12000000, '2026Q2': 13000000, '2026Q3': 13000000, '2026Q4': 13000000 },
    HBM3e:  { '2025Q4': 18000000, '2026Q1': 20000000, '2026Q2': 24000000, '2026Q3': 28000000, '2026Q4': 32000000, '2027Q1': 34000000, '2027Q2': 36000000 },
    HBM4:   { '2026Q4': 10000000, '2027Q1': 18000000, '2027Q2': 24000000, '2027Q3': 30000000, '2027Q4': 36000000 }
  },
  Samsung: {
    HBM3:   { '2025Q4': 10000000, '2026Q1': 11000000, '2026Q2': 12000000, '2026Q3': 12000000, '2026Q4': 12000000 },
    HBM3e:  { '2026Q1':  9000000, '2026Q2': 12000000, '2026Q3': 16000000, '2026Q4': 20000000, '2027Q1': 24000000 },
    HBM4:   { '2027Q1':  8000000, '2027Q2': 14000000, '2027Q3': 20000000, '2027Q4': 26000000 }
  },
  Micron: {
    HBM3e:  { '2025Q4':  2000000, '2026Q1':  3500000, '2026Q2':  5000000, '2026Q3':  7000000, '2026Q4':  9000000, '2027Q1': 11000000 },
    HBM4:   { '2027Q1':  3000000, '2027Q2':  6000000, '2027Q3':  9000000, '2027Q4': 12000000 }
  }
};

function supplyFor(supplier, generation, quarter) {
  return SUPPLY_CAPACITY_GB?.[supplier]?.[generation]?.[quarter] ?? 0;
}

router.get('/availability', async (req, res) => {
  try {
    const generation = String(req.query.generation || '').trim();
    const quarter = String(req.query.quarter || '').trim();
    if (!generation || !quarter) {
      return res.status(400).json({ error: 'generation and quarter query params required' });
    }
    const r = await pool.query(
      `SELECT hbm_supplier, COALESCE(SUM(quantity_GB),0) AS booked_gb
       FROM hbm_bookings WHERE generation=$1 AND delivery_quarter=$2
       GROUP BY hbm_supplier
       ORDER BY hbm_supplier`,
      [generation, quarter]
    );
    const suppliers = ['SK Hynix', 'Samsung', 'Micron'];
    const out = suppliers.map(s => {
      const booked = Number(r.rows.find(row => row.hbm_supplier === s)?.booked_gb || 0);
      const supply = supplyFor(s, generation, quarter);
      return {
        supplier: s,
        generation,
        quarter,
        supply_gb: supply,
        booked_gb: booked,
        available_gb: Math.max(supply - booked, 0),
        utilization_pct: supply > 0 ? +(100 * booked / supply).toFixed(1) : 0
      };
    });
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bookings', async (req, res) => {
  try {
    const { customer, supplier, generation, quarter } = req.query;
    const params = [];
    const where = [];
    if (customer)   { params.push(`%${customer}%`); where.push(`customer ILIKE $${params.length}`); }
    if (supplier)   { params.push(supplier);        where.push(`hbm_supplier = $${params.length}`); }
    if (generation) { params.push(generation);      where.push(`generation = $${params.length}`); }
    if (quarter)    { params.push(quarter);         where.push(`delivery_quarter = $${params.length}`); }
    const sql = `
      SELECT * FROM hbm_bookings
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY delivery_quarter, hbm_supplier, generation, customer
    `;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/demand-vs-supply', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT generation, delivery_quarter, hbm_supplier,
             COALESCE(SUM(quantity_GB),0) AS demand_gb,
             COALESCE(SUM(contract_value_millions),0) AS contract_value_m
      FROM hbm_bookings
      GROUP BY generation, delivery_quarter, hbm_supplier
      ORDER BY delivery_quarter, generation, hbm_supplier
    `);
    const series = r.rows.map(row => ({
      ...row,
      demand_gb: Number(row.demand_gb),
      supply_gb: supplyFor(row.hbm_supplier, row.generation, row.delivery_quarter),
      shortfall_gb: Math.max(Number(row.demand_gb) - supplyFor(row.hbm_supplier, row.generation, row.delivery_quarter), 0)
    }));
    res.json({ series });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pivoted view: supplier × generation × quarter matrix of booked GB.
router.get('/matrix', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT hbm_supplier, generation, delivery_quarter,
             COALESCE(SUM(quantity_GB),0) AS booked_gb,
             COUNT(*) AS bookings_count
      FROM hbm_bookings
      GROUP BY hbm_supplier, generation, delivery_quarter
      ORDER BY hbm_supplier, generation, delivery_quarter
    `);
    const quarters = Array.from(new Set(r.rows.map(x => x.delivery_quarter))).sort();
    const suppliers = Array.from(new Set(r.rows.map(x => x.hbm_supplier))).sort();
    const generations = Array.from(new Set(r.rows.map(x => x.generation))).sort();
    res.json({
      quarters, suppliers, generations,
      cells: r.rows.map(row => ({
        ...row,
        booked_gb: Number(row.booked_gb),
        supply_gb: supplyFor(row.hbm_supplier, row.generation, row.delivery_quarter)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/lock', async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });
    const r = await pool.query(
      'UPDATE hbm_bookings SET locked=TRUE WHERE id=$1 RETURNING *',
      [id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Booking not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/book', async (req, res) => {
  try {
    const {
      customer, hbm_supplier, generation, quantity_GB, delivery_quarter,
      contract_value_millions = null, locked = false
    } = req.body || {};
    if (!customer || !hbm_supplier || !generation || !quantity_GB || !delivery_quarter) {
      return res.status(400).json({ error: 'customer, hbm_supplier, generation, quantity_GB, delivery_quarter required' });
    }
    const supply = supplyFor(hbm_supplier, generation, delivery_quarter);
    if (supply > 0) {
      const used = await pool.query(
        'SELECT COALESCE(SUM(quantity_GB),0) AS booked FROM hbm_bookings WHERE hbm_supplier=$1 AND generation=$2 AND delivery_quarter=$3',
        [hbm_supplier, generation, delivery_quarter]
      );
      const booked = Number(used.rows[0].booked);
      if (booked + Number(quantity_GB) > supply) {
        return res.status(409).json({
          error: 'Over-commit',
          message: `${hbm_supplier} ${generation} for ${delivery_quarter} only has ${supply - booked} GB available (supply=${supply}, already booked=${booked}).`
        });
      }
    }
    const r = await pool.query(
      `INSERT INTO hbm_bookings (customer, hbm_supplier, generation, quantity_GB, delivery_quarter, contract_value_millions, locked)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [customer, hbm_supplier, generation, quantity_GB, delivery_quarter, contract_value_millions, locked]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
