const router = require('express').Router();
const auth = require('../middleware/auth');
const service = require('../src/workflowService');

const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
router.use(auth);

router.get('/dashboard', asyncRoute(async (_req, res) => res.json(await service.dashboard())));
router.get('/events', asyncRoute(async (req, res) => res.json({ events: await service.events(req.query) })));
router.post('/events', auth.requireRole('integration', 'admin'), asyncRoute(async (req, res) => {
  const result = await service.ingest(req.body); res.status(result.replayed ? 200 : 202).json(result);
}));
router.post('/reconciliation', auth.requireRole('integration', 'admin'), asyncRoute(async (req, res) => res.json(await service.reconcile(req.body))));
router.get('/transitions/:entityType/:entityId', asyncRoute(async (req, res) => res.json({ transitions: await service.transitions(req.params.entityType, req.params.entityId) })));

router.post('/plans', auth.requireRole('planner', 'admin'), asyncRoute(async (req, res) => res.status(201).json(await service.createPlan(req.user, req.body))));
router.get('/plans/:id', asyncRoute(async (req, res) => res.json(await service.getPlan(req.params.id))));
router.post('/plans/:id/approval', auth.requireRole('planner', 'admin'), asyncRoute(async (req, res) => res.json(await service.approvePlan(req.user, req.params.id, req.body))));
router.post('/plans/:id/rollback', auth.requireRole('planner', 'admin'), asyncRoute(async (req, res) => res.json(await service.rollbackPlan(req.user, req.params.id, req.body))));

router.post('/exceptions/:id/decision', auth.requireRole('quality', 'admin'), asyncRoute(async (req, res) => res.json(await service.decideException(req.user, req.params.id, req.body))));
router.post('/change-orders', auth.requireRole('planner', 'admin'), asyncRoute(async (req, res) => res.status(201).json(await service.createChangeOrder(req.user, req.body))));
router.post('/change-orders/:id/decision', auth.requireRole('admin'), asyncRoute(async (req, res) => res.json(await service.decideChangeOrder(req.user, req.params.id, req.body))));
router.post('/change-orders/:id/apply', auth.requireRole('admin'), asyncRoute(async (req, res) => res.json(await service.applyChangeOrder(req.user, req.params.id))));
router.post('/change-orders/:id/rollback', auth.requireRole('admin'), asyncRoute(async (req, res) => res.json(await service.rollbackChangeOrder(req.user, req.params.id, req.body))));

module.exports = router;
