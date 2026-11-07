import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import axios from 'axios';
import { createPersonalClassesController } from '../../src/services/personalClasses.ts';
import type { PersonalClassesApi } from '../../src/services/personalClasses.ts';
import { createAcademicsApi } from '../../src/services/academics.ts';
import { createSchedulesApi } from '../../src/services/schedules.ts';
import { createRegistrationsApi } from '../../src/services/registrations.ts';
import type { Term, TermsResponse } from '../../src/types/Terms.ts';
import type { ApiSchedule, ApiSchedulesResponse } from '../../src/types/Schedule.ts';
import { response, rejectStatus } from '../helpers.ts';

interface Row { id: number; term_id: number }
const row = (term = 1, id = 10): Row => ({ id, term_id: term });
const schedule = (term = 1, id = 100): ApiSchedule => ({
  id, class_id: 10, day_of_week: 'monday', start_time: '09:00:00', end_time: '10:00:00',
  class: { id: 10, term_id: term, name: 'Personal class', start_date: '2026-03-21' },
} as ApiSchedule);
const terms = [1, 2].map(id => ({ id, season: 'fall', year: 1405 })) as Term[];
const classesResponse = (classes: Row[]) => ({ status: true, message: '', classes });
const schedulesResponse = (schedules: ApiSchedule[]) => ({ status: true, message: '', schedules });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function harness(student = true, ownerId = 'owner-1') {
  const termCalls: ReturnType<typeof deferred<TermsResponse>>[] = [];
  const classCalls: { term: number; result: ReturnType<typeof deferred<ReturnType<typeof classesResponse>>> }[] = [];
  const scheduleCalls: { term: number; result: ReturnType<typeof deferred<ApiSchedulesResponse>> }[] = [];
  const cancelCalls: { row: Row; result: ReturnType<typeof deferred<{ status: boolean; message: string }>> }[] = [];
  const api: PersonalClassesApi<Row> = {
    getTerms() { const result = deferred<TermsResponse>(); termCalls.push(result); return result.promise; },
    getClasses(term) {
      const result = deferred<ReturnType<typeof classesResponse>>();
      classCalls.push({ term, result }); return result.promise;
    },
    getSchedules(term) {
      const result = deferred<ApiSchedulesResponse>();
      scheduleCalls.push({ term, result }); return result.promise;
    },
    ...(student ? {
      cancelRegistration(selected: Row) {
        const result = deferred<{ status: boolean; message: string }>();
        cancelCalls.push({ row: selected, result }); return result.promise;
      },
    } : {}),
  };
  const controller = createPersonalClassesController(api, ownerId);
  const stop = controller.start();
  return { controller, stop, termCalls, classCalls, scheduleCalls, cancelCalls };
}

const flush = () => setImmediate();
async function loadClasses(h: ReturnType<typeof harness>, list = [row()]) {
  h.termCalls[0].resolve({ status: true, message: '', terms });
  h.controller.selectTerm(1);
  h.classCalls[0].result.resolve(classesResponse(list));
  await flush();
}

test('initial loading is separate, and missing or invalid term never dispatches a schedule request', async () => {
  const h = harness(false);
  assert.equal(h.controller.getSnapshot().loadingTerms, true);
  for (const invalid of ['', 0, -1, 1.5] as const) h.controller.selectTerm(invalid);
  await h.controller.openSchedule();
  assert.equal(h.classCalls.length, 0);
  assert.equal(h.scheduleCalls.length, 0);
  h.termCalls[0].resolve({ status: true, message: '', terms: [] });
  await flush();
  assert.equal(h.controller.getSnapshot().loadingTerms, false);
  assert.deepEqual(h.controller.getSnapshot().terms, []);
  assert.equal(h.controller.getSnapshot().termsError, null);
});

