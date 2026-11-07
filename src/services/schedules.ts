import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { ApiSchedule, ApiScheduleFormData, ApiScheduleResponse, ApiSchedulesResponse, DeleteScheduleResponse } from '../types/Schedule.ts';
import { timeForInput, withCalendarDisplay } from './calendar.ts';

function payload(form: ApiScheduleFormData): ApiScheduleFormData {
  const start = timeForInput(form.start_time);
  const end = timeForInput(form.end_time);
  if (!start || !end) throw new Error('Enter valid start and end times.');
  return {
    day_of_week: form.day_of_week.toLowerCase(),
    start_time: start.length === 5 ? `${start}:00` : start,
    end_time: end.length === 5 ? `${end}:00` : end,
  };
}

function rowPath(row: ApiSchedule): string {
  const term = row.class?.term_id;
  if (![term, row.class_id, row.id].every(value => Number.isInteger(value) && value > 0)
    || row.class.id !== row.class_id) {
    throw new Error('Schedule identifiers are missing. Reload the schedule list.');
  }
  return `/terms/${term}/classes/${row.class_id}/schedules/${row.id}`;
}

function single(data: ApiScheduleResponse): ApiScheduleResponse {
  if (!data || data.status !== true || !data.schedule?.class) throw new Error('Invalid schedule response.');
  return withCalendarDisplay(data);
}

export function scheduleErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
    const messages = Object.values(error.response?.data?.errors ?? {}).flat();
    return messages.length ? messages.join(' ') : error.response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export function createSchedulesApi(client: AxiosInstance) {
  async function list(url: string, termId: number): Promise<ApiSchedulesResponse> {
    if (!Number.isSafeInteger(termId) || termId <= 0) throw new Error('A valid term is required.');
    const { data } = await client.get<ApiSchedulesResponse>(url);
    if (!data || data.status !== true || !Array.isArray(data.schedules)
      || !data.schedules.every(row => row && Number.isSafeInteger(row.id) && row.id > 0
        && Number.isSafeInteger(row.class_id) && row.class_id > 0
        && row.class?.id === row.class_id && row.class.term_id === termId && typeof row.class.name === 'string')) {
      throw new Error('Invalid schedule list response.');
    }
    return withCalendarDisplay(data);
  }

  return {
    getSchedules: (termId: number) => list(`/terms/${termId}/schedules`, termId),
    getSchedulesForTeacher: (termId: number) => list(`/me/teaching-terms/${termId}/schedules`, termId),
    getSchedulesForStudent: (termId: number) => list(`/me/studying-terms/${termId}/schedules`, termId),
    async createSchedule(termId: number, classId: number, form: ApiScheduleFormData): Promise<ApiScheduleResponse> {
      const { data } = await client.post<ApiScheduleResponse>(`/terms/${termId}/classes/${classId}/schedules`, payload(form));
      return single(data);
    },
    async updateSchedule(row: ApiSchedule, form: ApiScheduleFormData): Promise<ApiScheduleResponse> {
      const { data } = await client.put<ApiScheduleResponse>(rowPath(row), payload(form));
      return single(data);
    },
    async deleteSchedule(row: ApiSchedule): Promise<DeleteScheduleResponse> {
      const { data } = await client.delete<DeleteScheduleResponse>(rowPath(row));
      if (!data || data.status !== true || data.schedule !== null) throw new Error('Schedule deletion was not confirmed.');
      return data;
    },
  };
}
