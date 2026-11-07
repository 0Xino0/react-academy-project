import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createGradesApi, gradeEntries, gradeError } from '../../src/services/grades.ts';
import { createAcademicsApi } from '../../src/services/academics.ts';
import type { ApiStudent } from '../../src/types/Students.ts';
import type { GradeRecord } from '../../src/types/Grades.ts';
import { response, rejectStatus } from '../helpers.ts';

const student = { id: 7, user: { first_name: 'Test', last_name: 'Student' } } as ApiStudent;
const classroom = { id: 5, term_id: 11, name: 'Real class', registrations_count: 1, start_date: '2026-03-21' };
const row = { id: 9, student_id: 7, class_id: 5, grade: 0, student, updated_at: '2026-03-21T08:00:00Z' } as GradeRecord;
const catalogue = { status: true, class: classroom, students: [student], grades: [row] };

test('the grade list reads grades and its real roster, keeps zero numeric and adds Persian display', async () => {
  const api = createGradesApi(axios.create({ adapter: config => {
    assert.equal(config.url, '/classes/5/grades');
    return Promise.resolve(response(config, catalogue));
  } }));
  const result = await api.getGrades(5);
  assert.equal(result.grades[0].grade, 0);
  assert.equal(result.students[0].id, 7);
  assert.equal(result.class.display?.start_date, '۱۴۰۵/۰۱/۰۱');
  assert.match(result.grades[0].display?.updated_at ?? '', /۱۴۰۵/);
  assert.equal(row.display, undefined);
});

test('an empty class roster and grade list are valid', async () => {
  const api = createGradesApi(axios.create({ adapter: config => Promise.resolve(response(config, { ...catalogue, students: [], grades: [] })) }));
  assert.deepEqual((await api.getGrades(5)).grades, []);
});

test('an unrecorded grade is null while recorded zero is a real student grade', async () => {
  let value: unknown = null;
  const api = createGradesApi(axios.create({ adapter: config => {
    assert.equal(config.url, '/me/classes/5/grades');
    return Promise.resolve(response(config, { status: true, grade: value }));
  } }));
  assert.equal((await api.getGradesOfStudent(5)).grade, null);
  value = { ...row, class: classroom };
  assert.equal((await api.getGradesOfStudent(5)).grade?.grade, 0);
});

test('saving uses real class and student IDs and requires the confirmed saved values', async () => {
  let call: unknown;
  const api = createGradesApi(axios.create({ adapter: config => {
    call = [config.method, config.url, JSON.parse(config.data as string)];
    return Promise.resolve(response(config, { status: true, grades: [{ ...row, grade: 18.125 }] }));
  } }));
  const result = await api.saveGrades(5, [{ student_id: 7, grade: 18.125 }]);
  assert.deepEqual(call, ['post', '/classes/5/grades/batch', { grades: [{ student_id: 7, grade: 18.125 }] }]);
  assert.equal(result.grades[0].grade, 18.125);
});

test('invalid class IDs or batches cannot dispatch requests', async () => {
  let calls = 0;
  const api = createGradesApi(axios.create({ adapter: config => { calls++; return Promise.resolve(response(config, {})); } }));
  for (const id of [0, -1, NaN, 1.5]) {
    await assert.rejects(api.getGrades(id)); await assert.rejects(api.getGradesOfStudent(id));
  }
  for (const entries of [[], [{ student_id: 7, grade: -1 }], [{ student_id: 7, grade: 21 }], [{ student_id: 7, grade: NaN }],
    [{ student_id: 7, grade: Infinity }], [{ student_id: 0, grade: 10 }], [{ student_id: 7, grade: 10 }, { student_id: 7, grade: 11 }]]) {
    await assert.rejects(api.saveGrades(5, entries));
  }
  assert.equal(calls, 0);
});

test('resolved status false cannot report any grade operation as successful', async () => {
  const api = createGradesApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: false })) }));
  await assert.rejects(api.getGrades(5), /not successful/);
  await assert.rejects(api.getGradesOfStudent(5), /not successful/);
  await assert.rejects(api.saveGrades(5, [{ student_id: 7, grade: 0 }]), /not successful/);
});

