import express from "express";
import router from '../routes/routes.js';
import { errorHandler } from '../middleware/errorHandler.js';

const app = express();

function readAllowedOrigins(rawValue: string | undefined): Set<string> {
  const fallback = 'http://localhost:3000,http://127.0.0.1:3000';
  const source = rawValue?.trim().length ? rawValue : fallback;

  return new Set(
    source
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
  );
}

app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigins = readAllowedOrigins(process.env.CORS_ORIGINS);
  const requestOrigin = req.headers.origin;
  const origin = Array.isArray(requestOrigin) ? requestOrigin[0] : requestOrigin;

  if (origin && (allowedOrigins.has(origin) || allowedOrigins.has('*'))) {
    res.header('Access-Control-Allow-Origin', origin);
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
