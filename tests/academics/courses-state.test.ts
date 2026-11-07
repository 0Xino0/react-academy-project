import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as flush } from 'node:timers/promises';
import axios from 'axios';
import { createCoursesController } from '../../src/services/coursesState.ts';
import { createCoursesApi } from '../../src/services/courses.ts';
import type { Course, CourseFormData, CourseResponse, CoursesResponse, DeleteCourseResponse } from '../../src/types/Courses.ts';
import { deferred, response, rejectStatus } from '../helpers.ts';

const course = (id = 4, title = 'Course ' + id): Course => ({
  id, title, level: 'Beginner', description: null,
  created_at: '2026-11-08T08:00:00Z', updated_at: '2026-11-08T08:00:00Z',
});
const list = (rows = [course(4), course(5)]): CoursesResponse => ({ status: true, message: '', data: rows });
const saved = (row = course()): CourseResponse => ({ status: true, message: '', data: row });

function harness(ownerId = 'manager-1') {
  const lists: ReturnType<typeof deferred<CoursesResponse>>[] = [];
  const details: { id: number; result: ReturnType<typeof deferred<CourseResponse>> }[] = [];
  const creates: { payload: CourseFormData; result: ReturnType<typeof deferred<CourseResponse>> }[] = [];
  const updates: { id: number; payload: CourseFormData; result: ReturnType<typeof deferred<CourseResponse>> }[] = [];
  const deletes: { id: number; result: ReturnType<typeof deferred<DeleteCourseResponse>> }[] = [];
  const notices: string[] = [];
  const controller = createCoursesController({
    getCourses() { const result = deferred<CoursesResponse>(); lists.push(result); return result.promise; },
    getCourse(id) { const result = deferred<CourseResponse>(); details.push({ id, result }); return result.promise; },
    createCourse(payload) { const result = deferred<CourseResponse>(); creates.push({ payload, result }); return result.promise; },
    updateCourse(id, payload) { const result = deferred<CourseResponse>(); updates.push({ id, payload, result }); return result.promise; },
    deleteCourse(id) { const result = deferred<DeleteCourseResponse>(); deletes.push({ id, result }); return result.promise; },
  }, ownerId, message => { notices.push(message); });
  const stop = controller.start();
  return { controller, stop, lists, details, creates, updates, deletes, notices };
}
async function ready(h: ReturnType<typeof harness>, rows = [course(4), course(5)]) {
  h.lists[0].resolve(list(rows)); await flush();
}
function fill(h: ReturnType<typeof harness>, title = 'New course') {
  h.controller.setField('title', title); h.controller.setField('level', 'Beginner');
}

test('initial list loading blocks writes and a failed list has an independent retry', async () => {
  const h = harness();
  assert.equal(h.controller.getSnapshot().loading, true);
  h.controller.openCreate();
  assert.equal(h.controller.getSnapshot().editor, null);
  h.lists[0].reject(new Error('List unavailable')); await flush();
  assert.equal(h.controller.getSnapshot().listError, 'List unavailable');
  h.controller.openCreate();
  assert.equal(h.controller.getSnapshot().editor, null);
  const retry = h.controller.reload();
  assert.equal(h.controller.getSnapshot().loading, true);
  await h.controller.reload();
  assert.equal(h.lists.length, 2);
  h.lists[1].resolve(list([])); await retry;
  assert.equal(h.controller.getSnapshot().listError, null);
  assert.deepEqual(h.controller.getSnapshot().courses, []);
  h.controller.openCreate();
  assert.equal(h.controller.getSnapshot().editor, 'create');
});

test('details open immediately with loading, and the same open does not send duplicate reads', async () => {
  const h = harness(); await ready(h);
  const pending = h.controller.openDetails(4);
  assert.equal(h.controller.getSnapshot().detailOpen, true);
  assert.equal(h.controller.getSnapshot().loadingDetails, true);
  assert.equal(h.controller.getSnapshot().detail, null);
  await h.controller.openDetails(4);
  assert.equal(h.details.length, 1);
  h.details[0].result.resolve(saved()); await pending;
  assert.equal(h.controller.getSnapshot().detail?.id, 4);
  assert.equal(h.controller.getSnapshot().loadingDetails, false);
});

