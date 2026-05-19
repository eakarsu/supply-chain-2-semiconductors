const router = require('express').Router();
const auth = require('../middleware/auth');

// In-memory store for qualification rules (CRUD)
let qualRulesStore = [
  { id: 1, name: 'Tier-1 Foundry Audit', node_nm: 3, region: 'Taiwan', requires_iso_9001: true, requires_iatf_16949: true, min_yield_pct: 92, max_lead_time_days: 90, active: true },
  { id: 2, name: 'Auto-Grade Power IC', node_nm: 28, region: 'Global', requires_iso_9001: true, requires_iatf_16949: true, min_yield_pct: 96, max_lead_time_days: 60, active: true },
  { id: 3, name: 'HBM3e Stack Qual', node_nm: 10, region: 'Korea', requires_iso_9001: true, requires_iatf_16949: false, min_yield_pct: 88, max_lead_time_days: 120, active: true },
  { id: 4, name: 'CoWoS Packaging', node_nm: 5, region: 'Taiwan', requires_iso_9001: true, requires_iatf_16949: false, min_yield_pct: 90, max_lead_time_days: 150, active: true },
  { id: 5, name: 'US-Fab Defense ECCN', node_nm: 7, region: 'USA', requires_iso_9001: true, requires_iatf_16949: false, min_yield_pct: 94, max_lead_time_days: 100, active: false }
];
let nextRuleId = 6;

// 1. VIZ: Wafer demand forecast chart (12-month demand by process node)
router.get('/wafer-demand', auth, (req, res) => {
  try {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const nodes = [
      { node: '3nm', base: 145, growth: 8.2, color: '#f59e0b' },
      { node: '5nm', base: 210, growth: 4.5, color: '#3b82f6' },
      { node: '7nm', base: 320, growth: 2.1, color: '#10b981' },
      { node: '28nm', base: 480, growth: 0.8, color: '#8b5cf6' }
    ];
    const series = nodes.map(n => ({
      node: n.node,
      color: n.color,
      data: months.map((m, i) => ({
        month: m,
        demand_kwafers: Math.round(n.base * Math.pow(1 + n.growth/100, i) + Math.sin(i*0.7)*12),
        supply_kwafers: Math.round((n.base * Math.pow(1 + n.growth/100, i) + Math.sin(i*0.7)*12) * (0.78 + Math.random()*0.18))
      }))
    }));
    const totals = months.map((m, i) => ({
      month: m,
      total_demand: series.reduce((s, x) => s + x.data[i].demand_kwafers, 0),
      total_supply: series.reduce((s, x) => s + x.data[i].supply_kwafers, 0)
    }));
    res.json({
      title: 'Wafer Demand vs Supply (12-Month Forecast)',
      unit: 'thousand wafers/month',
      months,
      series,
      totals,
      generated_at: new Date().toISOString()
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. VIZ: Foundry capacity heatmap (foundry x process node utilization)
router.get('/foundry-heatmap', auth, (req, res) => {
  try {
    const foundries = ['TSMC', 'Samsung', 'Intel Foundry', 'GlobalFoundries', 'SMIC', 'UMC'];
    const nodes = ['3nm', '5nm', '7nm', '14nm', '28nm', '65nm'];
    // Realistic capability matrix: 0 = not offered
    const offers = {
      'TSMC':            [95, 93, 88, 82, 75, 60],
      'Samsung':         [89, 91, 85, 80, 72, 55],
      'Intel Foundry':   [70, 78, 0,  0,  0,  0],
      'GlobalFoundries': [0,  0,  0,  85, 78, 65],
      'SMIC':            [0,  0,  0,  88, 80, 70],
      'UMC':             [0,  0,  0,  0,  82, 72]
    };
    const cells = [];
    for (const f of foundries) {
      for (let i = 0; i < nodes.length; i++) {
        cells.push({
          foundry: f,
          node: nodes[i],
          utilization_pct: offers[f][i],
          offered: offers[f][i] > 0
        });
      }
    }
    res.json({
      title: 'Foundry Capacity Utilization by Process Node',
      foundries,
      nodes,
      cells,
      legend: { critical: '>90', tight: '75-90', healthy: '50-75', under: '<50' }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. NON-VIZ: Supply Chain Risk PDF report
router.get('/risk-report.pdf', auth, (req, res) => {
  try {
    const lines = [
      'SemiChain Supply Chain Risk Assessment',
      'Generated: ' + new Date().toISOString(),
      '',
      'Top Risks:',
      ' 1. TSMC CoWoS bottleneck - NVIDIA holding >60% allocation',
      ' 2. HBM3e booked through 2026 - SK Hynix/Samsung constrained',
      ' 3. Taiwan geopolitical exposure - >70% of advanced nodes',
      ' 4. US export controls evolving - quarterly ECCN updates',
      ' 5. Substrate (ABF) tightness from Ibiden/Unimicron',
      '',
      'Mitigations: dual-sourcing, US/EU CHIPS Act fabs, qualified packaging'
    ];

    const objects = [];
    const add = (o) => { objects.push(o); return objects.length; };

    // Build PDF content stream
    let stream = 'BT /F1 14 Tf 50 780 Td (' + lines[0].replace(/[()\\]/g, '') + ') Tj ET\n';
    let y = 760;
    for (let i = 1; i < lines.length; i++) {
      stream += `BT /F1 10 Tf 50 ${y} Td (${lines[i].replace(/[()\\]/g, '')}) Tj ET\n`;
      y -= 16;
    }

    const objs = [
      `<< /Type /Catalog /Pages 2 0 R >>`,
      `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
      `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`
    ];

    let pdf = '%PDF-1.4\n';
    const offsets = [];
    for (let i = 0; i < objs.length; i++) {
      offsets.push(pdf.length);
      pdf += `${i+1} 0 obj\n${objs[i]}\nendobj\n`;
    }
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;
    for (const off of offsets) {
      pdf += String(off).padStart(10, '0') + ' 00000 n \n';
    }
    pdf += `trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="supply-chain-risk-report.pdf"');
    res.send(Buffer.from(pdf, 'binary'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. NON-VIZ: Qualification rules CRUD
router.get('/qual-rules', auth, (req, res) => {
  res.json({ rules: qualRulesStore, count: qualRulesStore.length });
});
router.post('/qual-rules', auth, (req, res) => {
  try {
    const { name, node_nm, region, requires_iso_9001, requires_iatf_16949, min_yield_pct, max_lead_time_days, active } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const rule = {
      id: nextRuleId++,
      name,
      node_nm: Number(node_nm) || 0,
      region: region || 'Global',
      requires_iso_9001: !!requires_iso_9001,
      requires_iatf_16949: !!requires_iatf_16949,
      min_yield_pct: Number(min_yield_pct) || 0,
      max_lead_time_days: Number(max_lead_time_days) || 0,
      active: active !== false
    };
    qualRulesStore.push(rule);
    res.status(201).json(rule);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/qual-rules/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  const idx = qualRulesStore.findIndex(r => r.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  qualRulesStore[idx] = { ...qualRulesStore[idx], ...req.body, id };
  res.json(qualRulesStore[idx]);
});
router.delete('/qual-rules/:id', auth, (req, res) => {
  const id = Number(req.params.id);
  const before = qualRulesStore.length;
  qualRulesStore = qualRulesStore.filter(r => r.id !== id);
  if (qualRulesStore.length === before) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
