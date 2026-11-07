import type { AxiosInstance } from 'axios';
import { withCalendarDisplay } from './calendar.ts';
import type { Course, CourseFormData, CourseResponse, CoursesResponse, DeleteCourseResponse } from '../types/Courses.ts';

function isCourse(value: unknown): value is Course {
  if (typeof value !== 'object' || value === null) return false;
  const course = value as Record<string, unknown>;
  return Number.isSafeInteger(course.id) && Number(course.id) > 0
    && typeof course.title === 'string' && typeof course.level === 'string'
    && (typeof course.description === 'string' || course.description === null)
    && typeof course.created_at === 'string' && typeof course.updated_at === 'string';
}

function requireSuccess(value: unknown): void {
  if (typeof value !== 'object' || value === null || !('status' in value) || value.status !== true) {
    throw new Error('The course request was not successful.');
  }
}

function requireCourseResponse(value: CourseResponse, expectedId?: number): CourseResponse {
  requireSuccess(value);
  if (!isCourse(value.data)) throw new Error('Invalid course response.');
  if (expectedId !== undefined && value.data.id !== expectedId) throw new Error('The course response does not match the selected course.');
  return withCalendarDisplay(value);
}

function courseId(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('A valid course is required.');
  return value;
}

function coursePayload(form: CourseFormData): CourseFormData {
  const title = form.title.trim();
  if (!title || [...title].length > 255) throw new Error('Course name must contain between 1 and 255 characters.');
  if (!['Beginner', 'Intermediate', 'Advanced'].includes(form.level)) throw new Error('Select a valid course level.');
  return { title, level: form.level, description: form.description };
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
      const { data } = await client.get<CourseResponse>(`/courses/${courseId(id)}`);
      return requireCourseResponse(data, id);
    },
    async createCourse(payload: CourseFormData): Promise<CourseResponse> {
      const { data } = await client.post<CourseResponse>('/courses', coursePayload(payload));
      return requireCourseResponse(data);
    },
    async updateCourse(id: number, payload: CourseFormData): Promise<CourseResponse> {
      const { data } = await client.put<CourseResponse>(`/courses/${courseId(id)}`, coursePayload(payload));
      return requireCourseResponse(data, id);
    },
    async deleteCourse(id: number): Promise<DeleteCourseResponse> {
      const { data } = await client.delete<DeleteCourseResponse>(`/courses/${courseId(id)}`);
      requireSuccess(data);
      return data;
    },
  };
}
