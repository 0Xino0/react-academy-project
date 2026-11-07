import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import type { ApiSchedule } from '../../src/types/Schedule.ts';
import { createSchedulesApi, scheduleErrorMessage } from '../../src/services/schedules.ts';
import { response, rejectStatus } from '../helpers.ts';

const row = {
  id: 7, class_id: 12, day_of_week: 'monday', start_time: '14:30:00', end_time: '15:30:00',
  class: { id: 12, term_id: 22, name: 'Schedule test class', start_date: '2026-03-21', end_date: '2026-11-06' },
} as ApiSchedule;
const form = { day_of_week: 'monday', start_time: '14:30', end_time: '15:30' };

test('schedule creation sends canonical 24-hour times, and localizes only its returned presentation', async () => {
  let sent: unknown;
  let path = '';
  const api = createSchedulesApi(axios.create({ adapter: config => {
    sent = JSON.parse(config.data as string);
    path = config.url ?? '';
    return Promise.resolve(response(config, { status: true, schedule: row }));
  } }));
  const result = await api.createSchedule(22, 12, form);
  assert.equal(path, '/terms/22/classes/12/schedules');
  assert.deepEqual(sent, { day_of_week: 'monday', start_time: '14:30:00', end_time: '15:30:00' });
  assert.equal(result.schedule.start_time, '14:30:00');
  assert.equal(result.schedule.display?.start_time, '۱۴:۳۰');
  assert.equal(result.schedule.class.display?.start_date, '۱۴۰۵/۰۱/۰۱');
});

test('editing and deleting use IDs from the selected row, independent of any form class selection', async () => {
  const paths: string[] = [];
  const api = createSchedulesApi(axios.create({ adapter: config => {
    paths.push(`${config.method} ${config.url}`);
    return Promise.resolve(response(config, { status: true, schedule: config.method === 'delete' ? null : row }));
  } }));
  await api.updateSchedule(row, form);
  await api.deleteSchedule(row);
  assert.deepEqual(paths, ['put /terms/22/classes/12/schedules/7', 'delete /terms/22/classes/12/schedules/7']);
});

test('invalid row identifiers and invalid time values never dispatch an API request', async () => {
  let calls = 0;
  const api = createSchedulesApi(axios.create({ adapter: config => { calls++; return Promise.resolve(response(config, {})); } }));
  await assert.rejects(api.deleteSchedule({ ...row, class_id: 999 }), /identifiers/);
  await assert.rejects(api.deleteSchedule({ ...row, class: undefined } as unknown as ApiSchedule), /identifiers/);
  await assert.rejects(api.createSchedule(22, 12, { ...form, start_time: '24:60' }), /valid/);
  assert.equal(calls, 0);
});

test('all three schedule lists accept empty results and select the correct API routes', async () => {
  const paths: string[] = [];
  const api = createSchedulesApi(axios.create({ adapter: config => {
    paths.push(config.url ?? '');
    return Promise.resolve(response(config, { status: true, schedules: [] }));
  } }));
  assert.deepEqual((await api.getSchedules(22)).schedules, []);
  assert.deepEqual((await api.getSchedulesForTeacher(22)).schedules, []);
  assert.deepEqual((await api.getSchedulesForStudent(22)).schedules, []);
  assert.deepEqual(paths, ['/terms/22/schedules', '/me/teaching-terms/22/schedules', '/me/studying-terms/22/schedules']);
});

test('API lists localize class dates and times while preserving IDs and raw values', async () => {
  const api = createSchedulesApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: true, schedules: [row] })) }));
  const result = (await api.getSchedules(22)).schedules[0];
  assert.equal(result.display?.day_of_week, 'دوشنبه');
  assert.equal(result.class.display?.start_date, '۱۴۰۵/۰۱/۰۱');
  assert.equal(result.class.start_date, '2026-03-21');
  assert.equal(result.id, 7);
});

test('failed deletions and malformed lists are rejected rather than confirming success', async () => {
  const api = createSchedulesApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: false })) }));
  await assert.rejects(api.deleteSchedule(row), /not confirmed/);
  await assert.rejects(api.getSchedules(22), /Invalid schedule list/);
});

test('HTTP 404 and 422 errors remain rejected and validation messages can reach the form', async () => {
  const api = createSchedulesApi(axios.create({ adapter: config => rejectStatus(config, 404) }));
  await assert.rejects(api.deleteSchedule(row), error => axios.isAxiosError(error) && error.response?.status === 404);
  const validationApi = createSchedulesApi(axios.create({ adapter: config => {
    const result = response(config, { message: 'Invalid', errors: { schedule: ['Teacher has a time overlap.'] } }, 422);
    return Promise.reject(new axios.AxiosError('Rejected', 'ERR_BAD_REQUEST', config, undefined, result));
  } }));
  try {
    await validationApi.updateSchedule(row, form);
    assert.fail('422 must be rejected');
  } catch (error) {
    assert.equal(scheduleErrorMessage(error, 'Fallback'), 'Teacher has a time overlap.');
  }
});

test('invalid term identifiers cannot dispatch any schedule list request', async () => {
  let calls = 0;
  const api = createSchedulesApi(axios.create({ adapter: config => {
    calls++;
    return Promise.resolve(response(config, { status: true, schedules: [] }));
  } }));
  for (const id of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    for (const get of [api.getSchedules, api.getSchedulesForTeacher, api.getSchedulesForStudent]) {
      await assert.rejects(get(id), /valid term/);
    }
  }
  assert.equal(calls, 0);
});

for (const method of ['getSchedules', 'getSchedulesForTeacher', 'getSchedulesForStudent'] as const) {
  test(method + ' rejects a different term and malformed row identities before rendering', async () => {
    const invalidRows = [
      null, { ...row, id: 0 }, { ...row, class_id: 999 },
      { ...row, class: null },
      { ...row, class: { ...row.class, term_id: 23 } },
      { ...row, class: { ...row.class, name: null } },
    ];
    for (const invalid of invalidRows) {
      const api = createSchedulesApi(axios.create({ adapter: config => Promise.resolve(response(config, {
        status: true, schedules: [invalid],
      })) }));
      await assert.rejects(api[method](22), /Invalid schedule list response/);
    }
  });
}
