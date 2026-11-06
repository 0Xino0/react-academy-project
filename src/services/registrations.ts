import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { AvailableClass, AvailableClassesResponse, CancellationPolicy, EnrollmentResponse, PolicyResponse } from '../types/Enrollment.ts';
import type { ClassForStudent } from '../types/classes.ts';
import { withCalendarDisplay } from './calendar.ts';

function success(value: unknown): void {
  if (!value || typeof value !== 'object' || !('status' in value) || value.status !== true) throw new Error('The enrollment request was not successful.');
}

function path(term: number, classId: number, registrationId?: number): string {
  if (![term, classId, ...(registrationId === undefined ? [] : [registrationId])].every(id => Number.isInteger(id) && id > 0)) {
    throw new Error('Enrollment identifiers are missing. Reload the class list.');
  }
  return `/terms/${term}/classes/${classId}/registrations${registrationId === undefined ? '' : '/' + registrationId}`;
}

export function enrollmentError(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
    const fields = Object.values(error.response?.data?.errors ?? {}).flat();
    return fields.length ? fields.join(' ') : error.response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function policy(data: PolicyResponse): PolicyResponse {
  success(data);
  if (typeof data.policy?.cancellation_requires_settlement !== 'boolean') throw new Error('Invalid cancellation policy.');
  return data;
}

export function createRegistrationsApi(client: AxiosInstance) {
  return {
    async getAvailableClasses(): Promise<AvailableClassesResponse> {
      const { data } = await client.get<AvailableClassesResponse>('/courses/active');
      success(data);
      if (!Array.isArray(data.data) || !data.data.every(row => Number.isInteger(row.id) && Number.isInteger(row.term_id)
        && typeof row.can_register === 'boolean' && Array.isArray(row.schedules))) throw new Error('Invalid available class list.');
      return withCalendarDisplay(data);
    },
    async enrollInClass(row: AvailableClass): Promise<EnrollmentResponse> {
      const { data } = await client.post<EnrollmentResponse>(path(row.term_id, row.id));
      success(data);
      if (!data.registration?.id) throw new Error('Enrollment was not confirmed.');
      return withCalendarDisplay(data);
    },
    async cancelRegistration(row: ClassForStudent): Promise<EnrollmentResponse> {
      const enrollment = row.registrations[0];
      if (!enrollment || enrollment.class_id !== row.id) throw new Error('Enrollment information is missing.');
      const { data } = await client.delete<EnrollmentResponse>(path(row.term_id, row.id, enrollment.id));
      success(data);
      if (!data.registration?.cancelled_at) throw new Error('Cancellation was not confirmed.');
      return withCalendarDisplay(data);
    },
    async getCancellationPolicy(): Promise<PolicyResponse> {
      return policy((await client.get<PolicyResponse>('/registration-policy')).data);
    },
    async updateCancellationPolicy(payload: CancellationPolicy): Promise<PolicyResponse> {
      return policy((await client.put<PolicyResponse>('/registration-policy', payload)).data);
    },
  };
}
