require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/components', require('./routes/components'));
app.use('/api/allocations', require('./routes/allocations'));
app.use('/api/risk-alerts', require('./routes/risk_alerts'));
app.use('/api/fabs', require('./routes/fabs'));
app.use('/api/intelligence', require('./routes/intelligence'));
app.use('/api/audit-log', require('./routes/audit_log'));
app.use('/api/export', require('./routes/export'));
app.use('/api/search', require('./routes/search'));
app.use('/api/admin', require('./routes/sample_data'));
app.use('/api/dashboard', require('./routes/dashboard'));

const PORT = process.env.PORT || 3015;
app.listen(PORT, () => console.log(`SemiChain backend running on port ${PORT}`));
app.use('/api/gap-ai-cowos-tracker', require('./routes/gap-ai-cowos-tracker'));
app.use('/api/gap-ai-hbm-booking-monitor', require('./routes/gap-ai-hbm-booking-monitor'));
app.use('/api/gap-ai-ear-eccn-classifier', require('./routes/gap-ai-ear-eccn-classifier'));
app.use('/api/gap-ai-tier-n-discovery', require('./routes/gap-ai-tier-n-discovery'));
app.use('/api/gap-ai-wafer-yield-ml', require('./routes/gap-ai-wafer-yield-ml'));
app.use('/api/gap-nonai-edi-sap-connector', require('./routes/gap-nonai-edi-sap-connector'));
app.use('/api/gap-nonai-realtime-allocation', require('./routes/gap-nonai-realtime-allocation'));
app.use('/api/gap-nonai-hts-eccn-lookup', require('./routes/gap-nonai-hts-eccn-lookup'));
app.use('/api/gap-nonai-factory-weather-feed', require('./routes/gap-nonai-factory-weather-feed'));
app.use('/api/gap-nonai-po-generation', require('./routes/gap-nonai-po-generation'));
app.use('/api/gap-nonai-multiparty-dataroom', require('./routes/gap-nonai-multiparty-dataroom'));
app.use('/api/cf-tier-n-graph', require('./routes/cf-tier-n-graph'));
app.use('/api/cf-cowos-calendar', require('./routes/cf-cowos-calendar'));
app.use('/api/cf-eccn-live-update', require('./routes/cf-eccn-live-update'));
app.use('/api/cf-disaster-risk-overlay', require('./routes/cf-disaster-risk-overlay'));
app.use('/api/cf-auto-reshuffle-agent', require('./routes/cf-auto-reshuffle-agent'));

// Custom views (4 endpoints) - mounted BEFORE 404 handler
app.use('/api/custom-views', require('./routes/customViews'));

// Health endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'semichain', ts: new Date().toISOString() }));

// 404 handler (must be last)
app.use('/api', (req, res) => res.status(404).json({ error: 'Not Found', path: req.originalUrl }));