test('opening is immediate, clears previous data, and repeated clicks send only one request', async () => {
  const h = harness(false);
  await loadClasses(h);
  const pending = h.controller.openSchedule();
  assert.equal(h.controller.getSnapshot().isScheduleModalOpen, true);
  assert.equal(h.controller.getSnapshot().loadingSchedules, true);
  assert.deepEqual(h.controller.getSnapshot().schedules, []);
  await h.controller.openSchedule();
  assert.equal(h.scheduleCalls.length, 1);
  h.scheduleCalls[0].result.resolve(schedulesResponse([schedule()]));
  await pending;
  assert.equal(h.controller.getSnapshot().loadingSchedules, false);
  assert.deepEqual(h.controller.getSnapshot().schedules, [schedule()]);
  h.controller.closeSchedule();
  const next = h.controller.openSchedule();
  assert.deepEqual(h.controller.getSnapshot().schedules, []);
  h.scheduleCalls[1].result.resolve(schedulesResponse([]));
  await next;
  assert.deepEqual(h.controller.getSnapshot().schedules, []);
  assert.equal(h.controller.getSnapshot().schedulesError, null);
});

for (const fail of [false, true]) {
  test('old class ' + (fail ? 'failure' : 'success') + ' cannot replace a new term or finish its loading state', async () => {
    const h = harness(false);
    h.controller.selectTerm(1);
    h.controller.selectTerm(2);
    const current = h.controller.getSnapshot();
    if (fail) h.classCalls[0].result.reject(new Error('Old term error'));
    else h.classCalls[0].result.resolve(classesResponse([row()]));
    await flush();
    assert.strictEqual(h.controller.getSnapshot(), current);
    assert.equal(current.loadingClasses, true);
    h.classCalls[1].result.resolve(classesResponse([row(2, 20)]));
    await flush();
    assert.deepEqual(h.controller.getSnapshot().classes, [row(2, 20)]);
    assert.equal(h.controller.getSnapshot().classesError, null);
    assert.equal(h.controller.getSnapshot().loadingClasses, false);
  });

  test('closed schedule ignores late ' + (fail ? 'errors' : 'success') + ' without reopening the dialog', async () => {
    const h = harness();
    await loadClasses(h);
    const pending = h.controller.openSchedule();
    h.controller.closeSchedule();
    const closed = h.controller.getSnapshot();
    if (fail) h.scheduleCalls[0].result.reject(new Error('Late error'));
    else h.scheduleCalls[0].result.resolve(schedulesResponse([schedule()]));
    await pending;
    assert.strictEqual(h.controller.getSnapshot(), closed);
    assert.equal(closed.isScheduleModalOpen, false);
    assert.equal(closed.loadingSchedules, false);
    assert.equal(closed.schedulesError, null);
  });

  test('close and reopen in the same term ignores older ' + (fail ? 'errors' : 'rows'), async () => {
    const h = harness();
    await loadClasses(h);
    const first = h.controller.openSchedule();
    h.controller.closeSchedule();
    const second = h.controller.openSchedule();
    const fresh = h.controller.getSnapshot();
    if (fail) h.scheduleCalls[0].result.reject(new Error('Old open failed'));
    else h.scheduleCalls[0].result.resolve(schedulesResponse([schedule(1, 101)]));
    await first;
    assert.strictEqual(h.controller.getSnapshot(), fresh);
    assert.equal(fresh.loadingSchedules, true);
    h.scheduleCalls[1].result.resolve(schedulesResponse([schedule(1, 102)]));
    await second;
    assert.deepEqual(h.controller.getSnapshot().schedules, [schedule(1, 102)]);
  });

  test('term change and a new open ignore late schedule ' + (fail ? 'errors' : 'rows'), async () => {
    const h = harness();
    await loadClasses(h);
    const first = h.controller.openSchedule();
    h.controller.selectTerm(2);
    assert.equal(h.controller.getSnapshot().isScheduleModalOpen, false);
    const second = h.controller.openSchedule();
    h.scheduleCalls[1].result.resolve(schedulesResponse([schedule(2, 200)]));
    await second;
    const fresh = h.controller.getSnapshot();
    if (fail) h.scheduleCalls[0].result.reject(new Error('Old term failed'));
    else h.scheduleCalls[0].result.resolve(schedulesResponse([schedule()]));
    await first;
    assert.strictEqual(h.controller.getSnapshot(), fresh);
    assert.equal(fresh.selectedTerm, 2);
    assert.deepEqual(fresh.schedules, [schedule(2, 200)]);
  });
}

