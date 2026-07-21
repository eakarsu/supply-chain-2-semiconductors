const bcrypt = require('bcryptjs');
const db = require('../db');

function disposableIdentity() {
  if (process.env.NODE_ENV !== 'test' || process.env.ALLOW_DISPOSABLE_SEED !== 'YES') {
    throw new Error('create-admin is restricted to an acknowledged disposable test runtime');
  }
  const database = new URL(process.env.DATABASE_URL || '');
  if (!['127.0.0.1', 'localhost', '::1'].includes(database.hostname)) throw new Error('create-admin requires a loopback database');
  const email = String(process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '');
  const name = String(process.env.PROVISION_ADMIN_NAME || 'Runtime Acceptance').trim();
  if (!email || password.length < 12 || !name) throw new Error('Acceptance administrator credentials are incomplete');
  return { email, password, name };
}

async function main() {
  const { email, password, name } = disposableIdentity();
  const passwordHash = await bcrypt.hash(password, 12);
  await db.query(`INSERT INTO users (email,password_hash,name,role) VALUES ($1,$2,$3,'admin')
    ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash,name=EXCLUDED.name,role='admin'`, [email, passwordHash, name]);
  console.log(`Provisioned disposable administrator ${email}`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
