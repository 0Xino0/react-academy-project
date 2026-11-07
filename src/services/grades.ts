import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { ApiGradeResponse, ApiGradesResponse, GradeEntry, GradeRecord, SaveGradesResponse } from '../types/Grades.ts';
import type { ApiStudent } from '../types/Students.ts';
import { withCalendarDisplay } from './calendar.ts';

const positiveId = (id: number) => Number.isInteger(id) && id > 0;
const validMark = (grade: unknown) => typeof grade === 'number' && Number.isFinite(grade) && grade >= 0 && grade <= 20;
function classPath(id: number): string {
  if (!positiveId(id)) throw new Error('A valid class is required.');
  return `/classes/${id}/grades`;
}
function success(value: { status: boolean }) {
  if (!value || value.status !== true) throw new Error('The grade request was not successful.');
}
function validRecord(row: GradeRecord, classId: number): boolean {
  return !!row && positiveId(row.id) && positiveId(row.student_id) && row.class_id === classId && validMark(row.grade)
    && row.student?.id === row.student_id && typeof row.student.user?.first_name === 'string' && typeof row.student.user?.last_name === 'string';
}
function records(rows: GradeRecord[], classId: number): void {
  if (!Array.isArray(rows) || !rows.every(row => validRecord(row, classId))
    || new Set(rows.map(row => row.student_id)).size !== rows.length) throw new Error('Invalid grade list response.');
}
export function gradeError(error: unknown, fallback = 'The grade request could not be completed.'): string {
  if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
    const fields = Object.values(error.response?.data?.errors ?? {}).flat();
    return fields.length ? fields.join(' ') : error.response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

// Blank new rows are omitted; blanking an existing grade is not a delete operation.
export function gradeEntries(students: ApiStudent[], drafts: Record<number, string>, previous: GradeRecord[]): GradeEntry[] {
  const entries: GradeEntry[] = [];
  for (const student of students) {
    const raw = (drafts[student.id] ?? '').trim();
    const old = previous.find(row => row.student_id === student.id);
    if (!raw) {
      if (old) throw new Error(`The recorded grade for ${student.user.first_name} cannot be cleared. Enter a number from 0 to 20.`);
      continue;
    }
    const grade = Number(raw);
    if (!validMark(grade)) throw new Error('Every entered grade must be a number from 0 to 20.');
    if (!old || old.grade !== grade) entries.push({ student_id: student.id, grade });
  }
  return entries;
}

export function createGradesApi(client: AxiosInstance) {
  return {
    async getGrades(classId: number): Promise<ApiGradesResponse> {
      const { data } = await client.get<ApiGradesResponse>(classPath(classId));
      success(data);
      records(data.grades, classId);
      if (data.class?.id !== classId || typeof data.class.name !== 'string' || !Array.isArray(data.students)
        || !data.students.every(row => row && positiveId(row.id) && typeof row.user?.first_name === 'string' && typeof row.user?.last_name === 'string')
        || new Set(data.students.map(row => row.id)).size !== data.students.length) throw new Error('Invalid class roster response.');
      return withCalendarDisplay(data);
    },
    async getGradesOfStudent(classId: number): Promise<ApiGradeResponse> {
      classPath(classId);
      const { data } = await client.get<ApiGradeResponse>(`/me/classes/${classId}/grades`);
      success(data);
      if (data.grade !== null && (!validRecord(data.grade, classId) || data.grade.class?.id !== classId)) throw new Error('Invalid student grade response.');
      return withCalendarDisplay(data);
    },
    async saveGrades(classId: number, entries: GradeEntry[]): Promise<SaveGradesResponse> {
      const url = classPath(classId);
      if (!entries.length || !entries.every(row => positiveId(row.student_id) && validMark(row.grade))
        || new Set(entries.map(row => row.student_id)).size !== entries.length) throw new Error('Enter valid grades for distinct students before saving.');
      const { data } = await client.post<SaveGradesResponse>(`${url}/batch`, { grades: entries });
      success(data);
      records(data.grades, classId);
      if (data.grades.length !== entries.length || !entries.every(entry => data.grades.some(row => row.student_id === entry.student_id && row.grade === entry.grade))) {
        throw new Error('The saved grades were not confirmed. Reload the class before trying again.');
      }
      return withCalendarDisplay(data);
    },
  };
}