test('returning to the original term does not make its first class or schedule request current again', async () => {
  const h = harness();
  h.controller.selectTerm(1);
  const firstSchedule = h.controller.openSchedule();
  h.controller.selectTerm(2);
  h.controller.selectTerm(1);
  const lastSchedule = h.controller.openSchedule();
  h.classCalls[2].result.resolve(classesResponse([row(1, 12)]));
  h.scheduleCalls[1].result.resolve(schedulesResponse([schedule(1, 102)]));
  await lastSchedule;
  await flush();
  const current = h.controller.getSnapshot();
  h.classCalls[0].result.resolve(classesResponse([row(1, 10)]));
  h.classCalls[1].result.reject(new Error('Term 2 failed late'));
  h.scheduleCalls[0].result.resolve(schedulesResponse([schedule(1, 100)]));
  await firstSchedule;
  await flush();
  assert.strictEqual(h.controller.getSnapshot(), current);
  assert.deepEqual(current.classes, [row(1, 12)]);
  assert.deepEqual(current.schedules, [schedule(1, 102)]);
});

test('clearing the term synchronously clears both lists and blocks old continuations', async () => {
  const h = harness();
  await loadClasses(h);
  const pending = h.controller.openSchedule();
  h.controller.selectTerm('');
  const cleared = h.controller.getSnapshot();
  h.scheduleCalls[0].result.resolve(schedulesResponse([schedule()]));
  await pending;
  assert.strictEqual(h.controller.getSnapshot(), cleared);
  assert.deepEqual(cleared.classes, []);
  assert.deepEqual(cleared.schedules, []);
  assert.equal(cleared.selectedClass, null);
  assert.equal(cleared.loadingClasses, false);
  assert.equal(cleared.loadingSchedules, false);
  await h.controller.openSchedule();
  assert.equal(h.scheduleCalls.length, 1);
});

test('schedule errors remain in their dialog and reopening clears only that error', async () => {
  const h = harness();
  await loadClasses(h);
  const pending = h.controller.openSchedule();
  h.scheduleCalls[0].result.reject(new Error('Schedule unavailable'));
  await pending;
  assert.equal(h.controller.getSnapshot().schedulesError, 'Schedule unavailable');
  assert.equal(h.controller.getSnapshot().classesError, null);
  assert.deepEqual(h.controller.getSnapshot().classes, [row()]);
  assert.equal(h.controller.getSnapshot().loadingSchedules, false);
  h.controller.closeSchedule();
  const retry = h.controller.openSchedule();
  assert.equal(h.controller.getSnapshot().schedulesError, null);
  h.scheduleCalls[1].result.resolve(schedulesResponse([]));
  await retry;
  assert.equal(h.controller.getSnapshot().isScheduleModalOpen, true);
  assert.equal(h.controller.getSnapshot().schedulesError, null);
});

test('term completion cannot clear a class failure, and class completion cannot clear a term failure', async () => {
  const h = harness();
  h.controller.selectTerm(1);
  h.classCalls[0].result.reject(new Error('Class failure'));
  await flush();
  h.termCalls[0].resolve({ status: true, message: '', terms });
  await flush();
  assert.equal(h.controller.getSnapshot().classesError, 'Class failure');
  h.controller.selectTerm(2);
  assert.equal(h.controller.getSnapshot().classesError, null);

  const other = harness();
  other.termCalls[0].reject(new Error('Terms unavailable'));
  other.controller.selectTerm(1);
  other.classCalls[0].result.resolve(classesResponse([]));
  await flush();
  assert.equal(other.controller.getSnapshot().termsError, 'Terms unavailable');
  assert.equal(other.controller.getSnapshot().classesError, null);
});

