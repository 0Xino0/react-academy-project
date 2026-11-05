import { createHttpClient } from './http';
import { sessionStore } from './session';
import { createCoursesApi } from './courses';
import { createSchedulesApi } from './schedules';
import { withCalendarDisplay } from './calendar';
// Import AuthApiResponse (which is now updated) and the internal User types
import { AuthApiResponse, LoginCredentials, RegisterData } from '../types/auth';
import { ApiTeachersResponse, TeacherDeleteResponse, TeacherRegistrationData, TeacherRegistrationResponse, TeacherUpdateData, TeacherUpdateResponse } from '../types/teachers';
import { DeleteTermResponse, Term, TermResponse, TermsResponse } from '../types/Terms';
import { ClassesResponse, ClassResponse, ClassFormData, DeleteClassResponse, ClassesResponseForStudent } from '../types/classes';
import { ApiStudentsResponse, DeleteStudentResponse } from '../types/Students';
import { ApiGradeResponse, ApiGradesResponse } from '../types/Grades';
import { DeleteRegistrationResponse } from '../types/Registrations';
import { ApiDebtResponse } from '../types/Debts';

const { api, auth, logout: signOut } = createHttpClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  store: sessionStore,
});

export const logout = signOut;

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
export const getTerms = async (): Promise<TermsResponse> => {
  const response = await api.get<TermsResponse>('/terms');
  return withCalendarDisplay(response.data);
};

// Create Term API functions
export const createTerm = async (data: Term): Promise<TermResponse> => {
  const response = await api.post<TermResponse>('/terms', data);
  return withCalendarDisplay(response.data);
};

// Update Term API functions
export const updateTerm = async (id: number, data: Term): Promise<TermResponse> => {
  const response = await api.put<TermResponse>(`/terms/${id}`, data);
  return withCalendarDisplay(response.data);
};

// Delete Term API functions
export const deleteTerm = async (id: number): Promise<DeleteTermResponse> => {
  const response = await api.delete<DeleteTermResponse>(`/terms/${id}`);
  return withCalendarDisplay(response.data);
};

export const { getCourses, getCourse, createCourse, updateCourse, deleteCourse } = createCoursesApi(api);

// classes list api functions(for admin)
export const getClassesByTermId = async(termId: number): Promise<ClassesResponse> => {
  const response = await api.get<ClassesResponse>(`/terms/${termId}/classes`);
  return withCalendarDisplay(response.data);
};

// Create Class API functions
export const createClass = async(data: ClassFormData): Promise<ClassResponse> => {
  const response = await api.post<ClassResponse>(`/terms/${data.term_id}/classes`, data);
  return withCalendarDisplay(response.data);
};

// Update Class API functions
export const updateClass = async(id: number, data: ClassFormData): Promise<ClassResponse> => {
  const response = await api.put<ClassResponse>(`/terms/${data.term_id}/classes/${id}`, data);
  return withCalendarDisplay(response.data);
};

// Delete Class API functions
export const deleteClass = async(class_id: number, term_id: number): Promise<DeleteClassResponse> => {
  const response = await api.delete<DeleteClassResponse>(`/terms/${term_id}/classes/${class_id}`);
  return withCalendarDisplay(response.data);
};

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

// Grades List API functions
export const getGrades = async(class_id: number): Promise<ApiGradesResponse> => {
  const response = await api.get<ApiGradesResponse>(`/classes/${class_id}/grades`);
  return withCalendarDisplay(response.data);
};

// grade of student api functions
export const getGradesOfStudent = async(class_id: number): Promise<ApiGradeResponse> => {
  const response = await api.get<ApiGradeResponse>(`/me/classes/${class_id}/grades`);
  return withCalendarDisplay(response.data);
};



export const getClassesForTeacher = async(term_id: number): Promise<ClassesResponse> => {
  const response = await api.get<ClassesResponse>(`/me/teaching-terms/${term_id}/classes`);
  return withCalendarDisplay(response.data);
};


export const getClassesForStudent = async(term_id: number): Promise<ClassesResponseForStudent> => {
  const response = await api.get<ClassesResponseForStudent>(`/me/studying-terms/${term_id}/classes`);
  return withCalendarDisplay(response.data);
};


// delete registration api functions
export const deleteRegistration = async(class_id: number, term_id: number, registration_id: number): Promise<DeleteRegistrationResponse> => {
  const response = await api.delete<DeleteRegistrationResponse>(`/terms/${term_id}/classes/${class_id}/registrations/${registration_id}`);
  return withCalendarDisplay(response.data);
};

// debts list api functions
export const getDebtsOfStudent = async(): Promise<ApiDebtResponse> => {
  const response = await api.get<ApiDebtResponse>(`/me/students/debts`);
  return withCalendarDisplay(response.data);
};




export default api;
