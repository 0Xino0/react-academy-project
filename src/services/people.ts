import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { ApiTeacher, ApiTeachersResponse, TeacherDeleteResponse, TeacherRegistrationData, TeacherRegistrationResponse, TeacherUpdateData, TeacherUpdateResponse } from '../types/teachers.ts';
import type { ApiStudent, ApiStudentResponse, ApiStudentsResponse, DeleteStudentResponse } from '../types/Students.ts';
import { withCalendarDisplay } from './calendar.ts';

const validId = (id: number) => Number.isInteger(id) && id > 0;
function id(value: number): number {
  if (!validId(value)) throw new Error('A valid profile or class is required.');
  return value;
}
function success(value: { status: boolean }): void {
  if (!value || value.status !== true) throw new Error('The account or profile request was not successful.');
}
function validPerson(row: ApiStudent | ApiTeacher): boolean {
  return !!row && validId(row.id) && validId(row.user_id) && row.user?.id === row.user_id
    && ['first_name', 'last_name', 'email', 'phone', 'national_id'].every(field => typeof row.user[field as keyof typeof row.user] === 'string');
}
function validTeacher(row: ApiTeacher): boolean {
  return validPerson(row) && (row.salary === null || typeof row.salary === 'string');
}
function validStudent(row: ApiStudent): boolean {
  return validPerson(row) && ['father_name', 'father_phone', 'mother_name', 'mother_phone'].every(field => {
    const value = row[field as keyof ApiStudent];
    return value === null || typeof value === 'string';
  });
}

// Keep integer strings exact, including salaries larger than JavaScript's safe integer.
export function normalizeSalary(value: string): string {
  if (!/^\d+$/.test(value)) throw new Error('Salary must be a non-negative whole number.');
  const result = value.replace(/^0+(?=\d)/, '');
  const maximum = '9223372036854775807';
  if (result.length > maximum.length || (result.length === maximum.length && result > maximum)) throw new Error('Salary exceeds the supported integer range.');
  return result;
}
export function peopleError(error: unknown, fallback = 'The account or profile request could not be completed.'): string {
  if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
    const fields = Object.values(error.response?.data?.errors ?? {}).flat();
    return fields.length ? fields.join(' ') : error.response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function createPeopleApi(client: AxiosInstance) {
  return {
    async getTeachers(): Promise<ApiTeachersResponse> {
      const { data } = await client.get<ApiTeachersResponse>('/teachers');
      success(data);
      if (!Array.isArray(data.data) || !data.data.every(validTeacher)) throw new Error('Invalid teacher list response.');
      return withCalendarDisplay(data);
    },
    async registerTeacher(payload: TeacherRegistrationData): Promise<TeacherRegistrationResponse> {
      const { data } = await client.post<TeacherRegistrationResponse>('/users', payload);
      success(data);
      if (!data.data || !validId(data.data.id) || !data.teacher || !validId(data.teacher.id)
        || data.teacher.user_id !== data.data.id || !Array.isArray(data.role) || !data.role.includes('teacher')) {
        throw new Error('The teacher account was not confirmed. Check the teacher list before trying again.');
      }
      return withCalendarDisplay(data);
    },
    async updateTeacherSalary(profileId: number, payload: TeacherUpdateData): Promise<TeacherUpdateResponse> {
      const salary = normalizeSalary(payload.salary);
      const { data } = await client.put<TeacherUpdateResponse>(`/teachers/${id(profileId)}/admin-info`, { salary });
      success(data);
      if (!validTeacher(data.data) || data.data.id !== profileId || data.data.salary !== salary) throw new Error('The updated salary was not confirmed. Reload the teacher list.');
      return withCalendarDisplay(data);
    },
    async deleteTeacher(profileId: number): Promise<TeacherDeleteResponse> {
      const { data } = await client.delete<TeacherDeleteResponse>(`/teachers/${id(profileId)}`);
      success(data);
      return data;
    },
    async getStudentsByClassId(classId: number): Promise<ApiStudentsResponse> {
      const { data } = await client.get<ApiStudentsResponse>(`/classes/${id(classId)}/students`);
      success(data);
      if (!Array.isArray(data.data) || !data.data.every(validStudent)) throw new Error('Invalid student list response.');
      return withCalendarDisplay(data);
    },
    async getStudentById(profileId: number): Promise<ApiStudentResponse> {
      const { data } = await client.get<ApiStudentResponse>(`/students/${id(profileId)}`);
      success(data);
      if (!validStudent(data.data) || data.data.id !== profileId) throw new Error('Invalid student details response.');
      return withCalendarDisplay(data);
    },
    async deleteStudent(profileId: number): Promise<DeleteStudentResponse> {
      const { data } = await client.delete<DeleteStudentResponse>(`/students/${id(profileId)}`);
      success(data);
      return data;
    },
  };
}
