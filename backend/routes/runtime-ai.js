const router = require('express').Router();
const authenticate = require('../middleware/auth');
const db = require('../db');
const { failure, requestScope, providerAdvice, freshUser, saveReceipt } = require('../src/runtimeAdvisory');

router.get('/recommendation', authenticate, async (req, res) => {
  try { await freshUser(db, req.user.id); const rows = (await db.query(`SELECT id,prompt,content,model,created_at FROM sc_ai_provider_receipts WHERE user_id=$1 AND provider='openrouter' ORDER BY created_at DESC,id DESC LIMIT 50`, [req.user.id])).rows;
    res.json({ reports: rows.map(row => ({ id: String(row.id), prompt: row.prompt, content: row.content, model: row.model, createdAt: row.created_at })) });
  } catch (error) { res.status(error.status || 500).json({ error: { code: error.code || 'AI_HISTORY_FAILED', message: error.status ? error.message : 'Saved advisory reports could not be loaded.' } }); }
});
router.post('/recommendation', authenticate, async (req, res) => {
  const scope = requestScope(req, res);
  try {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt || prompt.length > 4000) throw failure(400, 'INVALID_PROMPT', 'Prompt must contain 1–4000 characters.');
    await freshUser(db, req.user.id); scope.signal.throwIfAborted();
    const evidence = await providerAdvice(prompt, 'Give concise semiconductor supply-chain traceability guidance. Flag uncertainty and never invent authoritative source records. Do not approve quality release or authorize allocation.', 'SemiChain traceability advisory', 180, scope.signal);
    const receipt = await saveReceipt(db, scope.signal, req.user.id, async transaction => (await transaction.query(`INSERT INTO sc_ai_provider_receipts(user_id,provider,provider_request_id,model,prompt,content) VALUES($1,'openrouter',$2,$3,$4,$5) RETURNING id,provider,provider_request_id,model,created_at`, [req.user.id, evidence.receipt.id, evidence.receipt.model, prompt, evidence.content])).rows[0]);
    scope.signal.throwIfAborted(); res.json({ id: String(receipt.id), content: evidence.content, receipt, model: receipt.model, createdAt: receipt.created_at });
  } catch (error) { if (scope.signal.aborted || res.destroyed) return; res.status(error.status || 502).json({ error: { code: error.code || 'AI_PROVIDER_FAILED', message: error.status ? error.message : 'OpenRouter could not complete the advisory report.' } }); }
  finally { scope.dispose(); }
});
module.exports = router;
