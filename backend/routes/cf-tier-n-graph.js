// Multi-tier supplier graph — BFS traversal, risk propagation, mutations.
//
// Endpoints:
//   GET  /api/cf-tier-n-graph/traverse/:supplierId?depth=3
//   GET  /api/cf-tier-n-graph/risk-propagation/:supplierId
//   POST /api/cf-tier-n-graph/add-relationship  body: {parent_id,child_id,relationship_type,criticality}
//   GET  /api/cf-tier-n-graph/relationships     all relationships
//   DELETE /api/cf-tier-n-graph/relationship?parent_id=&child_id=&relationship_type=

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// BFS down the dependency graph (parent -> child).
router.get('/traverse/:supplierId', async (req, res) => {
  try {
    const startId = parseInt(req.params.supplierId, 10);
    const maxDepth = Math.min(parseInt(req.query.depth || '3', 10), 6);
    if (!Number.isFinite(startId)) return res.status(400).json({ error: 'Invalid supplierId' });

    const rootRow = await pool.query(
      'SELECT id, name, country, tier, capabilities, export_controlled, status FROM suppliers WHERE id=$1',
      [startId]
    );
    if (!rootRow.rows[0]) return res.status(404).json({ error: 'Supplier not found' });

    const nodes = new Map();
    const edges = [];
    const queue = [{ id: startId, depth: 0 }];
    nodes.set(startId, { ...rootRow.rows[0], depth: 0 });

    while (queue.length) {
      const cur = queue.shift();
      if (cur.depth >= maxDepth) continue;
      const r = await pool.query(
        `SELECT sr.child_id, sr.relationship_type, sr.criticality,
                s.id, s.name, s.country, s.tier, s.capabilities, s.export_controlled, s.status
         FROM supplier_relationships sr
         JOIN suppliers s ON s.id = sr.child_id
         WHERE sr.parent_id = $1`,
        [cur.id]
      );
      for (const row of r.rows) {
        edges.push({
          source: cur.id,
          target: row.child_id,
          relationship_type: row.relationship_type,
          criticality: row.criticality
        });
        if (!nodes.has(row.child_id)) {
          nodes.set(row.child_id, {
            id: row.id, name: row.name, country: row.country, tier: row.tier,
            capabilities: row.capabilities, export_controlled: row.export_controlled,
            status: row.status, depth: cur.depth + 1
          });
          queue.push({ id: row.child_id, depth: cur.depth + 1 });
        }
      }
    }

    res.json({
      root_id: startId,
      depth: maxDepth,
      nodes: Array.from(nodes.values()),
      edges
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Walk UP from a supplier toward customers; collect open risk_alerts on each ancestor.
router.get('/risk-propagation/:supplierId', async (req, res) => {
  try {
    const startId = parseInt(req.params.supplierId, 10);
    if (!Number.isFinite(startId)) return res.status(400).json({ error: 'Invalid supplierId' });

    const visited = new Set([startId]);
    const ancestors = [];
    const queue = [startId];
    const maxDepth = 6;
    let depth = 0;

    while (queue.length && depth < maxDepth) {
      const nextLayer = [];
      for (const id of queue) {
        const r = await pool.query(
          `SELECT sr.parent_id, s.name, s.country, s.tier, sr.relationship_type, sr.criticality
           FROM supplier_relationships sr
           JOIN suppliers s ON s.id = sr.parent_id
           WHERE sr.child_id = $1`,
          [id]
        );
        for (const row of r.rows) {
          if (!visited.has(row.parent_id)) {
            visited.add(row.parent_id);
            ancestors.push({
              supplier_id: row.parent_id,
              name: row.name,
              country: row.country,
              tier: row.tier,
              via_relationship: row.relationship_type,
              criticality: row.criticality,
              hops_away: depth + 1
            });
            nextLayer.push(row.parent_id);
          }
        }
      }
      queue.length = 0;
      queue.push(...nextLayer);
      depth++;
    }

    // Collect open risk alerts touching the starting node OR any visited ancestor.
    const allIds = Array.from(visited);
    const risksQ = await pool.query(
      `SELECT id, supplier_id, component_id, risk_type, severity, title, description, status, detected_at
       FROM risk_alerts
       WHERE supplier_id = ANY($1::int[]) AND status IN ('open','monitoring','mitigating')
       ORDER BY CASE severity
                  WHEN 'critical' THEN 0
                  WHEN 'high' THEN 1
                  WHEN 'medium' THEN 2
                  ELSE 3 END,
                detected_at DESC`,
      [allIds]
    );

    res.json({
      root_id: startId,
      ancestors,
      affected_supplier_ids: allIds,
      open_risks: risksQ.rows,
      summary: {
        critical: risksQ.rows.filter(r => r.severity === 'critical').length,
        high: risksQ.rows.filter(r => r.severity === 'high').length,
        medium: risksQ.rows.filter(r => r.severity === 'medium').length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/add-relationship', async (req, res) => {
  try {
    const { parent_id, child_id, relationship_type, criticality } = req.body || {};
    if (!parent_id || !child_id || !relationship_type) {
      return res.status(400).json({ error: 'parent_id, child_id, relationship_type required' });
    }
    if (parent_id === child_id) {
      return res.status(400).json({ error: 'parent_id and child_id must differ' });
    }
    const r = await pool.query(
      `INSERT INTO supplier_relationships (parent_id, child_id, relationship_type, criticality)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (parent_id, child_id, relationship_type) DO UPDATE SET criticality=EXCLUDED.criticality
       RETURNING *`,
      [parent_id, child_id, relationship_type, criticality || 'medium']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/relationship', async (req, res) => {
  try {
    const { parent_id, child_id, relationship_type } = req.query;
    await pool.query(
      'DELETE FROM supplier_relationships WHERE parent_id=$1 AND child_id=$2 AND relationship_type=$3',
      [parent_id, child_id, relationship_type]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/relationships', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT sr.parent_id, sr.child_id, sr.relationship_type, sr.criticality,
              p.name AS parent_name, p.tier AS parent_tier,
              c.name AS child_name, c.tier AS child_tier, c.country AS child_country
       FROM supplier_relationships sr
       JOIN suppliers p ON p.id = sr.parent_id
       JOIN suppliers c ON c.id = sr.child_id
       ORDER BY p.tier, p.name, c.tier, c.name`
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
