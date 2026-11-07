import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { createPersonalClassesController } from '../services/personalClasses';
import type { PersonalClassesApi } from '../services/personalClasses';
import { useSession } from './useSession';

export function usePersonalClasses<T extends { id: number; term_id: number }>(api: PersonalClassesApi<T>) {
  const ownerId = useSession()?.user.id;
  const controller = useMemo(() => createPersonalClassesController(api, ownerId), [api, ownerId]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => controller.start(), [controller]);
  return { state, controller };
}