test('all late completions after cleanup produce no state changes or notifications', async () => {
  const h = harness();
  h.controller.selectTerm(1);
  const pending = h.controller.openSchedule();
  let notified = 0;
  const unsubscribe = h.controller.subscribe(() => { notified++; });
  h.stop();
  const previous = h.controller.getSnapshot();
  h.termCalls[0].reject(new Error('Unmounted terms'));
  h.classCalls[0].result.resolve(classesResponse([row()]));
  h.scheduleCalls[0].result.reject(new Error('Unmounted schedule'));
  await pending;
  await flush();
  assert.strictEqual(h.controller.getSnapshot(), previous);
  assert.equal(notified, 0);
  unsubscribe();
});

test('StrictMode-style restart rejects the previous mount and an obsolete cleanup cannot stop the new mount', async () => {
  const h = harness(false);
  h.stop();
  const stopAgain = h.controller.start();
  h.stop();
  h.controller.selectTerm(2);
  h.termCalls[0].resolve({ status: true, message: '', terms: [{ id: 99 } as Term] });
  await flush();
  assert.equal(h.controller.getSnapshot().loadingTerms, true);
  assert.deepEqual(h.controller.getSnapshot().terms, []);
  h.termCalls[1].resolve({ status: true, message: '', terms });
  h.classCalls[0].result.resolve(classesResponse([row(2)]));
  await flush();
  assert.deepEqual(h.controller.getSnapshot().terms, terms);
  assert.equal(h.controller.getSnapshot().loadingTerms, false);
  assert.equal(h.controller.getSnapshot().selectedTerm, 2);
  stopAgain();
});

test('owners have independent snapshots and pending requests cannot populate a replacement owner', async () => {
  const first = harness(false, 'first-owner');
  first.controller.selectTerm(1);
  const pending = first.controller.openSchedule();
  first.stop();
  const second = harness(false, 'second-owner');
  const current = second.controller.getSnapshot();
  first.scheduleCalls[0].result.resolve(schedulesResponse([schedule()]));
  first.classCalls[0].result.resolve(classesResponse([row()]));
  first.termCalls[0].resolve({ status: true, message: '', terms });
  await pending;
  await flush();
  assert.strictEqual(second.controller.getSnapshot(), current);
  assert.equal(current.ownerId, 'second-owner');
  assert.equal(current.selectedTerm, '');
  assert.deepEqual(current.schedules, []);
});

test('snapshots remain referentially stable between changes and unsubscribe stops notifications', async () => {
  const h = harness(false);
  const initial = h.controller.getSnapshot();
  assert.strictEqual(h.controller.getSnapshot(), initial);
  let count = 0;
  const unsubscribe = h.controller.subscribe(() => { count++; });
  h.controller.selectTerm(1);
  assert.equal(count, 1);
  assert.notStrictEqual(h.controller.getSnapshot(), initial);
  unsubscribe();
  h.controller.selectTerm(2);
  assert.equal(count, 1);
});

test('cancellation invalidates pending schedules, blocks duplicate mutation and term changes, then removes only its row', async () => {
  const h = harness();
  await loadClasses(h, [row(), row(1, 11)]);
  const oldSchedule = h.controller.openSchedule();
  h.controller.openCancellation(10);
  assert.equal(h.controller.getSnapshot().isScheduleModalOpen, false);
  const pending = h.controller.confirmCancellation();
  await h.controller.confirmCancellation();
  h.controller.closeCancellation();
  h.controller.selectTerm(2);
  await h.controller.openSchedule();
  assert.equal(h.cancelCalls.length, 1);
  assert.deepEqual(h.cancelCalls[0].row, row());
  assert.equal(h.controller.getSnapshot().selectedTerm, 1);
  assert.equal(h.controller.getSnapshot().cancelling, true);
  assert.equal(h.scheduleCalls.length, 1);
  h.cancelCalls[0].result.resolve({ status: true, message: '' });
  await pending;
  h.scheduleCalls[0].result.resolve(schedulesResponse([schedule()]));
  await oldSchedule;
  assert.deepEqual(h.controller.getSnapshot().classes, [row(1, 11)]);
  assert.deepEqual(h.controller.getSnapshot().schedules, []);
  assert.equal(h.controller.getSnapshot().selectedClass, null);
  assert.equal(h.controller.getSnapshot().cancelling, false);
  const fresh = h.controller.openSchedule();
  assert.equal(h.scheduleCalls.length, 2);
  h.scheduleCalls[1].result.resolve(schedulesResponse([]));
  await fresh;
});

