import { useSyncExternalStore } from 'react';
import { sessionStore } from '../services/session';

export function useSession() {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot, () => null);
}
