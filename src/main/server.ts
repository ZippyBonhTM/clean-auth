import process from 'process';
import 'dotenv/config';

import app from '@/main/config/app.js';
import { connectMongo, disconnectMongo } from '@/infrastructure/mongoose/connect.js';

type UserDataSource = 'memory' | 'mongo';

function readMongoUri(): string | null {
  const uri =
    process.env.MONGO_URI ??
    process.env.MONGODB_URI ??
    process.env.MONGODB_URL ??
    process.env.MONGO_URL ??
    process.env.DATABASE_URL ??
    null;

  if (uri === null) {
    return null;
  }

  const trimmed = uri.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function resolveDataSource(): UserDataSource {
  const configured = process.env.DATA_SOURCE;

  if (configured === undefined || configured.trim().length === 0) {
    return 'memory';
  }

  if (configured === 'memory' || configured === 'mongo') {
    return configured;
  }

  throw new Error('Invalid DATA_SOURCE. Use memory | mongo.');
}

function readPort(): number {
  const rawPort = process.env.PORT ?? process.env.APPLICATION_PORT ?? '';
  const port = Number.parseInt(rawPort, 10);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid port. Set PORT (or APPLICATION_PORT) with a valid value.');
  }

  return port;
}

async function bootstrap(): Promise<void> {
  const dataSource = resolveDataSource();
  const mongoUri = readMongoUri();
  const port = readPort();

  if (dataSource === 'mongo') {
    if (mongoUri === null) {
      throw new Error('DATA_SOURCE=mongo requires MONGO_URI (or fallback variable).');
    }

    await connectMongo(mongoUri);
  }

  const server = app.listen(port, () => {
    console.log(`Auth listening on port ${String(port)} (source=${dataSource})`);
  });

  async function shutdown(signal: string): Promise<void> {
    console.log(`Received ${signal}. Shutting down.`);

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    if (dataSource === 'mongo') {
      await disconnectMongo();
    }
  }

  process.on('SIGINT', () => {
    shutdown('SIGINT')
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        console.error(`Shutdown error: ${String(error)}`);
        process.exit(1);
      });
  });

  process.on('SIGTERM', () => {
    shutdown('SIGTERM')
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        console.error(`Shutdown error: ${String(error)}`);
        process.exit(1);
      });
  });
}

bootstrap().catch(async (error: unknown) => {
  console.error(`Startup error: ${String(error)}`);

  try {
    await disconnectMongo();
  } catch {
    // ignore cleanup errors
  }

  process.exit(1);
});