for (const fail of [false, true]) {
  test('older detail ' + (fail ? 'errors' : 'rows') + ' cannot replace the last selection or its loading state', async () => {
    const h = harness(); await ready(h);
    const first = h.controller.openDetails(4);
    const second = h.controller.openDetails(5);
    const fresh = h.controller.getSnapshot();
    if (fail) h.details[0].result.reject(new Error('Old detail failed'));
    else h.details[0].result.resolve(saved(course(4)));
    await first;
    assert.strictEqual(h.controller.getSnapshot(), fresh);
    assert.equal(fresh.loadingDetails, true);
    h.details[1].result.resolve(saved(course(5))); await second;
    assert.equal(h.controller.getSnapshot().detail?.id, 5);
    assert.equal(h.controller.getSnapshot().detailError, null);
  });

  test('closing details ignores late ' + (fail ? 'failure' : 'success') + ' and never reopens the modal', async () => {
    const h = harness(); await ready(h);
    const pending = h.controller.openDetails(4);
    h.controller.closeDetails();
    const closed = h.controller.getSnapshot();
    if (fail) h.details[0].result.reject(new Error('Closed detail failed'));
    else h.details[0].result.resolve(saved());
    await pending;
    assert.strictEqual(h.controller.getSnapshot(), closed);
    assert.equal(closed.detailOpen, false);
    assert.equal(closed.detail, null);
  });

  test('reopening the same ID discards the old request ' + (fail ? 'error' : 'success'), async () => {
    const h = harness(); await ready(h);
    const old = h.controller.openDetails(4); h.controller.closeDetails();
    const fresh = h.controller.openDetails(4);
    h.details[1].result.resolve(saved(course(4, 'Fresh title'))); await fresh;
    const latest = h.controller.getSnapshot();
    if (fail) h.details[0].result.reject(new Error('Old open failed'));
    else h.details[0].result.resolve(saved(course(4, 'Old title')));
    await old;
    assert.strictEqual(h.controller.getSnapshot(), latest);
    assert.equal(latest.detail?.title, 'Fresh title');
  });
}

test('A to B to A only accepts the final A request', async () => {
  const h = harness(); await ready(h);
  const first = h.controller.openDetails(4);
  const middle = h.controller.openDetails(5);
  const last = h.controller.openDetails(4);
  h.details[2].result.resolve(saved(course(4, 'Last A'))); await last;
  h.details[0].result.resolve(saved(course(4, 'First A')));
  h.details[1].result.resolve(saved(course(5)));
  await Promise.all([first, middle]);
  assert.equal(h.controller.getSnapshot().detail?.title, 'Last A');
});

test('detail failure is shown in the dialog and never clears the list; reopen retries it', async () => {
  const h = harness(); await ready(h);
  const first = h.controller.openDetails(4);
  h.details[0].result.reject(new Error('Details unavailable')); await first;
  assert.equal(h.controller.getSnapshot().detailError, 'Details unavailable');
  assert.equal(h.controller.getSnapshot().listError, null);
  assert.deepEqual(h.controller.getSnapshot().courses, [course(4), course(5)]);
  h.controller.closeDetails();
  const next = h.controller.openDetails(4);
  assert.equal(h.controller.getSnapshot().detailError, null);
  h.details[1].result.resolve(saved()); await next;
  assert.equal(h.controller.getSnapshot().detail?.id, 4);
});

for (const modal of ['create', 'edit', 'delete'] as const) {
  test('opening ' + modal + ' invalidates an outstanding detail response', async () => {
    const h = harness(); await ready(h);
    const pending = h.controller.openDetails(4);
    if (modal === 'create') h.controller.openCreate();
    if (modal === 'edit') h.controller.openEdit(5);
    if (modal === 'delete') h.controller.openDelete(5);
    const fresh = h.controller.getSnapshot();
    h.details[0].result.resolve(saved()); await pending;
    assert.strictEqual(h.controller.getSnapshot(), fresh);
    assert.equal(fresh.detailOpen, false);
  });
}

