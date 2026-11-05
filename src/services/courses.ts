import type { AxiosInstance } from 'axios';
import { withCalendarDisplay } from './calendar.ts';
import type { Course, CourseFormData, CourseResponse, CoursesResponse, DeleteCourseResponse } from '../types/Courses.ts';

function isCourse(value: unknown): value is Course {
  if (typeof value !== 'object' || value === null) return false;
  const course = value as Record<string, unknown>;
  return Number.isInteger(course.id) && Number(course.id) > 0
    && typeof course.title === 'string' && typeof course.level === 'string'
    && (typeof course.description === 'string' || course.description === null)
    && typeof course.created_at === 'string' && typeof course.updated_at === 'string';
}

function requireSuccess(value: unknown): void {
  if (typeof value !== 'object' || value === null || !('status' in value) || value.status !== true) {
    throw new Error('The course request was not successful.');
  }
}

function requireCourseResponse(value: CourseResponse): CourseResponse {
  requireSuccess(value);
  if (!isCourse(value.data)) throw new Error('Invalid course response.');
  return withCalendarDisplay(value);
}

export function createCoursesApi(client: AxiosInstance) {
  return {
    async getCourses(): Promise<CoursesResponse> {
      const { data } = await client.get<CoursesResponse>('/courses');
      requireSuccess(data);
      if (!Array.isArray(data.data) || !data.data.every(isCourse)) throw new Error('Invalid course list response.');
      return withCalendarDisplay(data);
    },
    async getCourse(id: number): Promise<CourseResponse> {
      const { data } = await client.get<CourseResponse>(`/courses/${id}`);
      return requireCourseResponse(data);
    },
    async createCourse(payload: CourseFormData): Promise<CourseResponse> {
      const { data } = await client.post<CourseResponse>('/courses', payload);
      return requireCourseResponse(data);
    },
    async updateCourse(id: number, payload: CourseFormData): Promise<CourseResponse> {
      const { data } = await client.put<CourseResponse>(`/courses/${id}`, payload);
      return requireCourseResponse(data);
    },
    async deleteCourse(id: number): Promise<DeleteCourseResponse> {
      const { data } = await client.delete<DeleteCourseResponse>(`/courses/${id}`);
      requireSuccess(data);
      return data;
    },
  };
}
