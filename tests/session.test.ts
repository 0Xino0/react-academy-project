import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSessionStore, normalizeAuthResponse, SessionChangedError, SessionDataError } from '../src/services/session.ts';
import { MemoryStorage, payload } from './helpers.ts';

test('login and refresh use the same normalized user shape and string id', () => {
  const store = createSessionStore(new MemoryStorage());
  assert.equal(store.saveAuth(payload()).user.id, '1');
  const epoch = store.getEpoch();
  const next = store.refreshAuth(payload('next-token'), 'old-token', epoch);
  assert.equal(next.user.id, '1');
  assert.equal(next.user.firstName, 'Test');
  assert.equal(store.getEpoch(), epoch);
});

test('role selection is deterministic when the API returns several roles', () => {
  assert.equal(normalizeAuthResponse(payload('token', ['student', 'teacher', 'manager'])).user.role, 'manager');
  assert.equal(normalizeAuthResponse(payload('token', ['student', 'teacher'])).user.role, 'teacher');
});

for (const roles of [[], ['unknown']]) {
  test(`unknown or absent roles are rejected without leaving a token: ${JSON.stringify(roles)}`, () => {
    const storage = new MemoryStorage();
    const store = createSessionStore(storage);
    assert.throws(() => store.saveAuth(payload('token', roles)), SessionDataError);
    assert.equal(storage.getItem('token'), null);
    assert.equal(store.getSnapshot(), null);
  });
}

for (const token of ['', 'undefined', 'null']) {
  test(`invalid token is rejected before persisting: ${JSON.stringify(token)}`, () => {
    const store = createSessionStore(new MemoryStorage());
    assert.throws(() => store.saveAuth(payload(token)), SessionDataError);
    assert.equal(store.getSnapshot(), null);
  });
}

for (const userJson of ['{broken', JSON.stringify({ id: {}, role: 'student' }), JSON.stringify({ id: 1, role: 'unknown' })]) {
  test(`damaged storage is cleared without a JSON parse crash: ${userJson}`, () => {
    const storage = new MemoryStorage();
    storage.setItem('token', 'token');
    storage.setItem('user', userJson);
    const store = createSessionStore(storage);
    assert.equal(store.getSnapshot(), null);
    assert.equal(storage.getItem('token'), null);
    assert.equal(storage.getItem('user'), null);
  });
}

test('an orphaned token is not treated as a session', () => {
  const storage = new MemoryStorage();
  storage.setItem('token', 'token');
  assert.equal(createSessionStore(storage).getSnapshot(), null);
  assert.equal(storage.getItem('token'), null);
});

test('legacy numeric stored ids are read as strings and snapshots remain stable', () => {
  const storage = new MemoryStorage();
  storage.setItem('token', 'token');
  storage.setItem('user', JSON.stringify({ id: 1, email: 'user@example.test', firstName: 'Test', lastName: 'User', role: 'student' }));
  const store = createSessionStore(storage);
  const first = store.getSnapshot();
  assert.equal(first?.user.id, '1');
  assert.strictEqual(store.getSnapshot(), first);
});

test('failed persistence clears both keys rather than leaving a partial login', () => {
  const storage = new MemoryStorage();
  storage.setItem = (key, value) => {
    if (key === 'user') throw new Error('Quota reached');
    storage.values.set(key, value);
  };
  const store = createSessionStore(storage);
  assert.throws(() => store.saveAuth(payload()), /could not save the session/);
  assert.equal(storage.getItem('token'), null);
  assert.equal(store.getSnapshot(), null);
});

test('unavailable browser storage produces a controlled login error', () => {
  const store = createSessionStore(null);
  assert.equal(store.getSnapshot(), null);
  assert.throws(() => store.saveAuth(payload()), /could not save the session/);
});

test('logout remains local even if stored keys cannot be removed', () => {
  const storage = new MemoryStorage();
  const store = createSessionStore(storage);
  store.saveAuth(payload());
  storage.removeItem = () => { throw new Error('Read-only storage'); };
  store.clear();
  assert.equal(store.getSnapshot(), null);
  assert.equal(store.getSnapshot(), null);
});

test('stale refresh cannot restore a logged-out session', () => {
  const store = createSessionStore(new MemoryStorage());
  store.saveAuth(payload());
  const epoch = store.getEpoch();
  store.clear();
  assert.throws(() => store.refreshAuth(payload('new'), 'old-token', epoch), SessionChangedError);
  assert.equal(store.getSnapshot(), null);
});

test('stale refresh cannot replace a new login or clear it', () => {
  const store = createSessionStore(new MemoryStorage());
  store.saveAuth(payload());
  const oldEpoch = store.getEpoch();
  store.saveAuth(payload('other-token', ['teacher'], 2));
  assert.throws(() => store.refreshAuth(payload('late-token'), 'old-token', oldEpoch), SessionChangedError);
  assert.equal(store.clear('old-token', oldEpoch), false);
  assert.equal(store.getSnapshot()?.user.id, '2');
});

test('a refresh response for another account is rejected', () => {
  const store = createSessionStore(new MemoryStorage());
  store.saveAuth(payload());
  assert.throws(() => store.refreshAuth(payload('other-token', ['student'], 2), 'old-token', store.getEpoch()), SessionDataError);
  assert.equal(store.getSnapshot()?.user.id, '1');
});

test('same-tab updates and cross-tab logout notify subscribers and stop cleanly', () => {
  const storage = new MemoryStorage();
  let externalChange = () => {};
  let stopped = 0;
  let notifications = 0;
  const store = createSessionStore(storage, notify => { externalChange = notify; return () => { stopped += 1; }; });
  const unsubscribe = store.subscribe(() => { notifications += 1; });
  store.saveAuth(payload());
  assert.equal(notifications, 1);
  const epoch = store.getEpoch();
  storage.removeItem('token');
  storage.removeItem('user');
  externalChange();
  assert.equal(store.getSnapshot(), null);
  assert.ok(store.getEpoch() > epoch);
  assert.equal(notifications, 2);
  unsubscribe();
  assert.equal(stopped, 1);
});