for (const fail of [false, true]) {
  test('cancellation ' + (fail ? 'failure' : 'success') + ' after restart cannot close or clear the new view', async () => {
    const h = harness();
    await loadClasses(h);
    h.controller.openCancellation(10);
    const pending = h.controller.confirmCancellation();
    h.stop();
    h.controller.start();
    h.controller.selectTerm(2);
    h.classCalls[1].result.resolve(classesResponse([row(2, 20)]));
    const freshSchedule = h.controller.openSchedule();
    h.scheduleCalls[0].result.resolve(schedulesResponse([schedule(2, 200)]));
    await freshSchedule;
    await flush();
    const fresh = h.controller.getSnapshot();
    if (fail) h.cancelCalls[0].result.reject(new Error('Old cancellation failed'));
    else h.cancelCalls[0].result.resolve({ status: true, message: '' });
    await pending;
    assert.strictEqual(h.controller.getSnapshot(), fresh);
    assert.deepEqual(fresh.schedules, [schedule(2, 200)]);
  });
}

test('failed cancellation retains its selected row and errors are isolated and retryable', async () => {
  const h = harness();
  await loadClasses(h);
  h.controller.openCancellation(10);
  const pending = h.controller.confirmCancellation();
  h.cancelCalls[0].result.reject(new Error('Settlement required'));
  await pending;
  assert.deepEqual(h.controller.getSnapshot().classes, [row()]);
  assert.equal(h.controller.getSnapshot().selectedClass?.id, 10);
  assert.equal(h.controller.getSnapshot().cancellationError, 'Settlement required');
  assert.equal(h.controller.getSnapshot().classesError, null);
  assert.equal(h.controller.getSnapshot().schedulesError, null);
  assert.equal(h.controller.getSnapshot().cancelling, false);
  const retry = h.controller.confirmCancellation();
  assert.equal(h.controller.getSnapshot().cancellationError, null);
  h.cancelCalls[1].result.resolve({ status: true, message: '' });
  await retry;
  assert.deepEqual(h.controller.getSnapshot().classes, []);
});

test('teacher cannot start cancellation and a missing student row cannot dispatch a mutation', async () => {
  const teacher = harness(false);
  await loadClasses(teacher);
  teacher.controller.openCancellation(10);
  await teacher.controller.confirmCancellation();
  assert.equal(teacher.controller.getSnapshot().selectedClass, null);
  assert.equal(teacher.cancelCalls.length, 0);
  const student = harness();
  await loadClasses(student);
  student.controller.openCancellation(999);
  await student.controller.confirmCancellation();
  assert.equal(student.cancelCalls.length, 0);
});

test('false-success responses are failures with no stale data retained', async () => {
  const h = harness();
  h.termCalls[0].resolve({ status: false, message: 'Terms denied', terms: [] });
  h.controller.selectTerm(1);
  h.classCalls[0].result.resolve({ status: false, message: 'Classes denied', classes: [row()] });
  const pending = h.controller.openSchedule();
  h.scheduleCalls[0].result.resolve({ status: false, message: 'Schedules denied', schedules: [schedule()] });
  await pending;
  await flush();
  assert.equal(h.controller.getSnapshot().termsError, 'Terms denied');
  assert.equal(h.controller.getSnapshot().classesError, 'Classes denied');
  assert.equal(h.controller.getSnapshot().schedulesError, 'Schedules denied');
  assert.deepEqual(h.controller.getSnapshot().classes, []);
  assert.deepEqual(h.controller.getSnapshot().schedules, []);
});

