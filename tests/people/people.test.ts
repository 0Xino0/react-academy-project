import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createPeopleApi, normalizeSalary, peopleError } from '../../src/services/people.ts';
import type { TeacherRegistrationData } from '../../src/types/teachers.ts';
import { response, rejectStatus } from '../helpers.ts';

const user = { id: 3, first_name: 'Real', last_name: 'Person', email: 'person@example.test', phone: '+989123456789', national_id: '0123456789', created_at: '2026-03-21T08:00:00Z' };
const teacher = { id: 7, user_id: 3, salary: '0', resume: null, bio: null, degree: null, user };
const student = { id: 8, user_id: 3, father_name: null, father_phone: null, mother_name: null, mother_phone: null, user };
const registration: TeacherRegistrationData = { national_id: '0123456789', first_name: 'Real', last_name: 'Person', email: user.email,
  phone: user.phone, password: 'test-password-only', password_confirmation: 'test-password-only' };

test('empty teacher and class student lists are valid successful arrays', async () => {
  const api = createPeopleApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: true, data: [] })) }));
  assert.deepEqual((await api.getTeachers()).data, []);
  assert.deepEqual((await api.getStudentsByClassId(5)).data, []);
});

test('teacher salary zero remains a string and calendar presentation preserves the raw timestamp', async () => {
  const api = createPeopleApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: true, data: [teacher] })) }));
  const result = await api.getTeachers();
  assert.equal(result.data[0].salary, '0');
  assert.equal(result.data[0].user.created_at, user.created_at);
  assert.match((result.data[0].user as typeof user & { display: { created_at: string } }).display.created_at, /۱۴۰۵/);
  assert.equal('display' in user, false);
});

test('student lists and details have separate envelopes and preserve nullable parent fields', async () => {
  const calls: string[] = [];
  const api = createPeopleApi(axios.create({ adapter: config => {
    calls.push(config.url ?? '');
    return Promise.resolve(response(config, { status: true, data: config.url?.includes('/classes/') ? [student] : student }));
  } }));
  assert.equal((await api.getStudentsByClassId(5)).data[0].father_name, null);
  assert.equal((await api.getStudentById(8)).data.id, 8);
  assert.deepEqual(calls, ['/classes/5/students', '/students/8']);
});

test('salary updates use the teacher profile ID and exact integer strings larger than Number.MAX_SAFE_INTEGER', async () => {
  const calls: unknown[] = [];
  const api = createPeopleApi(axios.create({ adapter: config => {
    const payload = JSON.parse(config.data as string);
    calls.push([config.method, config.url, payload]);
    return Promise.resolve(response(config, { status: true, data: { ...teacher, salary: payload.salary } }));
  } }));
  assert.equal((await api.updateTeacherSalary(7, { salary: '9007199254740993' })).data.salary, '9007199254740993');
  assert.equal((await api.updateTeacherSalary(7, { salary: '000' })).data.salary, '0');
  assert.deepEqual(calls, [['put', '/teachers/7/admin-info', { salary: '9007199254740993' }], ['put', '/teachers/7/admin-info', { salary: '0' }]]);
});

test('salary normalization preserves 64 bit integers without float parsing and rejects unsupported values', () => {
  assert.equal(normalizeSalary('000123'), '123');
  assert.equal(normalizeSalary('9223372036854775807'), '9223372036854775807');
  for (const input of ['', '-1', '1.5', '1e3', 'NaN', '9223372036854775808']) assert.throws(() => normalizeSalary(input));
});

test('invalid identifiers and salaries never dispatch mutations', async () => {
  let calls = 0;
  const api = createPeopleApi(axios.create({ adapter: config => { calls++; return Promise.resolve(response(config, {})); } }));
  for (const value of [0, -1, 1.5, NaN]) {
    await assert.rejects(api.getStudentById(value)); await assert.rejects(api.getStudentsByClassId(value));
    await assert.rejects(api.deleteStudent(value)); await assert.rejects(api.deleteTeacher(value));
    await assert.rejects(api.updateTeacherSalary(value, { salary: '0' }));
  }
  for (const value of ['', '-1', '1.5', '1e3']) await assert.rejects(api.updateTeacherSalary(7, { salary: value }));
  assert.equal(calls, 0);
});

