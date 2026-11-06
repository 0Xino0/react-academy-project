import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createRegistrationsApi, enrollmentError } from '../../src/services/registrations.ts';
import type { AvailableClass } from '../../src/types/Enrollment.ts';
import type { ClassForStudent } from '../../src/types/classes.ts';
import { response } from '../helpers.ts';

const row = { id: 5, term_id: 11, can_register: true, start_date: '2026-03-21', schedules: [
  { id: 3, day_of_week: 'monday', start_time: '09:00:00', end_time: '10:00:00' },
] } as AvailableClass;
const enrolled = { ...row, registrations: [{ id: 8, class_id: 5, cancelled_at: null }] } as unknown as ClassForStudent;

test('the available catalogue retains debt restrictions and raw dates alongside Persian presentation', async () => {
  const api = createRegistrationsApi(axios.create({ adapter: config => Promise.resolve(response(config, {
    status: true, data: [row], registration_block_code: 'outstanding_debt', registration_block_reason: 'Settle previous debt.',
  })) }));
  const result = await api.getAvailableClasses();
  assert.equal(result.registration_block_code, 'outstanding_debt');
  assert.equal(result.data[0].start_date, '2026-03-21');
  assert.equal(result.data[0].display?.start_date, '۱۴۰۵/۰۱/۰۱');
  assert.equal(row.display, undefined);
});

test('enrollment uses the selected class and term without sending a student identity', async () => {
  const calls: unknown[] = [];
  const api = createRegistrationsApi(axios.create({ adapter: config => {
    calls.push([config.method, config.url, config.data]);
    return Promise.resolve(response(config, { status: true, registration: { id: 8 } }, 201));
  } }));
  await api.enrollInClass(row);
  assert.deepEqual(calls, [['post', '/terms/11/classes/5/registrations', undefined]]);
});

test('cancellation uses the registration and term belonging to the row and localizes the cancellation timestamp', async () => {
  let url = '';
  const api = createRegistrationsApi(axios.create({ adapter: config => {
    url = config.url ?? '';
    return Promise.resolve(response(config, { status: true, registration: { id: 8, cancelled_at: '2026-03-21T08:00:00Z' } }));
  } }));
  const result = await api.cancelRegistration(enrolled);
  assert.equal(url, '/terms/11/classes/5/registrations/8');
  assert.equal(result.registration.cancelled_at, '2026-03-21T08:00:00Z');
  assert.match((result.registration as unknown as { display: { cancelled_at: string } }).display.cancelled_at, /۱۴۰۵/);
});

test('missing or mismatched enrollment IDs cannot dispatch destructive requests', async () => {
  let calls = 0;
  const api = createRegistrationsApi(axios.create({ adapter: config => { calls++; return Promise.resolve(response(config, {})); } }));
  await assert.rejects(api.enrollInClass({ ...row, term_id: 0 }), /identifiers/);
  await assert.rejects(api.cancelRegistration({ ...enrolled, registrations: [] }), /missing/);
  await assert.rejects(api.cancelRegistration({ ...enrolled, registrations: [{ ...enrolled.registrations[0], class_id: 99 }] }), /missing/);
  assert.equal(calls, 0);
});

test('cancellation and enrollment require explicit success and operation confirmation', async () => {
  for (const body of [{ status: false }, { status: true }]) {
    const api = createRegistrationsApi(axios.create({ adapter: config => Promise.resolve(response(config, body)) }));
    await assert.rejects(api.enrollInClass(row));
    await assert.rejects(api.cancelRegistration(enrolled));
  }
});

test('policy read and write retain a real boolean including the permissive false value', async () => {
  const calls: unknown[] = [];
  const api = createRegistrationsApi(axios.create({ adapter: config => {
    calls.push([config.method, config.url, config.data ? JSON.parse(config.data as string) : null]);
    return Promise.resolve(response(config, { status: true, policy: { cancellation_requires_settlement: false } }));
  } }));
  assert.equal((await api.getCancellationPolicy()).policy.cancellation_requires_settlement, false);
  assert.equal((await api.updateCancellationPolicy({ cancellation_requires_settlement: false })).policy.cancellation_requires_settlement, false);
  assert.deepEqual(calls[1], ['put', '/registration-policy', { cancellation_requires_settlement: false }]);
});

test('malformed catalogues and policies cannot enable enrollment or imply permissive cancellation', async () => {
  const api = createRegistrationsApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: true, data: [{}], policy: { cancellation_requires_settlement: 'false' } })) }));
  await assert.rejects(api.getAvailableClasses(), /Invalid/);
  await assert.rejects(api.getCancellationPolicy(), /Invalid/);
});

test('settlement conflicts and field errors remain readable to the student', () => {
  const config = {} as import('axios').InternalAxiosRequestConfig;
  const conflict = new axios.AxiosError('Conflict', 'ERR_BAD_REQUEST', config, undefined, response(config, { message: 'Full settlement is required.' }, 409));
  assert.equal(enrollmentError(conflict, 'Fallback'), 'Full settlement is required.');
  const invalid = new axios.AxiosError('Invalid', 'ERR_BAD_REQUEST', config, undefined, response(config, { message: 'Invalid', errors: { amount: ['Amount exceeds the balance.'] } }, 422));
  assert.equal(enrollmentError(invalid, 'Fallback'), 'Amount exceeds the balance.');
});
