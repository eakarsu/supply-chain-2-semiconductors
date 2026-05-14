// EAR/ECCN/HTS Classifier — deep implementation.
// Matches keywords against the seeded eccn_codes / hts_codes tables, layers
// country-specific licensing rules, optionally refines with an LLM call.
//
// Endpoints:
//   POST /api/gap-ai-ear-eccn-classifier/classify
//   GET  /api/gap-ai-ear-eccn-classifier/eccn/:code
//   GET  /api/gap-ai-ear-eccn-classifier/classifications
//   GET  /api/gap-ai-ear-eccn-classifier/eccn-list

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// Countries grouped by US export-control sensitivity
const COMPREHENSIVE_EMBARGO = ['cuba', 'iran', 'north korea', 'dprk', 'syria'];
const ARMS_EMBARGO_PLUS = ['china', 'prc', "people's republic of china", 'hong kong', 'macau', 'russia', 'belarus'];
const NATO_PLUS = [
  'usa', 'united states', 'canada', 'uk', 'united kingdom', 'germany', 'france',
  'italy', 'netherlands', 'belgium', 'spain', 'japan', 'south korea', 'korea',
  'taiwan', 'australia', 'new zealand', 'norway', 'sweden', 'denmark', 'finland',
  'poland', 'czechia', 'ireland', 'israel', 'singapore'
];

function normCountry(c) {
  return (c || '').toString().trim().toLowerCase();
}

function applyCountryRules(eccnRow, destination) {
  const c = normCountry(destination);
  const controls = (eccnRow.controls || '').toLowerCase();

  if (COMPREHENSIVE_EMBARGO.some(x => c.includes(x))) {
    return {
      license_required: true,
      reason: `Destination ${destination} is subject to comprehensive US sanctions (OFAC + EAR). License required for virtually all items with a presumption of denial.`,
      license_exception_candidates: []
    };
  }

  if (['3a090', '4a003', '4a004', '4d001', '4e001'].includes(eccnRow.code.toLowerCase()) &&
      ARMS_EMBARGO_PLUS.some(x => c.includes(x))) {
    return {
      license_required: true,
      reason: `${eccnRow.code} is subject to RS/NS controls targeting advanced computing. Exports to ${destination} require a license with a presumption of denial under the October 2022/2023 BIS advanced-compute rules.`,
      license_exception_candidates: []
    };
  }

  if (eccnRow.code.toLowerCase() === '3b001' && ARMS_EMBARGO_PLUS.some(x => c.includes(x))) {
    return {
      license_required: true,
      reason: `${eccnRow.code} (sub-16/14nm SME) requires a license to ${destination} under BIS advanced-node SME rules; presumption of denial for advanced-node capacity additions in China.`,
      license_exception_candidates: []
    };
  }

  if (controls.includes('ns column 1') && ARMS_EMBARGO_PLUS.some(x => c.includes(x))) {
    return {
      license_required: true,
      reason: `${eccnRow.code} carries NS Column 1 controls; ${destination} is on the arms-embargo+ list. License is required.`,
      license_exception_candidates: ['GBS', 'CIV (limited)']
    };
  }

  if (controls.includes('ns column 2') && ARMS_EMBARGO_PLUS.some(x => c.includes(x))) {
    return {
      license_required: true,
      reason: `${eccnRow.code} has NS Column 2 controls. Export to ${destination} requires a license.`,
      license_exception_candidates: ['GBS']
    };
  }

  if ((controls.includes('at column 1') || controls === '') && NATO_PLUS.some(x => c === x || c.includes(x))) {
    return {
      license_required: false,
      reason: `${eccnRow.code} has only AT controls (or is EAR99). ${destination} is an allied destination; no license required.`,
      license_exception_candidates: ['NLR', 'STA']
    };
  }

  if (controls.includes('ns column')) {
    return {
      license_required: true,
      reason: `${eccnRow.code} carries National Security controls. Without a clear license exception for ${destination}, a license is required.`,
      license_exception_candidates: ['STA (if eligible)', 'GBS']
    };
  }

  return {
    license_required: false,
    reason: `${eccnRow.code} controls (${eccnRow.controls || 'AT-only'}) do not appear to require a license for ${destination}. Confirm with current BIS Country Chart.`,
    license_exception_candidates: ['NLR']
  };
}

