// Tier-N discovery — LLM-driven suggestion of likely missing tier-N suppliers
// for a parent supplier. Grounded against the real `suppliers` and
// `supplier_relationships` tables — the LLM is given the actual graph context.

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

async function ensureHistoryTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS gap_features (
      id SERIAL PRIMARY KEY,
      feature_slug TEXT NOT NULL,
      user_id INTEGER,
      input JSONB,
      output TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) { /* swallow */ }
}

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Tier-N Discovery'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      })
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    return null;
  }
}

// Reference catalog used as a deterministic fallback when no API key is set.
const STATIC_HINTS = {
  ASML: [
    { name: 'Carl Zeiss SMT', relationship: 'EUV_optics', country: 'Germany', criticality: 'critical', rationale: 'Sole supplier of EUV projection optics for ASML scanners.' },
    { name: 'Trumpf', relationship: 'EUV_laser_source', country: 'Germany', criticality: 'critical', rationale: 'Sole supplier of CO2 drive lasers for EUV plasma source.' },
    { name: 'Cymer (ASML subsidiary)', relationship: 'EUV_light_source', country: 'USA', criticality: 'critical', rationale: 'EUV LPP source module — integrated into ASML.' }
  ],
  TSMC: [
    { name: 'ASML', relationship: 'lithography_equipment', country: 'Netherlands', criticality: 'critical', rationale: 'EUV/DUV scanners — irreplaceable.' },
    { name: 'Shin-Etsu Chemical', relationship: 'silicon_wafers', country: 'Japan', criticality: 'critical', rationale: '300mm prime wafer supply.' },
    { name: 'JSR Corporation', relationship: 'photoresist', country: 'Japan', criticality: 'high', rationale: 'EUV/ArF photoresists.' }
  ],
  NVIDIA: [
    { name: 'TSMC', relationship: 'foundry_wafers', country: 'Taiwan', criticality: 'critical', rationale: 'All advanced NVIDIA chips fabricated at TSMC.' },
    { name: 'SK Hynix', relationship: 'HBM_memory', country: 'South Korea', criticality: 'critical', rationale: 'Primary HBM3e supplier for H200/B200.' },
    { name: 'Samsung Foundry', relationship: 'HBM_memory', country: 'South Korea', criticality: 'high', rationale: 'Secondary HBM source in qualification.' }
  ],
  'Carl Zeiss SMT': [
    { name: 'Heraeus', relationship: 'EUV_quartz_glass', country: 'Germany', criticality: 'critical', rationale: 'High-purity quartz glass blanks for EUV mirrors.' }
  ]
};

router.post('/discover', async (req, res) => {
  try {
    await ensureHistoryTable();
    const { supplier_id, focus = '' } = req.body || {};
    if (!supplier_id) return res.status(400).json({ error: 'supplier_id required' });

    const s = await pool.query(
      'SELECT id, name, country, tier, capabilities, certifications FROM suppliers WHERE id=$1',
      [supplier_id]
    );
    if (!s.rows[0]) return res.status(404).json({ error: 'Supplier not found' });
    const supplier = s.rows[0];

    const existing = await pool.query(
      `SELECT s.id, s.name, s.country, sr.relationship_type, sr.criticality
       FROM supplier_relationships sr
       JOIN suppliers s ON s.id = sr.child_id
       WHERE sr.parent_id = $1`,
      [supplier_id]
    );

    const catalog = await pool.query('SELECT id, name, country, tier FROM suppliers ORDER BY tier, name');

    let suggestions = [];
    let llmUsed = false;

    const sys = `You are a semiconductor supply-chain analyst. Given a parent supplier and the suppliers we already know they depend on, propose 3-6 LIKELY MISSING tier-N suppliers based on industry knowledge.
Return STRICT JSON: an array of objects, each with: {"name":string,"relationship_type":string,"country":string,"criticality":"critical"|"high"|"medium"|"low","rationale":string,"existing_match_id":number|null}.
Set existing_match_id when the suggested name closely matches a row from the catalog provided. Output JSON only — no prose.`;
    const usr = `Parent supplier: ${supplier.name} (${supplier.country}, tier ${supplier.tier})
Capabilities: ${supplier.capabilities || ''}
Focus area: ${focus || 'any'}

Already-known dependencies:
${existing.rows.map(r => `- ${r.name} (${r.country}) — ${r.relationship_type} [${r.criticality}]`).join('\n') || '(none)'}

Catalog of suppliers we already track (id | name | country | tier):
${catalog.rows.map(r => `${r.id} | ${r.name} | ${r.country} | T${r.tier}`).join('\n')}

Propose missing tier-N dependencies. Use the catalog to set existing_match_id when applicable.`;

    const raw = await callAI(sys, usr);
    if (raw) {
      llmUsed = true;
      try {
        const jsonStr = raw.match(/\[[\s\S]*\]/)?.[0] || raw;
        suggestions = JSON.parse(jsonStr);
        if (!Array.isArray(suggestions)) suggestions = [];
      } catch (e) {
        suggestions = [];
      }
    }

    if (!suggestions.length) {
      const key = Object.keys(STATIC_HINTS).find(k => supplier.name.toLowerCase().includes(k.toLowerCase()));
      if (key) {
        suggestions = STATIC_HINTS[key].map(h => ({
          name: h.name,
          relationship_type: h.relationship,
          country: h.country,
          criticality: h.criticality,
          rationale: h.rationale,
          existing_match_id: catalog.rows.find(r => r.name === h.name)?.id || null
        }));
      }
    }

    const existingChildNames = new Set(existing.rows.map(r => r.name.toLowerCase()));
    suggestions = suggestions.filter(sug => sug && sug.name && !existingChildNames.has(String(sug.name).toLowerCase()));

    try {
      await pool.query(
        'INSERT INTO gap_features (feature_slug, user_id, input, output) VALUES ($1,$2,$3,$4)',
        ['tier-n-discovery', req.user?.id || null, { supplier_id, focus }, JSON.stringify(suggestions)]
      );
    } catch (e) { /* persistence optional */ }

    res.json({
      supplier,
      existing_children: existing.rows,
      suggestions,
      llm_used: llmUsed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (_req, res) => {
  try {
    await ensureHistoryTable();
    const r = await pool.query(
      'SELECT id, input, output, created_at FROM gap_features WHERE feature_slug=$1 ORDER BY created_at DESC LIMIT 25',
      ['tier-n-discovery']
    );
    res.json({ history: r.rows });
  } catch (err) {
    res.json({ history: [] });
  }
});

module.exports = router;
