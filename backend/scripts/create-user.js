const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
const bcrypt = require('bcryptjs');
const db = require('../db');

async function main() {
  const [emailArg, roleArg, nameArg] = process.argv.slice(2);
  const password = process.env.SEMICHAIN_INITIAL_PASSWORD;
  const email = emailArg?.trim().toLowerCase(); const role = roleArg?.trim().toLowerCase();
  if (!email || !['operator', 'planner', 'quality', 'integration', 'admin'].includes(role) || !nameArg || !password || password.length < 12) {
    throw new Error('Usage: SEMICHAIN_INITIAL_PASSWORD=<12+ chars> npm run user:create -- email role name');
  }
  const hash = await bcrypt.hash(password, 12);
  await db.query(`INSERT INTO users (email,password_hash,name,role) VALUES ($1,$2,$3,$4)
    ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash,name=EXCLUDED.name,role=EXCLUDED.role`, [email, hash, nameArg.trim(), role]);
  console.log(`User ${email} created or rotated with role ${role}`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