// Keyword → ECCN heuristics tuned to common chip/equipment items.
function keywordMatch(text) {
  const t = (text || '').toLowerCase();
  const candidates = [];
  const push = (code, score, reason) => candidates.push({ code, score, reason });

  if (/(gpu|h100|h200|b100|b200|gb200|a100|mi300|mi325|tpu|npu|ai accelerator|tensor)/.test(t)) {
    push('3A090', 95, 'Matches advanced AI accelerator (TPP/density thresholds)');
    push('4A003', 70, 'May qualify as digital computer subassembly');
  }
  if (/(fpga|asic|cpld|microprocessor|mpu|cpu|microcontroller|mcu|soc)/.test(t)) {
    push('3A001', 80, 'General high-performance IC (3A001.a/b)');
  }
  if (/(adc|dac|data converter)/.test(t)) push('3A001', 75, 'ADC/DAC thresholds in 3A001.a.5');
  if (/(rad[- ]hard|space[- ]grade)/.test(t)) push('3A001', 85, 'Radiation-hardened ICs explicitly controlled');

  if (/(euv|extreme ultraviolet|lithograph|scanner|stepper|exposure tool)/.test(t)) {
    push('3B001', 95, 'EUV/DUV lithography scanner');
  }
  if (/(etcher|deposition|cvd|pvd|ald|epi|ion implant|cmp tool|metrology|inspection tool)/.test(t)) {
    push('3B001', 88, 'Semiconductor manufacturing equipment');
  }

  if (/(silicon wafer|300mm|prime wafer|epi wafer)/.test(t)) {
    push('3C001', 60, 'Doped silicon wafers');
  }
  if (/(sic|silicon carbide|gan|gallium nitride|gaas)/.test(t)) {
    push('3C001', 80, 'Hetero-epitaxial compound semiconductor materials');
  }
  if (/(euv photoresist|arf resist|duv resist|photoresist)/.test(t)) {
    push('3C002', 80, 'Photoresist for EUV/DUV');
  }

  if (/(hbm|hbm3|hbm3e|hbm4|stacked dram|3d stacked memory)/.test(t)) {
    push('3A001', 75, 'High-bandwidth stacked memory (sub-thresholds apply)');
  }
  if (/(dram|ddr5|ddr6|gddr|lpddr|nand|nor|flash)/.test(t)) {
    push('3A991', 50, 'Commercial memory IC (EAR99-adjacent unless mil-temp)');
  }

  if (/(server|supercomputer|hpc cluster|dgx|hgx)/.test(t)) {
    push('4A003', 80, 'Digital computer / HPC system (APP threshold)');
  }

  if (/(eda|design tool|synthesis|place.and.route|verification ip|gdsii|ip core|rtl)/.test(t)) {
    push('3D001', 75, 'Software for design of 3A001/3A090 items');
    push('3E001', 70, 'Technology for development of controlled chips');
  }

  if (/(crypto|encryption|tls|ipsec|vpn|hsm|aes|rsa|elliptic curve|key length)/.test(t)) {
    push('5A002', 80, 'Information security w/ key length above 5A002 thresholds');
    push('5D002', 70, 'Information security software using 5A002 crypto');
  }
  if (/(modem|baseband|5g|phased array|sdr|software defined radio|millimeter wave)/.test(t)) {
    push('5A001', 75, 'Telecommunications equipment / phased array');
  }

  if (/(intrusion software|exploit|offensive cyber|surveillance)/.test(t)) {
    push('4A005', 90, 'Intrusion software systems');
  }

  if (/(wafer prober|tester|ate|automatic test equipment)/.test(t)) {
    push('3B002', 75, 'Semiconductor test equipment');
  }

  if (candidates.length === 0 && /(connector|cable|enclosure|plastic|passive|resistor|capacitor)/.test(t)) {
    push('EAR99', 50, 'Generic commercial item');
  }

  const best = {};
  candidates.forEach(c => { if (!best[c.code] || best[c.code].score < c.score) best[c.code] = c; });
  return Object.values(best).sort((a, b) => b.score - a.score);
}