test('two immediate create submissions send one POST and protect the draft while saving', async () => {
  const h = harness(); await ready(h);
  h.controller.openCreate(); fill(h);
  const first = h.controller.save();
  await h.controller.save();
  h.controller.closeEditor(); h.controller.setField('title', 'Changed while saving');
  h.controller.openDelete(4); await h.controller.openDetails(4); await h.controller.reload();
  assert.equal(h.creates.length, 1);
  assert.equal(h.controller.getSnapshot().form.title, 'New course');
  assert.equal(h.controller.getSnapshot().editor, 'create');
  assert.equal(h.controller.getSnapshot().saving, true);
  assert.equal(h.deletes.length, 0);
  assert.equal(h.details.length, 0);
  assert.equal(h.lists.length, 1);
  h.creates[0].result.resolve(saved(course(6, 'Persisted new course'))); await first;
  assert.deepEqual(h.controller.getSnapshot().courses.map(row => row.id), [4, 5, 6]);
  assert.equal(h.controller.getSnapshot().courses[2].title, 'Persisted new course');
  assert.equal(h.controller.getSnapshot().editor, null);
  assert.equal(h.controller.getSnapshot().saving, false);
  assert.equal(h.notices.length, 1);
});

test('editing uses the original selected ID and only replaces the confirmed row', async () => {
  const h = harness(); await ready(h);
  h.controller.openEdit(4);
  assert.equal(h.controller.getSnapshot().form.description, '');
  fill(h, 'Edited');
  const first = h.controller.save(); await h.controller.save();
  h.controller.openEdit(5); h.controller.closeEditor();
  assert.equal(h.updates.length, 1);
  assert.equal(h.updates[0].id, 4);
  assert.equal(h.controller.getSnapshot().editorCourse?.id, 4);
  h.updates[0].result.resolve(saved(course(4, 'Persisted canonical'))); await first;
  assert.deepEqual(h.controller.getSnapshot().courses, [course(4, 'Persisted canonical'), course(5)]);
  assert.equal(h.controller.getSnapshot().editor, null);
  assert.deepEqual(h.notices, ['Course updated successfully']);
});

for (const operation of ['create', 'update'] as const) {
  test(operation + ' failure keeps its draft and previous rows, permits retry, and sends no success notification', async () => {
    const h = harness(); await ready(h);
    if (operation === 'create') h.controller.openCreate(); else h.controller.openEdit(4);
    fill(h, 'Keep this draft');
    const first = h.controller.save();
    const calls = operation === 'create' ? h.creates : h.updates;
    calls[0].result.reject(new Error('Storage unavailable')); await first;
    assert.equal(h.controller.getSnapshot().formError, 'Storage unavailable');
    assert.equal(h.controller.getSnapshot().form.title, 'Keep this draft');
    assert.deepEqual(h.controller.getSnapshot().courses, [course(4), course(5)]);
    assert.equal(h.controller.getSnapshot().saving, false);
    assert.deepEqual(h.notices, []);
    const retry = h.controller.save();
    calls[1].result.resolve(saved(course(operation === 'create' ? 6 : 4))); await retry;
    assert.equal(h.controller.getSnapshot().editor, null);
    assert.equal(h.notices.length, 1);
  });
}

test('delete uses the selected row once, preserves unrelated rows, and blocks close while running', async () => {
  const h = harness(); await ready(h);
  h.controller.openDelete(4);
  const first = h.controller.confirmDelete(); await h.controller.confirmDelete();
  h.controller.closeDelete(); h.controller.openCreate(); await h.controller.reload();
  assert.equal(h.deletes.length, 1);
  assert.equal(h.deletes[0].id, 4);
  assert.equal(h.controller.getSnapshot().toDelete?.id, 4);
  assert.equal(h.controller.getSnapshot().deleting, true);
  h.deletes[0].result.resolve({ status: true, message: '' }); await first;
  assert.deepEqual(h.controller.getSnapshot().courses, [course(5)]);
  assert.equal(h.controller.getSnapshot().toDelete, null);
  assert.equal(h.controller.getSnapshot().deleting, false);
  assert.deepEqual(h.notices, ['Course and its classes archived.']);
});

