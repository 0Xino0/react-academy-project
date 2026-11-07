import type { ApiSchedule, ApiSchedulesResponse } from '../types/Schedule.ts';
import type { Term, TermsResponse } from '../types/Terms.ts';
import { academicErrorMessage } from './academics.ts';
import { scheduleErrorMessage } from './schedules.ts';
import { enrollmentError } from './registrations.ts';

interface PersonalClass {
  id: number;
  term_id: number;
}

export interface PersonalClassesApi<T extends PersonalClass> {
  getTerms(): Promise<TermsResponse>;
  getClasses(termId: number): Promise<{ status: boolean; message: string; classes: T[] }>;
  getSchedules(termId: number): Promise<ApiSchedulesResponse>;
  cancelRegistration?(row: T): Promise<{ status: boolean; message: string }>;
}

export interface PersonalClassesState<T extends PersonalClass> {
  ownerId?: string;
  selectedTerm: number | '';
  terms: Term[];
  loadingTerms: boolean;
  termsError: string | null;
  classes: T[];
  loadingClasses: boolean;
  classesError: string | null;
  isScheduleModalOpen: boolean;
  schedules: ApiSchedule[];
  loadingSchedules: boolean;
  schedulesError: string | null;
  selectedClass: T | null;
  cancelling: boolean;
  cancellationError: string | null;
}

function initialState<T extends PersonalClass>(ownerId?: string): PersonalClassesState<T> {
  return {
    ownerId, selectedTerm: '', terms: [], loadingTerms: true, termsError: null,
    classes: [], loadingClasses: false, classesError: null,
    isScheduleModalOpen: false, schedules: [], loadingSchedules: false, schedulesError: null,
    selectedClass: null, cancelling: false, cancellationError: null,
  };
}

export function createPersonalClassesController<T extends PersonalClass>(api: PersonalClassesApi<T>, ownerId?: string) {
  let state = initialState<T>(ownerId);
  let active = false;
  let lifetime = 0;
  let context = 0;
  let classesRequest = 0;
  let scheduleRequest = 0;
  const listeners = new Set<() => void>();
  const currentContext = (version: number) => active && version === context;
  const update = (patch: Partial<PersonalClassesState<T>>) => {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  };
  const resetSchedule = () => {
    scheduleRequest += 1;
    return { isScheduleModalOpen: false, schedules: [], loadingSchedules: false, schedulesError: null };
  };

  async function loadTerms(version: number) {
    try {
      const response = await api.getTerms();
      if (!active || version !== lifetime) return;
      if (!response.status) throw new Error(response.message || 'Unable to load terms.');
      update({ terms: response.terms });
    } catch (error) {
      if (active && version === lifetime) update({ termsError: academicErrorMessage(error, 'Failed to fetch terms. Please try again later.') });
    } finally {
      if (active && version === lifetime) update({ loadingTerms: false });
    }
  }

  async function loadClasses(term: number, version: number, request: number) {
    const current = () => currentContext(version) && request === classesRequest && state.selectedTerm === term;
    try {
      const response = await api.getClasses(term);
      if (!current()) return;
      if (!response.status) throw new Error(response.message || 'Unable to load classes.');
      update({ classes: response.classes });
    } catch (error) {
      if (current()) update({ classesError: academicErrorMessage(error, 'Failed to fetch classes. Please try again later.') });
    } finally {
      if (current()) update({ loadingClasses: false });
    }
  }

  async function openSchedule() {
    if (!active || !state.selectedTerm || state.isScheduleModalOpen || state.selectedClass) return;
    const term = state.selectedTerm;
    const version = context;
    const request = ++scheduleRequest;
    const current = () => currentContext(version) && request === scheduleRequest
      && state.selectedTerm === term && state.isScheduleModalOpen;
    // Open before awaiting so the user can see loading and close immediately.
    update({ isScheduleModalOpen: true, schedules: [], loadingSchedules: true, schedulesError: null });
    try {
      const response = await api.getSchedules(term);
      if (!current()) return;
      if (!response.status) throw new Error(response.message || 'Unable to load schedules.');
      update({ schedules: response.schedules });
    } catch (error) {
      if (current()) update({ schedulesError: scheduleErrorMessage(error, 'Failed to fetch schedules. Please try again later.') });
    } finally {
      if (current()) update({ loadingSchedules: false });
    }
  }

  async function confirmCancellation() {
    const row = state.selectedClass;
    if (!active || !row || !api.cancelRegistration || state.cancelling) return;
    const version = context;
    update({ cancelling: true, cancellationError: null });
    try {
      const response = await api.cancelRegistration(row);
      if (!currentContext(version)) return;
      if (!response.status) throw new Error(response.message || 'Enrollment could not be cancelled.');
      classesRequest += 1;
      update({
        classes: state.classes.filter(item => item.id !== row.id), loadingClasses: false,
        ...resetSchedule(), selectedClass: null, cancelling: false, cancellationError: null,
      });
    } catch (error) {
      if (currentContext(version)) update({ cancellationError: enrollmentError(error, 'Enrollment could not be cancelled.') });
    } finally {
      if (currentContext(version) && state.cancelling) update({ cancelling: false });
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start() {
      const version = ++lifetime;
      active = true;
      context += 1;
      classesRequest += 1;
      scheduleRequest += 1;
      state = initialState<T>(ownerId);
      listeners.forEach(listener => listener());
      void loadTerms(version);
      return () => {
        if (version !== lifetime) return;
        active = false;
        lifetime += 1;
        context += 1;
        classesRequest += 1;
        scheduleRequest += 1;
      };
    },
    selectTerm(term: number | '') {
      if (!active || state.cancelling || term === state.selectedTerm || (term !== '' && (!Number.isInteger(term) || term <= 0))) return;
      context += 1;
      const request = ++classesRequest;
      update({
        selectedTerm: term, classes: [], loadingClasses: !!term, classesError: null,
        ...resetSchedule(), selectedClass: null, cancelling: false, cancellationError: null,
      });
      if (term) void loadClasses(term, context, request);
    },
    openSchedule,
    closeSchedule() {
      if (active) update(resetSchedule());
    },
    openCancellation(classId: number) {
      if (!active || !api.cancelRegistration || state.cancelling || state.loadingClasses) return;
      const row = state.classes.find(item => item.id === classId && item.term_id === state.selectedTerm);
      if (row) update({ ...resetSchedule(), selectedClass: row, cancellationError: null });
    },
    closeCancellation() {
      if (active && !state.cancelling) update({ selectedClass: null, cancellationError: null });
    },
    confirmCancellation,
  };
}
