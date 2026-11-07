import { createHttpClient } from './http';
import { sessionStore } from './session';
import { createCoursesApi } from './courses';
import { createSchedulesApi } from './schedules';
import { createAcademicsApi } from './academics';
import { createRegistrationsApi } from './registrations';
import { createPaymentsApi } from './payments';
import { createGradesApi } from './grades';
import { createPeopleApi } from './people';
import { withCalendarDisplay } from './calendar';
import { AuthApiResponse, LoginCredentials, RegisterData } from '../types/auth';

const { api, auth, logout: signOut } = createHttpClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
  store: sessionStore,
});

export const logout = signOut;

export const { getAvailableClasses, enrollInClass, cancelRegistration, getCancellationPolicy, updateCancellationPolicy } = createRegistrationsApi(api);
export const { getDebtsOfStudent, recordPayment, getDebts, getPayments, getPayment } = createPaymentsApi(api);

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

export const { getTeachers, registerTeacher, updateTeacherSalary, deleteTeacher,
  getStudentsByClassId, getStudentById, deleteStudent } = createPeopleApi(api);

export const { getCourses, getCourse, createCourse, updateCourse, deleteCourse } = createCoursesApi(api);

export const { getGrades, getGradesOfStudent, saveGrades } = createGradesApi(api);

export default api;