test('delete errors retain the row and stay in the delete dialog', async () => {
  const h = harness(); await ready(h);
  h.controller.openDelete(4);
  const pending = h.controller.confirmDelete();
  h.deletes[0].result.reject(new Error('Archive unavailable')); await pending;
  assert.equal(h.controller.getSnapshot().deleteError, 'Archive unavailable');
  assert.equal(h.controller.getSnapshot().listError, null);
  assert.deepEqual(h.controller.getSnapshot().courses, [course(4), course(5)]);
  assert.equal(h.controller.getSnapshot().toDelete?.id, 4);
  assert.deepEqual(h.notices, []);
  h.controller.closeDelete();
  assert.equal(h.controller.getSnapshot().deleteError, null);
});

test('closing an editor or deletion before confirmation sends no write', async () => {
  const h = harness(); await ready(h);
  h.controller.openCreate(); fill(h); h.controller.closeEditor(); await h.controller.save();
  h.controller.openDelete(4); h.controller.closeDelete(); await h.controller.confirmDelete();
  assert.equal(h.creates.length, 0); assert.equal(h.deletes.length, 0);
});

test('cleanup rejects outstanding list and detail continuations and stops subscriber changes', async () => {
  const h = harness(); await ready(h);
  const pending = h.controller.openDetails(4);
  let count = 0; const unsubscribe = h.controller.subscribe(() => { count++; });
  h.stop(); const last = h.controller.getSnapshot();
  h.details[0].result.reject(new Error('Unmounted')); await pending;
  assert.strictEqual(h.controller.getSnapshot(), last);
  assert.equal(count, 0);
  unsubscribe();
  const initial = harness();
  const previous = initial.controller.getSnapshot(); initial.stop();
  initial.lists[0].resolve(list()); await flush();
  assert.strictEqual(initial.controller.getSnapshot(), previous);
});

test('StrictMode-style restart ignores old list completion and stale cleanup', async () => {
  const h = harness();
  h.stop(); const stop = h.controller.start(); h.stop();
  const before = h.controller.getSnapshot();
  h.lists[0].resolve(list([course(99)])); await flush();
  assert.strictEqual(h.controller.getSnapshot(), before);
  assert.equal(h.controller.getSnapshot().loading, true);
  h.lists[1].resolve(list([course(5)])); await flush();
  assert.deepEqual(h.controller.getSnapshot().courses, [course(5)]);
  stop();
});

for (const operation of ['create', 'update', 'delete'] as const) {
  for (const fail of [false, true]) {
    test('old ' + operation + (fail ? ' failure' : ' success') + ' cannot mutate a restarted view or show its notification', async () => {
      const h = harness(); await ready(h);
      if (operation === 'create') { h.controller.openCreate(); fill(h); }
      if (operation === 'update') { h.controller.openEdit(4); fill(h); }
      if (operation === 'delete') h.controller.openDelete(4);
      const pending = operation === 'delete' ? h.controller.confirmDelete() : h.controller.save();
      h.stop(); h.controller.start();
      h.lists[1].resolve(list([course(5)])); await flush(); h.controller.openEdit(5);
      const fresh = h.controller.getSnapshot();
      if (operation === 'delete') {
        if (fail) h.deletes[0].result.reject(new Error('Old delete failed'));
        else h.deletes[0].result.resolve({ status: true, message: '' });
      } else {
        const call = (operation === 'create' ? h.creates : h.updates)[0];
        if (fail) call.result.reject(new Error('Old save failed'));
        else call.result.resolve(saved(course(operation === 'create' ? 6 : 4)));
      }
      await pending;
      assert.strictEqual(h.controller.getSnapshot(), fresh);
      assert.deepEqual(h.notices, []);
    });
  }
}

test('different owners never share courses or outstanding detail responses', async () => {
  const h = harness('first'); await ready(h);
  const pending = h.controller.openDetails(4); h.stop();
  const second = harness('second'); const fresh = second.controller.getSnapshot();
  h.details[0].result.resolve(saved()); await pending;
  assert.strictEqual(second.controller.getSnapshot(), fresh);
  assert.equal(fresh.ownerId, 'second');
  assert.deepEqual(fresh.courses, []);
});

test('unknown row IDs cannot open editing, deletion or detail requests', async () => {
  const h = harness(); await ready(h);
  h.controller.openEdit(999); h.controller.openDelete(999); await h.controller.openDetails(999);
  assert.equal(h.controller.getSnapshot().editor, null);
  assert.equal(h.controller.getSnapshot().toDelete, null);
  assert.equal(h.details.length, 0);
});