for (const role of ['teacher', 'student'] as const) {
  test(role + ' controller uses real API routes, validated rows and Persian display', async () => {
    const calls: string[] = [];
    const classRow = {
      ...row(), name: 'Personal class', registrations_count: 1,
      start_date: '2026-03-21', registrations: [{ id: 30, class_id: 10 }],
    };
    const client = axios.create({ adapter: config => {
      calls.push((config.method ?? '') + ' ' + config.url);
      if (config.url === '/terms') return Promise.resolve(response(config, { status: true, terms }));
      if (config.method === 'delete') return Promise.resolve(response(config, {
        status: true, registration: { id: 30, cancelled_at: '2026-11-07T10:00:00Z' },
      }));
      if (config.url?.endsWith('/classes')) return Promise.resolve(response(config, { status: true, classes: [classRow] }));
      return Promise.resolve(response(config, { status: true, schedules: [schedule()] }));
    } });
    const academics = createAcademicsApi(client);
    const schedules = createSchedulesApi(client);
    const api = role === 'teacher'
      ? { getTerms: academics.getTerms, getClasses: academics.getClassesForTeacher, getSchedules: schedules.getSchedulesForTeacher }
      : { getTerms: academics.getTerms, getClasses: academics.getClassesForStudent, getSchedules: schedules.getSchedulesForStudent,
        cancelRegistration: createRegistrationsApi(client).cancelRegistration };
    const controller = createPersonalClassesController(api);
    const stop = controller.start();
    await flush();
    controller.selectTerm(1);
    await flush();
    await controller.openSchedule();
    assert.equal(controller.getSnapshot().classes[0].display?.start_date, '۱۴۰۵/۰۱/۰۱');
    assert.equal(controller.getSnapshot().schedules[0].display?.start_time, '۰۹:۰۰');
    assert.equal(controller.getSnapshot().schedules[0].start_time, '09:00:00');
    const scope = role === 'teacher' ? 'teaching' : 'studying';
    assert.deepEqual(calls.slice(0, 3), ['get /terms', 'get /me/' + scope + '-terms/1/classes', 'get /me/' + scope + '-terms/1/schedules']);
    if (role === 'student') {
      controller.openCancellation(10);
      await controller.confirmCancellation();
      assert.equal(calls[3], 'delete /terms/1/classes/10/registrations/30');
      assert.deepEqual(controller.getSnapshot().classes, []);
    }
    stop();
  });

  test(role + ' authorization errors remain dialog errors rather than empty successful schedules', async () => {
    const client = axios.create({ adapter: config => rejectStatus(config, 403) });
    const schedules = createSchedulesApi(client);
    const controller = createPersonalClassesController({
      getTerms: async () => ({ status: true, message: '', terms }),
      getClasses: async () => classesResponse([]),
      getSchedules: role === 'teacher' ? schedules.getSchedulesForTeacher : schedules.getSchedulesForStudent,
    });
    controller.start();
    controller.selectTerm(1);
    await controller.openSchedule();
    assert.equal(controller.getSnapshot().isScheduleModalOpen, true);
    assert.equal(controller.getSnapshot().loadingSchedules, false);
    assert.notEqual(controller.getSnapshot().schedulesError, null);
    assert.deepEqual(controller.getSnapshot().schedules, []);
  });
}

test('closing cancellation before confirmation is local and a rejected confirmation keeps the enrollment', async () => {
  const h = harness();
  await loadClasses(h);
  h.controller.openCancellation(10);
  h.controller.closeCancellation();
  await h.controller.confirmCancellation();
  assert.equal(h.cancelCalls.length, 0);
  assert.deepEqual(h.controller.getSnapshot().classes, [row()]);
  h.controller.openCancellation(10);
  const pending = h.controller.confirmCancellation();
  h.cancelCalls[0].result.resolve({ status: false, message: 'Cancellation denied' });
  await pending;
  assert.equal(h.controller.getSnapshot().cancellationError, 'Cancellation denied');
  assert.deepEqual(h.controller.getSnapshot().classes, [row()]);
  assert.equal(h.controller.getSnapshot().cancelling, false);
});
