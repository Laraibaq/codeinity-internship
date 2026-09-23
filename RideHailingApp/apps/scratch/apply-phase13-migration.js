const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { Client } = require('e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/pg');
const fs = require('fs');
const crypto = require('crypto');

const envPath = 'e:/code/codeinity-internship/RideHailingApp/apps/backend/.env';
const env = fs.readFileSync(envPath, 'utf8');
const dbUrl = env.match(/DATABASE_URL=([^\r\n]+)/)[1].trim().replace(/^['"]|['"]$/g, '');

async function main() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const migrationName = '20260922194500_add_admin_and_audit_logs';
  const sqlPath = `e:/code/codeinity-internship/RideHailingApp/apps/backend/prisma/migrations/${migrationName}/migration.sql`;
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const checksum = crypto.createHash('sha256').update(sqlContent).digest('hex');

  console.log(`[Migration] Applying DDL for ${migrationName}...`);
  await client.query(sqlContent);
  console.log(`[Migration] DDL successfully applied to PostgreSQL.`);

  const id = crypto.randomUUID();
  const now = new Date();
  await client.query(`
    INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [id, checksum, now, migrationName, null, null, now, 1]);
  console.log(`[Migration] Successfully registered in _prisma_migrations (checksum=${checksum}).`);

  await client.end();
}

main().catch(err => {
  console.error('[Migration Error]', err);
  process.exit(1);
});