test('false responses do not remove courses or close forms with a success message', async () => {
  const h = harness(); await ready(h);
  h.controller.openEdit(4); fill(h);
  const update = h.controller.save();
  h.updates[0].result.resolve({ ...saved(), status: false, message: 'Save denied' }); await update;
  assert.equal(h.controller.getSnapshot().formError, 'Save denied');
  assert.equal(h.controller.getSnapshot().editor, 'edit');
  h.controller.closeEditor(); h.controller.openDelete(4);
  const remove = h.controller.confirmDelete();
  h.deletes[0].result.resolve({ status: false, message: 'Delete denied' }); await remove;
  assert.deepEqual(h.controller.getSnapshot().courses, [course(4), course(5)]);
  assert.equal(h.controller.getSnapshot().deleteError, 'Delete denied');
  assert.deepEqual(h.notices, []);
});

test('the controller keeps stable snapshots and unsubscribed listeners do not receive changes', async () => {
  const h = harness(); await ready(h);
  const previous = h.controller.getSnapshot();
  assert.strictEqual(h.controller.getSnapshot(), previous);
  let count = 0; const unsubscribe = h.controller.subscribe(() => { count++; });
  h.controller.openCreate();
  assert.equal(count, 1);
  unsubscribe(); h.controller.closeEditor();
  assert.equal(count, 1);
});

test('real course wrappers preserve the current row and field errors when the API rejects a save', async () => {
  let posts = 0;
  const client = axios.create({ adapter: config => {
    if (config.method === 'get') return Promise.resolve(response(config, list()));
    posts++;
    return Promise.reject(new axios.AxiosError('Validation failed', undefined, config, undefined,
      response(config, { message: 'Validation failed', errors: { title: ['Server title validation'] } }, 422)));
  } });
  const notices: string[] = [];
  const controller = createCoursesController(createCoursesApi(client), 'manager', value => { notices.push(value); });
  controller.start(); await flush(); controller.openCreate();
  controller.setField('title', 'Example'); controller.setField('level', 'Beginner');
  await controller.save();
  assert.equal(posts, 1);
  assert.equal(controller.getSnapshot().formError, 'Server title validation');
  assert.equal(controller.getSnapshot().editor, 'create');
  assert.deepEqual(notices, []);
});

test('real wrapper title validation stops invalid input before HTTP and a corrected draft can be saved', async () => {
  const calls: string[] = [];
  const client = axios.create({ adapter: config => {
    calls.push(config.method + ' ' + config.url);
    return Promise.resolve(response(config, config.method === 'get' ? list() : saved(course(6))));
  } });
  const controller = createCoursesController(createCoursesApi(client));
  controller.start(); await flush(); controller.openCreate();
  controller.setField('title', 'x'.repeat(256)); controller.setField('level', 'Beginner');
  await controller.save();
  assert.deepEqual(calls, ['get /courses']);
  assert.match(controller.getSnapshot().formError ?? '', /255/);
  controller.setField('title', 'Corrected'); await controller.save();
  assert.deepEqual(calls, ['get /courses', 'post /courses']);
  assert.equal(controller.getSnapshot().editor, null);
});

test('a wrong-ID detail or update response is rejected before it can replace any course', async () => {
  const client = axios.create({ adapter: config => Promise.resolve(response(config,
    config.url === '/courses' ? list() : saved(course(5)))) });
  const controller = createCoursesController(createCoursesApi(client));
  controller.start(); await flush();
  const original = controller.getSnapshot().courses;
  await controller.openDetails(4);
  assert.equal(controller.getSnapshot().detail, null);
  assert.match(controller.getSnapshot().detailError ?? '', /selected course/);
  controller.closeDetails(); controller.openEdit(4); await controller.save();
  assert.equal(controller.getSnapshot().editor, 'edit');
  assert.strictEqual(controller.getSnapshot().courses, original);
});

test('authorization failure is a visible list error rather than an empty successful list', async () => {
  const client = axios.create({ adapter: config => rejectStatus(config, 403) });
  const controller = createCoursesController(createCoursesApi(client)); controller.start(); await flush();
  assert.notEqual(controller.getSnapshot().listError, null);
  assert.equal(controller.getSnapshot().loading, false);
});