test('resolved status false cannot confirm any account or profile action', async () => {
  const api = createPeopleApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: false })) }));
  for (const action of [() => api.getTeachers(), () => api.getStudentsByClassId(5), () => api.getStudentById(8),
    () => api.registerTeacher(registration), () => api.updateTeacherSalary(7, { salary: '0' }), () => api.deleteTeacher(7), () => api.deleteStudent(8)]) {
    await assert.rejects(action, /not successful/);
  }
});

test('malformed lists are rejected instead of being coerced from null or a single object', async () => {
  for (const data of [null, undefined, teacher, [undefined], [{}]]) {
    const api = createPeopleApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: true, data })) }));
    await assert.rejects(api.getTeachers(), /Invalid/); await assert.rejects(api.getStudentsByClassId(5), /Invalid/);
  }
});

test('student details must match the selected profile and its actual account', async () => {
  for (const value of [{ ...student, id: 99 }, { ...student, user_id: 999 }, { ...student, user: null }]) {
    const api = createPeopleApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: true, data: value })) }));
    await assert.rejects(api.getStudentById(8), /Invalid/);
  }
});

test('a salary response for another profile or another value cannot confirm the edit', async () => {
  for (const value of [{ ...teacher, id: 99 }, { ...teacher, salary: '200' }, { ...teacher, salary: 100 }]) {
    const api = createPeopleApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: true, data: value })) }));
    await assert.rejects(api.updateTeacherSalary(7, { salary: '100' }), /not confirmed/);
  }
});

test('teacher creation preserves a leading national ID zero and requires a linked persisted profile', async () => {
  let body: unknown;
  const api = createPeopleApi(axios.create({ adapter: config => {
    body = JSON.parse(config.data as string);
    assert.equal(config.url, '/users');
    return Promise.resolve(response(config, { status: true, data: { id: 3 }, role: ['teacher'], teacher: { id: 7, user_id: 3 } }));
  } }));
  assert.equal((await api.registerTeacher(registration)).teacher.id, 7);
  assert.deepEqual(body, registration);
});

test('a missing profile, owner mismatch or wrong role cannot confirm teacher account creation', async () => {
  for (const body of [{ status: true }, { status: true, data: { id: 3 }, role: ['teacher'], teacher: { id: 7, user_id: 99 } },
    { status: true, data: { id: 3 }, role: ['student'], teacher: { id: 7, user_id: 3 } }]) {
    const api = createPeopleApi(axios.create({ adapter: config => Promise.resolve(response(config, body)) }));
    await assert.rejects(api.registerTeacher(registration), /not confirmed/);
  }
});

test('profile deactivation uses its own profile route rather than deleting a class enrollment or user', async () => {
  const urls: string[] = [];
  const api = createPeopleApi(axios.create({ adapter: config => {
    urls.push(config.url ?? '');
    return Promise.resolve(response(config, { status: true, error: null }));
  } }));
  await api.deleteTeacher(7); await api.deleteStudent(8);
  assert.deepEqual(urls, ['/teachers/7', '/students/8']);
});

test('missing profiles and unauthorized actions remain real HTTP errors', async () => {
  for (const code of [403, 404]) {
    const api = createPeopleApi(axios.create({ adapter: config => rejectStatus(config, code) }));
    await assert.rejects(api.deleteStudent(8), error => axios.isAxiosError(error) && error.response?.status === code);
  }
});

test('field validation errors remain readable in the editing form', () => {
  const config = {} as import('axios').InternalAxiosRequestConfig;
  const error = new axios.AxiosError('Invalid', 'ERR_BAD_REQUEST', config, undefined, response(config, {
    message: 'Validation failed', errors: { salary: ['Salary must be a non-negative integer.'] },
  }, 422));
  assert.equal(peopleError(error), 'Salary must be a non-negative integer.');
});
