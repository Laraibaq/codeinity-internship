import 'dotenv/config';
import * as dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  const origLookup = dns.lookup;
  (dns as any).lookup = (hostname: string, options: any, callback: any) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    if (hostname && typeof hostname === 'string' && hostname.includes('supabase.com')) {
      dns.resolve4(hostname, (err, addresses) => {
        if (!err && addresses && addresses.length > 0) {
          if (options && options.all) {
            return callback(null, addresses.map((a) => ({ address: a, family: 4 })));
          }
          return callback(null, addresses[0], 4);
        }
        return origLookup(hostname, options, callback);
      });
    } else {
      return origLookup(hostname, options, callback);
    }
  };
} catch {}
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Security Headers via Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Mobile & SPA API-friendly
    }),
  );

  // Configurable CORS: Allow mobile apps (no origin), configured production origins, or dev localhost
  const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : [];

  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const allowedOrigins = new Set([...configuredOrigins, ...defaultOrigins]);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. native mobile app, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.has(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin '${origin}' not allowed by policy`), false);
    },
    credentials: true,
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();

