import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from './app.js';

async function withServer(app, run) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('health endpoint reports liveness without claiming database readiness', async () => {
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: { status: 'ok' } });
  });
});

test('readiness returns 503 when the database is disconnected', async () => {
  await withServer(createApp({ isDatabaseReady: () => false }), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/ready`);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, 'DATABASE_UNAVAILABLE');
  });
});

test('readiness returns 200 only when the database is connected', async () => {
  await withServer(createApp({ isDatabaseReady: () => true }), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/ready`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: { status: 'ready' } });
  });
});

test('CORS does not allow an origin outside the configured allowlist', async () => {
  await withServer(
    createApp({ allowedOrigins: ['https://attend.example'] }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/health`, {
        headers: { Origin: 'https://untrusted.example' },
      });
      assert.equal(response.headers.get('access-control-allow-origin'), null);
    }
  );
});

test('CORS allows a configured frontend origin with credentials', async () => {
  await withServer(
    createApp({ allowedOrigins: ['http://localhost:3000'] }),
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/health`, {
        headers: { Origin: 'http://localhost:3000' },
      });
      assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
      assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
    }
  );
});

test('malformed JSON receives a safe client error', async () => {
  await withServer(createApp(), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/unused`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid',
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'INVALID_JSON');
  });
});