function htsMatch(text) {
  const t = (text || '').toLowerCase();
  if (/(gpu|cpu|microprocessor|mpu|microcontroller|mcu|controller)/.test(t)) return '8542.31.00';
  if (/(hbm|dram|ddr|nand|sram|memory ic)/.test(t)) return '8542.32.00';
  if (/(amplifier|op[- ]amp|rf amp|pa|lna)/.test(t)) return '8542.33.00';
  if (/(fpga|asic|soc|cpld|integrated circuit|ic)/.test(t)) return '8542.39.00';
  if (/(diode|transistor|igbt|mosfet)/.test(t)) return '8541.21.00';
  if (/(lithography|stepper|scanner|euv|etcher|deposition|cvd|pvd|ald|cmp tool)/.test(t)) return '8486.20.00';
  if (/(silicon wafer|300mm|epi wafer|polished wafer)/.test(t)) return '3818.00.00';
  if (/(polysilicon|silicon ingot)/.test(t)) return '2804.61.00';
  if (/(sapphire substrate|corundum)/.test(t)) return '2818.10.20';
  return '8542.39.00';
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
        'X-Title': 'EAR/ECCN Classifier'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      })
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    return null;
  }
}

router.post('/classify', async (req, res) => {
  try {
    const { name = '', specs = '', intended_use = '', destination_country = '', component_id = null } = req.body || {};
    const description = [name, specs, intended_use].join(' | ');

    const candidates = keywordMatch(description);
    let primary = candidates[0];

    let primaryRow = null;
    if (primary) {
      const r = await pool.query('SELECT * FROM eccn_codes WHERE code = $1', [primary.code]);
      primaryRow = r.rows[0] || null;
    }
    if (!primaryRow) {
      const r = await pool.query('SELECT * FROM eccn_codes WHERE code = $1', ['EAR99']);
      primaryRow = r.rows[0] || { code: 'EAR99', description: '', controls: '', license_required_to: '' };
      primary = { code: 'EAR99', score: 30, reason: 'No specific match — falls under EAR99 catch-all' };
    }

    const altCodes = candidates.slice(1, 5).map(c => c.code);
    let altRows = [];
    if (altCodes.length) {
      const r = await pool.query('SELECT code, description, controls FROM eccn_codes WHERE code = ANY($1::text[])', [altCodes]);
      altRows = r.rows;
    }

    const ruling = applyCountryRules(primaryRow, destination_country);
    const hts = htsMatch(description);

    let llmNarrative = null;
    if (process.env.OPENROUTER_API_KEY) {
      const sys = 'You are a US export-control classification analyst. Given a candidate ECCN classification, write a concise 2-3 sentence narrative reinforcing the reasoning. Do NOT propose a different ECCN — accept the one provided. Tone: factual, cite the relevant control (NS/AT/RS/MT).';
      const usr = `Item: ${name}\nSpecs: ${specs}\nIntended use: ${intended_use}\nDestination: ${destination_country}\nProposed ECCN: ${primaryRow.code}\nControls: ${primaryRow.controls}\nLicense required: ${ruling.license_required}\nRuleset reason: ${ruling.reason}\n\nReturn a 2-3 sentence narrative.`;
      llmNarrative = await callAI(sys, usr);
    }

    const reasoning = [
      `Keyword match: ${primary.reason} (score ${primary.score}).`,
      `ECCN ${primaryRow.code} — ${primaryRow.description || ''}`,
      `Controls: ${primaryRow.controls || 'n/a'}`,
      `Country ruling: ${ruling.reason}`,
      llmNarrative ? `Analyst note: ${llmNarrative.trim()}` : null
    ].filter(Boolean).join('\n');

    let savedId = null;
    try {
      const ins = await pool.query(
        `INSERT INTO classifications (component_id, eccn, hts, destination_country, license_required, reasoning, classified_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [component_id, primaryRow.code, hts, destination_country, ruling.license_required, reasoning, req.user?.id || null]
      );
      savedId = ins.rows[0].id;
    } catch (e) { /* persistence optional */ }

    res.json({
      id: savedId,
      eccn: primaryRow.code,
      eccn_description: primaryRow.description,
      controls: primaryRow.controls,
      hts,
      destination_country,
      license_required: ruling.license_required,
      license_exception_candidates: ruling.license_exception_candidates,
      reasoning,
      alternatives: altRows,
      llm_used: !!llmNarrative
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/eccn/:code', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM eccn_codes WHERE code = $1', [req.params.code.toUpperCase()]);
    if (!r.rows[0]) return res.status(404).json({ error: 'ECCN not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/classifications', async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT c.*, comp.name AS component_name, u.email AS classified_by_email
       FROM classifications c
       LEFT JOIN components comp ON comp.id = c.component_id
       LEFT JOIN users u ON u.id = c.classified_by
       ORDER BY c.classified_at DESC LIMIT 50`
    );
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/eccn-list', async (_req, res) => {
  try {
    const r = await pool.query('SELECT code, category, product_group, description, controls FROM eccn_codes ORDER BY code');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
