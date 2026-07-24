const router = require('express').Router();
const authenticate = require('../middleware/auth');
const db = require('../db');

router.post('/recommendation', authenticate, async (req, res, next) => {
  try {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt || prompt.length > 4000) return res.status(400).json({ error: { code: 'INVALID_PROMPT', message: 'Prompt must contain 1-4000 characters' } });
    const apiKey = String(process.env.OPENROUTER_API_KEY || '').trim();
    const model = String(process.env.OPENROUTER_MODEL || '').trim();
    const baseUrl = String(process.env.OPENROUTER_BASE_URL || '').replace(/\/$/, '');
    if (!apiKey || !model || !baseUrl) return res.status(503).json({ error: { code: 'AI_NOT_CONFIGURED', message: 'AI provider is not configured' } });
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Give concise semiconductor supply-chain traceability guidance. Flag uncertainty and never invent authoritative source records.' }, { role: 'user', content: prompt }], max_tokens: 180 }),
      signal: AbortSignal.timeout(45000),
    });
    const payload = await response.json().catch(() => ({}));
    const content = payload?.choices?.[0]?.message?.content?.trim();
    if (!response.ok || !payload.id || !content) throw new Error(`OpenRouter request failed with HTTP ${response.status}`);
    const receipt = (await db.query(
      `INSERT INTO sc_ai_provider_receipts(user_id,provider,provider_request_id,model,prompt,content)
       VALUES($1,'openrouter',$2,$3,$4,$5) RETURNING id,provider,provider_request_id,model,created_at`,
      [req.user.id, String(payload.id), String(payload.model || model), prompt, content],
    )).rows[0];
    res.json({ content, receipt });
  } catch (error) { next(error); }
});

module.exports = router;
