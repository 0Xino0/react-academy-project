import axios, { type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { normalizeAuthResponse, SessionChangedError, SessionDataError } from './session.ts';
import type { Session, SessionStore } from './session.ts';

interface SessionRequest extends InternalAxiosRequestConfig {
  _sessionToken?: string;
  _sessionEpoch?: number;
  _retry?: boolean;
}

interface ClientOptions {
  baseURL: string;
  store: SessionStore;
  adapter?: AxiosAdapter;
  onUnauthorized?: () => void;
}

interface PendingRefresh {
  token: string;
  epoch: number;
  replacementToken?: string;
  promise: Promise<Session>;
}

function authEndpoint(url?: string): boolean {
  return /(?:^|\/)auth\/(login|register|refresh|logout)(?:[?#]|$)/.test(url ?? '');
}

export function createHttpClient({ baseURL, store, adapter, onUnauthorized = () => {} }: ClientOptions) {
  const options = { baseURL, adapter, timeout: 15000, headers: { Accept: 'application/json' } };
  const api = axios.create(options);
  // Auth calls never enter the API's refresh interceptor.
  const auth = axios.create(options);
  let pending: PendingRefresh | null = null;

  const expire = (token: string, epoch: number) => {
    if (store.clear(token, epoch)) onUnauthorized();
  };

  function refresh(token: string, epoch: number): Promise<Session> {
    if (pending?.token === token && pending.epoch === epoch) return pending.promise;
    const operation: PendingRefresh = { token, epoch, promise: auth.post('/auth/refresh', undefined, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        const session = normalizeAuthResponse(data);
        operation.replacementToken = session.token;
        return store.refreshAuth(data, token, epoch);
      })
      .catch(error => {
        if (error instanceof SessionDataError || (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0))) {
          expire(token, epoch);
        }
        throw error;
      })
      .finally(() => { if (pending === operation) pending = null; }) };
    pending = operation;
    return operation.promise;
  }

  api.interceptors.request.use(config => {
    const request = config as SessionRequest;
    const session = store.getSnapshot();
    const epoch = store.getEpoch();
    if (request._sessionEpoch !== undefined && request._sessionEpoch !== epoch) throw new SessionChangedError();
    request._sessionEpoch = epoch;
    request._sessionToken = session?.token;
    if (session) request.headers.set('Authorization', `Bearer ${session.token}`);
    else request.headers.delete('Authorization');
    return request;
  });

  api.interceptors.response.use(response => response, async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config || authEndpoint(error.config.url)) throw error;
    const request = error.config as SessionRequest;
    const token = request._sessionToken;
    const epoch = request._sessionEpoch;
    const current = store.getSnapshot();
    if (!token || epoch === undefined || !current || store.getEpoch() !== epoch) throw error;
    if (request._retry) {
      expire(token, epoch);
      throw error;
    }
    request._retry = true;
    // A delayed 401 may arrive after another request already rotated the token.
    if (current.token === token) await refresh(token, epoch);
    if (store.getEpoch() !== epoch || !store.getSnapshot()) throw new SessionChangedError();
    return api(request);
  });

  async function logout(): Promise<void> {
    const session = store.getSnapshot();
    const epoch = store.getEpoch();
    const activeRefresh = pending?.epoch === epoch ? pending : null;
    store.clear();
    if (!session) return;
    if (activeRefresh) await activeRefresh.promise.catch(() => undefined);
    let token = activeRefresh?.replacementToken ?? session.token;
    try {
      await auth.post('/auth/logout', undefined, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;
      // An expired token can still be refreshable. Revoke its replacement without restoring local state.
      try {
        const { data } = await auth.post('/auth/refresh', undefined, { headers: { Authorization: `Bearer ${token}` } });
        token = normalizeAuthResponse(data).token;
      } catch (refreshError) {
        if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) return;
        throw refreshError;
      }
      await auth.post('/auth/logout', undefined, { headers: { Authorization: `Bearer ${token}` } });
    }
  }

  return { api, auth, logout };
}
