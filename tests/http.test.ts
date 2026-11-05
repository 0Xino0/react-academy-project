import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import axios from 'axios';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { createHttpClient } from '../src/services/http.ts';
import { createSessionStore } from '../src/services/session.ts';
import { deferred, MemoryStorage, payload, rejectStatus, response } from './helpers.ts';

const bearer = (config: InternalAxiosRequestConfig) => config.headers.get('Authorization');

function setup(adapter: AxiosAdapter) {
  const store = createSessionStore(new MemoryStorage());
  store.saveAuth(payload());
  let redirects = 0;
  const client = createHttpClient({ baseURL: 'https://academy.test/api/v1', store, adapter,
    onUnauthorized: () => { redirects += 1; } });
  return { store, ...client, redirects: () => redirects };
}

test('expired request refreshes once and retries with the new bearer', async () => {
  const calls: string[] = [];
  const { api, store } = setup(async config => {
    calls.push(`${config.url} ${bearer(config)}`);
    if (config.url === '/auth/refresh') return response(config, payload('new-token'));
    if (bearer(config) === 'Bearer old-token') return rejectStatus(config);
    return response(config, { ok: true });
  });
  assert.equal((await api.get('/courses')).data.ok, true);
  assert.equal(store.getSnapshot()?.token, 'new-token');
  assert.deepEqual(calls, ['/courses Bearer old-token', '/auth/refresh Bearer old-token', '/courses Bearer new-token']);
});

test('concurrent 401 requests share one refresh', async () => {
  const gate = deferred<ReturnType<typeof payload>>();
  const started = deferred<void>();
  let refreshes = 0;
  const { api } = setup(async config => {
    if (config.url === '/auth/refresh') { refreshes += 1; started.resolve(); return response(config, await gate.promise); }
    if (bearer(config) === 'Bearer old-token') return rejectStatus(config);
    return response(config, { ok: true });
  });
  const requests = [api.get('/courses'), api.get('/terms'), api.get('/classes')];
  await started.promise;
  await setImmediate();
  assert.equal(refreshes, 1);
  gate.resolve(payload('new-token'));
  assert.equal((await Promise.all(requests)).length, 3);
  assert.equal(refreshes, 1);
});

test('a delayed old-token 401 reuses a completed refresh', async () => {
  const late = deferred<void>();
  let refreshes = 0;
  const { api } = setup(async config => {
    if (config.url === '/auth/refresh') { refreshes += 1; return response(config, payload('new-token')); }
    if (bearer(config) === 'Bearer old-token') {
      if (config.url === '/late') await late.promise;
      return rejectStatus(config);
    }
    return response(config, {});
  });
  const delayed = api.get('/late');
  await api.get('/first');
  late.resolve();
  await delayed;
  assert.equal(refreshes, 1);
});

test('refresh rejection expires the session once without recursive refresh', async () => {
  let refreshes = 0;
  const { api, store, redirects } = setup(async config => {
    if (config.url === '/auth/refresh') refreshes += 1;
    return rejectStatus(config);
  });
  const results = await Promise.allSettled([api.get('/one'), api.get('/two')]);
  assert.ok(results.every(result => result.status === 'rejected'));
  assert.equal(refreshes, 1);
  assert.equal(store.getSnapshot(), null);
  assert.equal(redirects(), 1);
});

test('a second 401 after refresh stops retrying', async () => {
  let refreshes = 0;
  let attempts = 0;
  const { api, store } = setup(async config => {
    if (config.url === '/auth/refresh') { refreshes += 1; return response(config, payload('new-token')); }
    attempts += 1;
    return rejectStatus(config);
  });
  await assert.rejects(api.get('/courses'));
  assert.equal(refreshes, 1);
  assert.equal(attempts, 2);
  assert.equal(store.getSnapshot(), null);
});

test('login with bad credentials never triggers refresh or changes an existing session', async () => {
  const calls: string[] = [];
  const { auth, api, store } = setup(async config => {
    calls.push(config.url ?? '');
    if (config.url === '/auth/login') assert.equal(bearer(config), undefined);
    return rejectStatus(config);
  });
  await assert.rejects(auth.post('/auth/login', {}));
  await assert.rejects(api.post('/auth/register', {}));
  assert.deepEqual(calls, ['/auth/login', '/auth/register']);
  assert.equal(store.getSnapshot()?.token, 'old-token');
});

test('403 does not refresh or remove a valid session', async () => {
  let requests = 0;
  const { api, store } = setup(async config => { requests += 1; return rejectStatus(config, 403); });
  await assert.rejects(api.get('/admin'));
  assert.equal(requests, 1);
  assert.equal(store.getSnapshot()?.token, 'old-token');
});

for (const failure of ['network', 'server']) {
  test(`temporary ${failure} failure during refresh preserves the session`, async () => {
    const { api, store, redirects } = setup(async config => {
      if (config.url !== '/auth/refresh') return rejectStatus(config);
      if (failure === 'server') return rejectStatus(config, 500);
      throw new Error('Network unavailable');
    });
    await assert.rejects(api.get('/courses'));
    assert.equal(store.getSnapshot()?.token, 'old-token');
    assert.equal(redirects(), 0);
  });
}

test('missing error config is safely rejected', async () => {
  const { api } = setup(async () => { throw new axios.AxiosError('Missing config'); });
  await assert.rejects(api.get('/courses'), /Missing config/);
});

