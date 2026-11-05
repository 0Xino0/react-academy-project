import { AxiosError, AxiosHeaders } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type { SessionStorage } from '../src/services/session.ts';

export class MemoryStorage implements SessionStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

export function payload(token = 'old-token', roles = ['student'], id = 1) {
  return { status: 'success', access_token: token, token_type: 'bearer', expires_in: 3600,
    user: { id, email: 'user@example.test', first_name: 'Test', last_name: 'User', roles: roles.map(name => ({ name })) } };
}

export function response(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  return { config, data, status, statusText: String(status), headers: new AxiosHeaders() };
}

export function rejectStatus(config: InternalAxiosRequestConfig, status = 401): never {
  throw new AxiosError('Request rejected', AxiosError.ERR_BAD_REQUEST, config, undefined, response(config, {}, status));
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
