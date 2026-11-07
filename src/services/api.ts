import { createHttpClient } from './http';
import { sessionStore } from './session';
import { createCoursesApi } from './courses';
import { createSchedulesApi } from './schedules';
import { createAcademicsApi } from './academics';
import { createRegistrationsApi } from './registrations';
import { createPaymentsApi } from './payments';
import { createGradesApi } from './grades';
import { withCalendarDisplay } from './calendar';
// Import AuthApiResponse (which is now updated) and the internal User types
import { AuthApiResponse, LoginCredentials, RegisterData } from '../types/auth';
import { ApiTeachersResponse, TeacherDeleteResponse, TeacherRegistrationData, TeacherRegistrationResponse, TeacherUpdateData, TeacherUpdateResponse } from '../types/teachers';

import { ApiStudentsResponse, DeleteStudentResponse } from '../types/Students';


const { api, auth, logout: signOut } = createHttpClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  store: sessionStore,
});

export const logout = signOut;

export const { getAvailableClasses, enrollInClass, cancelRegistration, getCancellationPolicy, updateCancellationPolicy } = createRegistrationsApi(api);
export const { getDebtsOfStudent, recordPayment } = createPaymentsApi(api);

export const {
  getTerms, createTerm, updateTerm, deleteTerm,
  getClassesByTermId, createClass, updateClass, deleteClass,
  getClassesForTeacher, getClassesForStudent,
} = createAcademicsApi(api);

export const {
  getSchedules, getSchedulesForTeacher, getSchedulesForStudent,
  createSchedule, updateSchedule, deleteSchedule,
} = createSchedulesApi(api);

// Login function returns the API response structure
export const login = async (credentials: LoginCredentials): Promise<AuthApiResponse> => {
  const response = await auth.post<AuthApiResponse>('/auth/login', credentials);
  return withCalendarDisplay(response.data);
};

// Register function returns the API response structure
export const register = async (data: RegisterData): Promise<AuthApiResponse> => {
  const response = await auth.post<AuthApiResponse>('/auth/register', data);
  return withCalendarDisplay(response.data);
};

// Teachers List API functions
export const getTeachers = async (): Promise<ApiTeachersResponse> => {
  const response = await api.get<ApiTeachersResponse>('/teachers');
  return withCalendarDisplay(response.data);
};

// Teacher Registration API functions
export const registerTeacher = async (data: TeacherRegistrationData): Promise<TeacherRegistrationResponse> => {
  const response = await api.post<TeacherRegistrationResponse>('/users', data);
  return withCalendarDisplay(response.data);
};

// Teacher Update API functions
export const updateTeacherSalary = async (id: number, data: TeacherUpdateData): Promise<TeacherUpdateResponse> => {
  const response = await api.put<TeacherUpdateResponse>(`teachers/${id}/admin-info`, data);
  return withCalendarDisplay(response.data);
};

// Teacher Delete API functions
export const deleteTeacher = async (id: number): Promise<TeacherDeleteResponse> => {
  const response = await api.delete<TeacherDeleteResponse>(`teachers/${id}`);
  return withCalendarDisplay(response.data);
};

// Terms List API functions

// Create Term API functions

// Update Term API functions

// Delete Term API functions

export const { getCourses, getCourse, createCourse, updateCourse, deleteCourse } = createCoursesApi(api);

// classes list api functions(for admin)

// Create Class API functions

// Update Class API functions

// Delete Class API functions

// students list per class api functions
export const getStudentsByClassId = async(class_id: number): Promise<ApiStudentsResponse> => {
  const response = await api.get<ApiStudentsResponse>(`/classes/${class_id}/students`);
  return withCalendarDisplay(response.data);
};

export const getStudentById = async(student_id: number): Promise<ApiStudentsResponse> => {
  const response = await api.get<ApiStudentsResponse>(`/students/${student_id}`);
  return withCalendarDisplay(response.data);
};

export const deleteStudent = async(student_id: number): Promise<DeleteStudentResponse> => {
  const response = await api.delete<DeleteStudentResponse>(`/students/${student_id}`);
  return withCalendarDisplay(response.data);
};

// schedule list api functions

// Create Schedule API functions

// Update Schedule API functions

// Delete Schedule API functions

export const { getGrades, getGradesOfStudent, saveGrades } = createGradesApi(api);

export default api;
