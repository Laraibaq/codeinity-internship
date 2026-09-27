require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('./generated/prisma/client');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const users = await prisma.user.findMany({
    include: { driver: true }
  });
  console.log(JSON.stringify(users.map(u => ({
    id: u.id,
    email: u.email,
    phone: u.phone,
    role: u.role,
    driver: u.driver ? {
      id: u.driver.id,
      verificationStatus: u.driver.verificationStatus,
      isOnline: u.driver.isOnline
    } : null
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
