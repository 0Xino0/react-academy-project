import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import type { Class, ClassFormData } from '../../src/types/classes.ts';
import { createAcademicsApi, academicErrorMessage } from '../../src/services/academics.ts';
import { response, rejectStatus } from '../helpers.ts';

const form: ClassFormData = {
  name: 'Editing test', course_id: 3, teacher_id: 4, term_id: 11, capacity: 2, tuition_fee: 0,
  start_date: '2026-03-21', end_date: '2026-06-20', startRegistration_Date: '2026-02-01', endRegistration_Date: '2026-03-01',
};
const row = { ...form, id: 5, registrations_count: 2, tuition_fee: '0.00', teacher: null } as Class;
const termForm = { year: 1405, season: 'spring', start_date: '2026-03-21', end_date: '2026-06-20', is_active: true };
const term = { ...termForm, id: 11 };

test('class edits and deletion use the original row IDs and preserve raw Gregorian payloads and zero tuition', async () => {
  const calls: Array<{ method: string | undefined; url: string | undefined; body: unknown }> = [];
  const api = createAcademicsApi(axios.create({ adapter: config => {
    calls.push({ method: config.method, url: config.url, body: config.data ? JSON.parse(config.data as string) : null });
    return Promise.resolve(response(config, config.method === 'delete' ? { status: true, error: null }
      : { status: true, class: row }));
  } }));
  const updated = await api.updateClass(row, form);
  assert.equal(updated.class.start_date, '2026-03-21');
  assert.equal(updated.class.display?.start_date, '۱۴۰۵/۰۱/۰۱');
  assert.equal(updated.class.registrations_count, 2);
  assert.equal(updated.class.teacher, null);
  await api.deleteClass(row);
  assert.deepEqual(calls, [
    { method: 'put', url: '/terms/11/classes/5', body: form },
    { method: 'delete', url: '/terms/11/classes/5', body: null },
  ]);
});

test('a term move or invalid row identifiers are rejected before an API request is dispatched', async () => {
  let calls = 0;
  const api = createAcademicsApi(axios.create({ adapter: config => { calls++; return Promise.resolve(response(config, {})); } }));
  await assert.rejects(api.updateClass(row, { ...form, term_id: 99 }), /another term/);
  await assert.rejects(api.deleteClass({ ...row, term_id: 0 }), /identifiers/);
  assert.equal(calls, 0);
});

test('create and update terms send form fields and receive a localized copy with boolean status', async () => {
  const payloads: unknown[] = [];
  const api = createAcademicsApi(axios.create({ adapter: config => {
    payloads.push(JSON.parse(config.data as string));
    return Promise.resolve(response(config, { status: true, term }, config.method === 'post' ? 201 : 200));
  } }));
  const created = await api.createTerm(termForm);
  const updated = await api.updateTerm(11, termForm);
  assert.deepEqual(payloads, [termForm, termForm]);
  assert.equal(created.term.display?.start_date, '۱۴۰۵/۰۱/۰۱');
  assert.equal(updated.term.is_active, true);
  assert.equal(updated.term.start_date, '2026-03-21');
});

test('empty term and class lists are valid responses', async () => {
  const api = createAcademicsApi(axios.create({ adapter: config => Promise.resolve(response(config, {
    status: true, terms: [], classes: [],
  })) }));
  assert.deepEqual((await api.getTerms()).terms, []);
  assert.deepEqual((await api.getClassesByTermId(11)).classes, []);
});

test('HTTP 200 with status false cannot confirm an academic mutation', async () => {
  const api = createAcademicsApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: false })) }));
  for (const action of [() => api.createClass(form), () => api.updateClass(row, form), () => api.deleteClass(row),
    () => api.createTerm(termForm), () => api.updateTerm(11, termForm), () => api.deleteTerm(11)]) {
    await assert.rejects(action, /not successful/);
  }
});

test('missing entities, enrollment counts and malformed list data are rejected', async () => {
  const api = createAcademicsApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: true })) }));
  await assert.rejects(api.createClass(form), /Invalid class/);
  await assert.rejects(api.createTerm(termForm), /Invalid term/);
  await assert.rejects(api.getTerms(), /Invalid term list/);
  await assert.rejects(api.getClassesByTermId(11), /Invalid class list/);
});

test('field errors take priority over a generic validation summary', async () => {
  const api = createAcademicsApi(axios.create({ adapter: config => Promise.reject(new axios.AxiosError('Rejected', 'ERR_BAD_REQUEST', config,
    undefined, response(config, { message: 'Validation failed', errors: { capacity: ['Capacity is below enrollment.'] } }, 422))) }));
  try {
    await api.updateClass(row, form);
    assert.fail('Invalid capacity must be rejected');
  } catch (error) {
    assert.equal(academicErrorMessage(error, 'Fallback'), 'Capacity is below enrollment.');
  }
});

test('HTTP 404 is preserved for stale or missing classes', async () => {
  const api = createAcademicsApi(axios.create({ adapter: config => rejectStatus(config, 404) }));
  await assert.rejects(api.updateClass(row, form), error => axios.isAxiosError(error) && error.response?.status === 404);
});
