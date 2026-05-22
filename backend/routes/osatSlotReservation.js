const express = require('express');
const router = express.Router();

let reservations = [
  { id: 1, osat: 'ASE Kaohsiung', package: '2.5D CoWoS', week: '2026-W23', slots: 14, customer: 'AI accelerator', status: 'held' },
  { id: 2, osat: 'Amkor Korea', package: 'FCBGA', week: '2026-W24', slots: 9, customer: 'Networking ASIC', status: 'risk' },
  { id: 3, osat: 'JCET', package: 'QFN', week: '2026-W23', slots: 22, customer: 'Power controller', status: 'confirmed' }
];

router.get('/', (_req, res) => {
  const summary = reservations.reduce((acc, row) => {
    acc.total += 1;
    acc.slots += Number(row.slots || 0);
    acc.risk += row.status === 'risk' ? 1 : 0;
    return acc;
  }, { total: 0, slots: 0, risk: 0 });
  res.json({ reservations, summary });
});

router.post('/', (req, res) => {
  const item = {
    id: Date.now(),
    osat: req.body.osat || 'OSAT TBD',
    package: req.body.package || 'package TBD',
    week: req.body.week || 'week TBD',
    slots: Number(req.body.slots || 0),
    customer: req.body.customer || 'customer TBD',
    status: req.body.status || 'held'
  };
  reservations = [item, ...reservations];
  res.status(201).json(item);
});

module.exports = router;
