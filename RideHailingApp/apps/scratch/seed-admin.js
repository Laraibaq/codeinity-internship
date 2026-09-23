const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const { Client } = require('e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/pg');
const argon2 = require('e:/code/codeinity-internship/RideHailingApp/apps/backend/node_modules/argon2');
const fs = require('fs');

const envPath = 'e:/code/codeinity-internship/RideHailingApp/apps/backend/.env';
const env = fs.readFileSync(envPath, 'utf8');
const dbUrl = env.match(/DATABASE_URL=([^\r\n]+)/)[1].trim().replace(/^['"]|['"]$/g, '');

async function main() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const email = 'admin@ridehailing.pk';
  const password = 'AdminSecret123!';
  const name = 'System Administrator';

  const existing = await client.query('SELECT id, email FROM admins WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    console.log(`[Admin Seed] Admin ${email} already exists with id ${existing.rows[0].id}.`);
  } else {
    const passwordHash = await argon2.hash(password);
    const res = await client.query(`
      INSERT INTO admins (email, "passwordHash", name, role, "isActive", "updatedAt")
      VALUES ($1, $2, $3, 'admin', true, NOW())
      RETURNING id, email, name, role
    `, [email, passwordHash, name]);
    console.log(`[Admin Seed] Created admin successfully:`, res.rows[0]);
  }

  await client.end();
}

main().catch(err => {
  console.error('[Admin Seed Error]', err);
  process.exit(1);
});