test('malformed refresh payload is rejected and clears the expired session', async () => {
  const { api, store } = setup(async config => config.url === '/auth/refresh'
    ? response(config, { access_token: 'undefined' }) : rejectStatus(config));
  await assert.rejects(api.get('/courses'));
  assert.equal(store.getSnapshot(), null);
});

test('a late refresh response cannot overwrite another login', async () => {
  const gate = deferred<ReturnType<typeof payload>>();
  const started = deferred<void>();
  const { api, store } = setup(async config => {
    if (config.url !== '/auth/refresh') return rejectStatus(config);
    started.resolve();
    return response(config, await gate.promise);
  });
  const request = api.get('/courses');
  const result = assert.rejects(request);
  await started.promise;
  store.saveAuth(payload('other-token', ['teacher'], 2));
  gate.resolve(payload('late-token'));
  await result;
  assert.equal(store.getSnapshot()?.token, 'other-token');
});

test('a late refresh failure cannot clear another login', async () => {
  const gate = deferred<void>();
  const started = deferred<void>();
  const { api, store, redirects } = setup(async config => {
    if (config.url !== '/auth/refresh') return rejectStatus(config);
    started.resolve();
    await gate.promise;
    return rejectStatus(config);
  });
  const result = assert.rejects(api.get('/courses'));
  await started.promise;
  store.saveAuth(payload('other-token', ['teacher'], 2));
  gate.resolve();
  await result;
  assert.equal(store.getSnapshot()?.token, 'other-token');
  assert.equal(redirects(), 0);
});

test('a response from an old session is not retried with another account credentials', async () => {
  const gate = deferred<void>();
  const started = deferred<void>();
  const calls: string[] = [];
  const { api, store } = setup(async config => {
    calls.push(`${config.url} ${bearer(config)}`);
    started.resolve();
    await gate.promise;
    return rejectStatus(config);
  });
  const result = assert.rejects(api.get('/courses'));
  await started.promise;
  store.saveAuth(payload('other-token', ['teacher'], 2));
  gate.resolve();
  await result;
  assert.deepEqual(calls, ['/courses Bearer old-token']);
  assert.equal(store.getSnapshot()?.user.id, '2');
});

test('a request without a stored session never tries refresh', async () => {
  let calls = 0;
  const { api, store } = setup(async config => { calls += 1; return rejectStatus(config); });
  store.clear();
  await assert.rejects(api.get('/courses'));
  assert.equal(calls, 1);
});

test('logout revokes the current bearer and clears local state', async () => {
  const calls: string[] = [];
  const { logout, store } = setup(async config => { calls.push(`${config.url} ${bearer(config)}`); return response(config, {}); });
  await logout();
  assert.deepEqual(calls, ['/auth/logout Bearer old-token']);
  assert.equal(store.getSnapshot(), null);
});

test('logout while refresh is pending also revokes its replacement', async () => {
  const gate = deferred<ReturnType<typeof payload>>();
  const started = deferred<void>();
  const revoked: string[] = [];
  const { api, logout, store } = setup(async config => {
    if (config.url === '/auth/logout') { revoked.push(String(bearer(config))); return response(config, {}); }
    if (config.url === '/auth/refresh') { started.resolve(); return response(config, await gate.promise); }
    return rejectStatus(config);
  });
  const rejected = assert.rejects(api.get('/courses'));
  await started.promise;
  const signingOut = logout();
  assert.equal(store.getSnapshot(), null);
  gate.resolve(payload('replacement-token'));
  await Promise.all([rejected, signingOut]);
  assert.deepEqual(revoked, ['Bearer replacement-token']);
  assert.equal(store.getSnapshot(), null);
});

test('logout with an expired token refreshes and revokes it without saving a session', async () => {
  const calls: string[] = [];
  const { logout, store } = setup(async config => {
    calls.push(`${config.url} ${bearer(config)}`);
    if (config.url === '/auth/refresh') return response(config, payload('replacement-token'));
    if (bearer(config) === 'Bearer old-token') return rejectStatus(config);
    assert.equal(store.getSnapshot(), null);
    return response(config, {});
  });
  await logout();
  assert.deepEqual(calls, ['/auth/logout Bearer old-token', '/auth/refresh Bearer old-token', '/auth/logout Bearer replacement-token']);
  assert.equal(store.getSnapshot(), null);
});

test('already revoked logout is terminal and does not loop', async () => {
  let calls = 0;
  const { logout, store } = setup(async config => { calls += 1; return rejectStatus(config); });
  await logout();
  assert.equal(calls, 2);
  assert.equal(store.getSnapshot(), null);
});

test('offline logout clears this device but reports unconfirmed server sign-out', async () => {
  const { logout, store } = setup(async () => { throw new Error('Offline'); });
  await assert.rejects(logout(), /Offline/);
  assert.equal(store.getSnapshot(), null);
});

test('completing an old logout does not clear a new session', async () => {
  const gate = deferred<void>();
  const { logout, store } = setup(async config => { await gate.promise; return response(config, {}); });
  const signingOut = logout();
  store.saveAuth(payload('other-token', ['teacher'], 2));
  gate.resolve();
  await signingOut;
  assert.equal(store.getSnapshot()?.token, 'other-token');
});
