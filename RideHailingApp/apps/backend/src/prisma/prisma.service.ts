import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dns from 'dns';
import { PrismaClient } from '../../generated/prisma/client';

// Prisma 7's client no longer reads DATABASE_URL on its own -- it requires an explicit driver
// adapter. prisma.config.ts's datasource.url is CLI-only (migrate/introspect); the running app
// needs its own connection wired up here.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly pool: Pool;

  constructor() {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch {}

    const poolConfig: any = {
      connectionString: process.env.DATABASE_URL,
      lookup: (hostname: string, options: any, callback: any) => {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }
        dns.resolve4(hostname, (err, addresses) => {
          if (!err && addresses && addresses.length > 0) {
            if (options && options.all) {
              return callback(
                null,
                addresses.map((a) => ({ address: a, family: 4 })),
              );
            }
            return callback(null, addresses[0], 4);
          }
          dns.lookup(hostname, options, callback);
        });
      },
    };

    const pool = new Pool(poolConfig);

    super({
      adapter: new PrismaPg(pool),
    });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
