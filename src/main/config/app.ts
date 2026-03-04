import express from "express";
import router from '../routes/routes.js';
import { errorHandler } from '../middleware/errorHandler.js';

const app = express();

function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed === '*') {
    return trimmed;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

function readAllowedOrigins(rawValue: string | undefined): Set<string> {
  const fallback = 'http://localhost:3000,http://127.0.0.1:3000';
  const source = rawValue?.trim().length ? rawValue : fallback;

  return new Set(
    source
      .split(',')
      .map((value) => normalizeOrigin(value))
      .filter((value): value is string => value !== null)
      .filter((value) => value.length > 0)
  );
}

app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigins = readAllowedOrigins(process.env.CORS_ORIGINS);
  const requestOrigin = req.headers.origin;
  const origin = Array.isArray(requestOrigin) ? requestOrigin[0] : requestOrigin;
  const normalizedOrigin = origin !== undefined ? normalizeOrigin(origin) : null;

  if (normalizedOrigin !== null && (allowedOrigins.has(normalizedOrigin) || allowedOrigins.has('*'))) {
    res.header('Access-Control-Allow-Origin', normalizedOrigin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

app.get('/', (req, res) => {
  res.send("Example of the response");
});

app.use(router);
app.use(errorHandler);

export default app;
