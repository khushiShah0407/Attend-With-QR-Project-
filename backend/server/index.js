import 'dotenv/config';
import http from 'node:http';
import mongoose from 'mongoose';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI;
const configuredOrigins = (process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = configuredOrigins.length > 0
  ? configuredOrigins
  : process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const app = createApp({
  allowedOrigins,
  isDatabaseReady: () => mongoose.connection.readyState === 1,
});
const server = http.createServer(app);

async function shutdown() {
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
}

async function start() {
  if (process.env.NODE_ENV === 'production' && !mongoUri) {
    console.error('API startup failed: MONGODB_URI is required in production.');
    process.exitCode = 1;
    return;
  }

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    } catch (error) {
      console.error(`API startup failed: MongoDB connection unavailable (${error.name}).`);
      process.exitCode = 1;
      return;
    }
  }

  server.listen(port, () => {
    console.info(`Attend With QR API listening on port ${port}.`);
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

start();