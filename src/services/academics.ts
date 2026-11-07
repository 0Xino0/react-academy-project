import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { Class, ClassFormData, ClassResponse, ClassesResponse, ClassesResponseForStudent, DeleteClassResponse } from '../types/classes.ts';
import type { TermFormData, TermResponse, TermsResponse, DeleteTermResponse } from '../types/Terms.ts';
import { withCalendarDisplay } from './calendar.ts';

function success(value: unknown): void {
  if (!value || typeof value !== 'object' || !('status' in value) || value.status !== true) {
    throw new Error('The academic request was not successful.');
  }
}

function classResponse(value: ClassResponse): ClassResponse {
  success(value);
  if (!value.class || !Number.isInteger(value.class.id) || !Number.isInteger(value.class.term_id)
    || !Number.isInteger(value.class.registrations_count)) throw new Error('Invalid class response.');
  return withCalendarDisplay(value);
}

function classPath(row: Class): string {
  if (![row.id, row.term_id].every(id => Number.isInteger(id) && id > 0)) {
    throw new Error('Class identifiers are missing. Reload the class list.');
  }
  return `/terms/${row.term_id}/classes/${row.id}`;
}

function termResponse(value: TermResponse): TermResponse {
  success(value);
  if (!value.term || !Number.isInteger(value.term.id) || typeof value.term.is_active !== 'boolean') {
    throw new Error('Invalid term response.');
  }
  return withCalendarDisplay(value);
}

export function academicErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
    const fields = Object.values(error.response?.data?.errors ?? {}).flat();
    return fields.length ? fields.join(' ') : error.response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function createAcademicsApi(client: AxiosInstance) {
  return {
    async getClassesForTeacher(termId: number): Promise<ClassesResponse> {
      if (!Number.isInteger(termId) || termId <= 0) throw new Error('A valid term is required.');
      const { data } = await client.get<ClassesResponse>(`/me/teaching-terms/${termId}/classes`);
      success(data);
      if (!Array.isArray(data.classes) || !data.classes.every(row => row && row.term_id === termId
        && Number.isInteger(row.id) && Number.isInteger(row.registrations_count))) throw new Error('Invalid teacher class list.');
      return withCalendarDisplay(data);
    },
    async getClassesForStudent(termId: number, includeCancelled = false): Promise<ClassesResponseForStudent> {
      if (!Number.isInteger(termId) || termId <= 0) throw new Error('A valid term is required.');
      const { data } = await client.get<ClassesResponseForStudent>(`/me/studying-terms/${termId}/classes`, {
        params: includeCancelled ? { include_cancelled: 1 } : undefined,
      });
      success(data);
      if (!Array.isArray(data.classes) || !data.classes.every(row => row && row.term_id === termId
        && Number.isInteger(row.id) && Array.isArray(row.registrations))) throw new Error('Invalid student class list.');
      return withCalendarDisplay(data);
    },
    async getTerms(): Promise<TermsResponse> {
      const { data } = await client.get<TermsResponse>('/terms');
      success(data);
      if (!Array.isArray(data.terms)) throw new Error('Invalid term list response.');
      return withCalendarDisplay(data);
    },
    async createTerm(payload: TermFormData): Promise<TermResponse> {
      const { data } = await client.post<TermResponse>('/terms', payload);
      return termResponse(data);
    },
    async updateTerm(id: number, payload: TermFormData): Promise<TermResponse> {
      const { data } = await client.put<TermResponse>(`/terms/${id}`, payload);
      return termResponse(data);
    },
    async deleteTerm(id: number): Promise<DeleteTermResponse> {
      const { data } = await client.delete<DeleteTermResponse>(`/terms/${id}`);
      success(data);
      return data;
    },
    async getClassesByTermId(id: number): Promise<ClassesResponse> {
      const { data } = await client.get<ClassesResponse>(`/terms/${id}/classes`);
      success(data);
      if (!Array.isArray(data.classes)) throw new Error('Invalid class list response.');
      return withCalendarDisplay(data);
    },
    async createClass(payload: ClassFormData): Promise<ClassResponse> {
      const { data } = await client.post<ClassResponse>(`/terms/${payload.term_id}/classes`, payload);
      return classResponse(data);
    },
    async updateClass(row: Class, payload: ClassFormData): Promise<ClassResponse> {
      if (payload.term_id !== row.term_id) throw new Error('A class cannot be moved to another term.');
      const { data } = await client.put<ClassResponse>(classPath(row), payload);
      return classResponse(data);
    },
    async deleteClass(row: Class): Promise<DeleteClassResponse> {
      const { data } = await client.delete<DeleteClassResponse>(classPath(row));
      success(data);
      return data;
    },
  };
}
