import type { User } from '../types/auth.ts';

export interface Session {
  token: string;
  user: User;
}

export interface SessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class SessionDataError extends Error {
  constructor() {
    super('Unable to start your session. Please check your account with the academy.');
    this.name = 'SessionDataError';
  }
}

export class SessionChangedError extends Error {
  constructor() {
    super('Your session has changed. Please try again.');
    this.name = 'SessionChangedError';
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validToken(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && !['undefined', 'null'].includes(value);
}

function userId(value: unknown): string | null {
  return (typeof value === 'number' || typeof value === 'string') && /^[1-9]\d*$/.test(String(value))
    ? String(value) : null;
}

function isRole(value: unknown): value is User['role'] {
  return value === 'manager' || value === 'teacher' || value === 'student';
}

function storedUser(value: unknown): User | null {
  if (!record(value) || !userId(value.id) || typeof value.email !== 'string' || !value.email.trim()
    || typeof value.firstName !== 'string' || typeof value.lastName !== 'string' || !isRole(value.role)) {
    return null;
  }
  return { id: String(value.id), email: value.email, firstName: value.firstName, lastName: value.lastName, role: value.role };
}

export function normalizeAuthResponse(value: unknown): Session {
  if (!record(value) || value.status !== 'success' || !validToken(value.access_token)
    || !record(value.user) || !Array.isArray(value.user.roles)) {
    throw new SessionDataError();
  }
  const source = value.user;
  const roles = source.roles as unknown[];
  const role = (['manager', 'teacher', 'student'] as const)
    .find(candidate => roles.some(item => record(item) && item.name === candidate));
  const user = storedUser({ id: source.id, email: source.email, firstName: source.first_name, lastName: source.last_name, role });
  if (!user) throw new SessionDataError();
  return { token: value.access_token, user };
}

export function createSessionStore(storage: SessionStorage | null, listen?: (notify: () => void) => () => void) {
  let snapshot: Session | null = null;
  let fingerprint: string | null = null;
  let epoch = 0;
  let unavailable = false;
  let stopListening: (() => void) | undefined;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(listener => listener());

  function removeStoredSession() {
    let removed = true;
    try { storage?.removeItem('token'); } catch { removed = false; }
    try { storage?.removeItem('user'); } catch { removed = false; }
    return removed;
  }

  function getSnapshot(): Session | null {
    if (unavailable) return null;
    try {
      const token = storage?.getItem('token') ?? null;
      const userJson = storage?.getItem('user') ?? null;
      const currentFingerprint = JSON.stringify([token, userJson]);
      if (currentFingerprint === fingerprint) return snapshot;
      if (fingerprint !== null) epoch += 1;
      fingerprint = currentFingerprint;
      const user = userJson ? storedUser(JSON.parse(userJson)) : null;
      snapshot = validToken(token) && user ? { token, user } : null;
      if (!snapshot && (token !== null || userJson !== null)) {
        unavailable = !removeStoredSession();
        fingerprint = JSON.stringify([null, null]);
      }
    } catch {
      snapshot = null;
      epoch += 1;
      unavailable = !removeStoredSession();
      fingerprint = JSON.stringify([null, null]);
    }
    return snapshot;
  }

  function persist(session: Session, newLogin: boolean): Session {
    const userJson = JSON.stringify(session.user);
    try {
      if (!storage) throw new Error('Storage unavailable');
      storage.setItem('token', session.token);
      storage.setItem('user', userJson);
    } catch {
      removeStoredSession();
      unavailable = true;
      snapshot = null;
      epoch += 1;
      notify();
      throw new Error('Your browser could not save the session. Please allow site storage and try again.');
    }
    unavailable = false;
    snapshot = session;
    fingerprint = JSON.stringify([session.token, userJson]);
    if (newLogin) epoch += 1;
    notify();
    return session;
  }

  function matches(token: string, expectedEpoch: number): boolean {
    return getSnapshot()?.token === token && epoch === expectedEpoch;
  }

  return {
    getSnapshot,
    getEpoch: () => { getSnapshot(); return epoch; },
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1 && listen) stopListening = listen(() => { getSnapshot(); notify(); });
      return () => {
        listeners.delete(listener);
        if (!listeners.size) { stopListening?.(); stopListening = undefined; }
      };
    },
    saveAuth(payload: unknown): Session {
      const session = normalizeAuthResponse(payload);
      getSnapshot();
      return persist(session, true);
    },
    refreshAuth(payload: unknown, token: string, expectedEpoch: number): Session {
      if (!matches(token, expectedEpoch)) throw new SessionChangedError();
      const session = normalizeAuthResponse(payload);
      if (session.user.id !== snapshot?.user.id) throw new SessionDataError();
      return persist(session, false);
    },
    clear(token?: string, expectedEpoch?: number): boolean {
      if (token !== undefined && (expectedEpoch === undefined || !matches(token, expectedEpoch))) return false;
      unavailable = !removeStoredSession();
      snapshot = null;
      fingerprint = JSON.stringify([null, null]);
      epoch += 1;
      notify();
      return true;
    },
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;

function browserStorage(): SessionStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; } catch { return null; }
}

export const sessionStore = createSessionStore(browserStorage(), notify => {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === 'token' || event.key === 'user') notify();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
});
