import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import type { AxiosAdapter } from 'axios';
import { createCoursesApi } from '../../src/services/courses.ts';
import { response, rejectStatus } from '../helpers.ts';

const course = {
  id: 4, title: 'English', level: 'Beginner', description: null,
  created_at: '2026-11-06T08:00:00.000000Z', updated_at: '2026-11-06T08:00:00.000000Z',
};
const form = { title: 'English', level: 'Beginner', description: '' };

function apiReturning(data: unknown) {
  return createCoursesApi(axios.create({ adapter: config => Promise.resolve(response(config, data)) }));
}

test('course lists accept empty results and a nullable description from the real contract', async () => {
  assert.deepEqual((await apiReturning({ status: true, data: [] }).getCourses()).data, []);
  assert.equal((await apiReturning({ status: true, data: [course] }).getCourses()).data[0].description, null);
});

test('create and update send form fields and return the saved course with server metadata', async () => {
  const calls: Array<{ method: string | undefined; url: string | undefined; payload: unknown }> = [];
  const adapter: AxiosAdapter = config => {
    calls.push({ method: config.method, url: config.url, payload: JSON.parse(config.data as string) });
    return Promise.resolve(response(config, { status: true, message: 'Saved', data: course }));
  };
  const api = createCoursesApi(axios.create({ adapter }));
  assert.equal((await api.createCourse(form)).data.created_at, course.created_at);
  assert.equal((await api.updateCourse(course.id, form)).data.id, course.id);
  assert.deepEqual(calls, [
    { method: 'post', url: '/courses', payload: form },
    { method: 'put', url: '/courses/4', payload: form },
  ]);
});

test('detail and delete use the selected course ID and the current response keys', async () => {
  const calls: string[] = [];
  const api = createCoursesApi(axios.create({ adapter: config => {
    calls.push(`${config.method} ${config.url}`);
    return Promise.resolve(response(config, config.method === 'delete'
      ? { status: true, message: 'Deleted' } : { status: true, message: 'Found', data: course }));
  } }));
  assert.equal((await api.getCourse(4)).data.id, course.id);
  assert.equal((await api.deleteCourse(4)).status, true);
  assert.deepEqual(calls, ['get /courses/4', 'delete /courses/4']);
});

for (const operation of ['list', 'detail', 'create', 'update', 'delete'] as const) {
  test(`HTTP 200 with status false is rejected for course ${operation}`, async () => {
    const api = apiReturning({ status: false, message: 'Failed', data: course });
    const requests = {
      list: () => api.getCourses(), detail: () => api.getCourse(4),
      create: () => api.createCourse(form), update: () => api.updateCourse(4, form), delete: () => api.deleteCourse(4),
    };
    await assert.rejects(requests[operation], /not successful/);
  });
}

test('the old stauts typo does not confirm a deletion', async () => {
  await assert.rejects(apiReturning({ stauts: true }).deleteCourse(4), /not successful/);
});

test('missing, null and malformed response envelopes are rejected', async () => {
  for (const payload of [null, undefined, {}, { status: 'true' }]) {
    await assert.rejects(apiReturning(payload).getCourses(), /not successful/);
  }
});

test('successful envelopes with missing or malformed course data cannot enter UI state', async () => {
  for (const data of [undefined, null, {}, { ...course, id: 0 }, { ...course, description: 123 }]) {
    await assert.rejects(apiReturning({ status: true, data }).getCourse(4), /Invalid course response/);
  }
  for (const data of [undefined, null, {}, [null], [{ ...course, title: null }]]) {
    await assert.rejects(apiReturning({ status: true, data }).getCourses(), /Invalid course list response/);
  }
});

test('HTTP 404 remains an Axios error and is not turned into a successful course operation', async () => {
  const api = createCoursesApi(axios.create({ adapter: config => rejectStatus(config, 404) }));
  await assert.rejects(api.deleteCourse(999999), error => axios.isAxiosError(error) && error.response?.status === 404);
});

test('invalid course IDs cannot dispatch detail, update or delete requests', async () => {
  let calls = 0;
  const api = createCoursesApi(axios.create({ adapter: config => {
    calls++; return Promise.resolve(response(config, { status: true, data: course }));
  } }));
  for (const id of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(api.getCourse(id), /valid course/);
    await assert.rejects(api.updateCourse(id, form), /valid course/);
    await assert.rejects(api.deleteCourse(id), /valid course/);
  }
  assert.equal(calls, 0);
});

test('a successful detail or update for a different course is rejected', async () => {
  const api = apiReturning({ status: true, data: { ...course, id: 5 } });
  await assert.rejects(api.getCourse(4), /selected course/);
  await assert.rejects(api.updateCourse(4, form), /selected course/);
});

test('unsafe server identifiers cannot enter course state', async () => {
  const invalid = { ...course, id: Number.MAX_SAFE_INTEGER + 1 };
  await assert.rejects(apiReturning({ status: true, data: [invalid] }).getCourses(), /Invalid course list/);
  await assert.rejects(apiReturning({ status: true, data: invalid }).getCourse(4), /Invalid course response/);
});

test('course payload trims names and accepts the 255-character Latin and Persian boundary', async () => {
  const sent: unknown[] = [];
  const api = createCoursesApi(axios.create({ adapter: config => {
    sent.push(JSON.parse(config.data as string));
    return Promise.resolve(response(config, { status: true, data: course }));
  } }));
  for (const title of ['x'.repeat(255), 'ف'.repeat(255)]) {
    await api.createCourse({ ...form, title: ' ' + title + ' ' });
    await api.updateCourse(4, { ...form, title });
  }
  assert.deepEqual(sent, ['x'.repeat(255), 'x'.repeat(255), 'ف'.repeat(255), 'ف'.repeat(255)]
    .map(title => ({ ...form, title })));
});

test('empty or overlong titles and invalid levels fail before any write request', async () => {
  let calls = 0;
  const api = createCoursesApi(axios.create({ adapter: config => {
    calls++; return Promise.resolve(response(config, { status: true, data: course }));
  } }));
  for (const title of ['', '   ', 'x'.repeat(256), 'ف'.repeat(256)]) {
    await assert.rejects(api.createCourse({ ...form, title }), /255 characters/);
    await assert.rejects(api.updateCourse(4, { ...form, title }), /255 characters/);
  }
  await assert.rejects(api.createCourse({ ...form, level: 'Unknown' }), /valid course level/);
  await assert.rejects(api.updateCourse(4, { ...form, level: '' }), /valid course level/);
  assert.equal(calls, 0);
});

test('the confirmed server title can be normalized while the selected ID must match', async () => {
  const result = await apiReturning({ status: true, data: { ...course, title: 'Persisted canonical title' } })
    .updateCourse(4, form);
  assert.equal(result.data.title, 'Persisted canonical title');
  assert.equal(result.data.id, 4);
});