test('old data envelopes, numeric strings, wrong classes or malformed rosters are rejected', async () => {
  for (const body of [{ ...catalogue, grades: undefined, data: [row] }, { ...catalogue, grades: [{ ...row, grade: '18' }] },
    { ...catalogue, grades: [{ ...row, class_id: 8 }] }, { ...catalogue, class: { ...classroom, id: 8 } },
    { ...catalogue, students: [{}] }, { ...catalogue, grades: [row, row] }]) {
    const api = createGradesApi(axios.create({ adapter: config => Promise.resolve(response(config, body)) }));
    await assert.rejects(api.getGrades(5), /Invalid/);
  }
});

test('a response missing the requested saved grade cannot confirm the write', async () => {
  for (const grades of [[], [{ ...row, grade: 19 }]]) {
    const api = createGradesApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: true, grades })) }));
    await assert.rejects(api.saveGrades(5, [{ student_id: 7, grade: 18 }]), /not confirmed/);
  }
});

test('new blank rows are omitted, zero is saved and unchanged values are not resent', () => {
  const second = { ...student, id: 8 };
  assert.deepEqual(gradeEntries([student, second], { 7: '0', 8: '' }, []), [{ student_id: 7, grade: 0 }]);
  assert.deepEqual(gradeEntries([student], { 7: '0.0' }, [row]), []);
  assert.deepEqual(gradeEntries([student], { 7: '20' }, [row]), [{ student_id: 7, grade: 20 }]);
});

test('clearing a saved grade is not silently treated as deletion or zero', () => {
  assert.throws(() => gradeEntries([student], { 7: '' }, [row]), /cannot be cleared/);
  for (const raw of ['abc', '-1', '20.01', 'Infinity']) assert.throws(() => gradeEntries([student], { 7: raw }, []), /0 to 20/);
});

test('only active roster members are included in an edit batch even if history has grades', () => {
  const history = { ...row, student_id: 99 };
  assert.deepEqual(gradeEntries([student], { 7: '18', 99: '20' }, [history]), [{ student_id: 7, grade: 18 }]);
});

test('student history is opt-in and does not change the default active class list request', async () => {
  const calls: unknown[] = [];
  const api = createAcademicsApi(axios.create({ adapter: config => {
    calls.push([config.url, config.params]);
    return Promise.resolve(response(config, { status: true, classes: [{ ...classroom, registrations: [] }] }));
  } }));
  await api.getClassesForStudent(11);
  await api.getClassesForStudent(11, true);
  assert.deepEqual(calls, [['/me/studying-terms/11/classes', undefined], ['/me/studying-terms/11/classes', { include_cancelled: 1 }]]);
});

test('teacher class counts describe actual enrollment and reject a malformed list', async () => {
  let classes: unknown[] = [classroom];
  const api = createAcademicsApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: true, classes })) }));
  assert.equal((await api.getClassesForTeacher(11)).classes[0].registrations_count, 1);
  classes = [{ ...classroom, registrations_count: undefined }];
  await assert.rejects(api.getClassesForTeacher(11), /Invalid/);
});

test('HTTP authorization and missing-class failures remain errors rather than unrecorded states', async () => {
  for (const code of [403, 404]) {
    const api = createGradesApi(axios.create({ adapter: config => rejectStatus(config, code) }));
    await assert.rejects(api.getGradesOfStudent(5), error => axios.isAxiosError(error) && error.response?.status === code);
  }
});

test('field validation messages take priority over a generic error summary', () => {
  const config = {} as import('axios').InternalAxiosRequestConfig;
  const error = new axios.AxiosError('Invalid', 'ERR_BAD_REQUEST', config, undefined, response(config, {
    message: 'Validation failed', errors: { 'grades.0.grade': ['A grade must be between 0 and 20.'] },
  }, 422));
  assert.equal(gradeError(error), 'A grade must be between 0 and 20.');
});
