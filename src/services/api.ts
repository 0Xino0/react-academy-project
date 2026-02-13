import axios from 'axios';
// Import AuthApiResponse (which is now updated) and the internal User types
import { AuthApiResponse, LoginCredentials, RegisterData } from '../types/auth';
import { ApiTeachersResponse, TeacherDeleteResponse, TeacherRegistrationData, TeacherRegistrationResponse, TeacherUpdateData, TeacherUpdateResponse } from '../types/teachers';
import { DeleteTermResponse, Term, TermResponse, TermsResponse } from '../types/Terms';
import { CourseResponse, DeleteCourseResponse } from '../types/Courses';
import { CoursesResponse } from '../types/Courses';
import { Course } from '../types/Courses';
import { ClassesResponse, ClassResponse, ClassFormData, DeleteClassResponse, ClassesResponseForStudent } from '../types/classes';
import { ApiStudentsResponse, DeleteStudentResponse } from '../types/Students';
import { ApiScheduleFormData, ApiScheduleResponse, ApiSchedulesResponse } from '../types/Schedule';
import { ApiGradeResponse, ApiGradesResponse } from '../types/Grades';
import { DeleteRegistrationResponse } from '../types/Registrations';
import { ApiDebtResponse } from '../types/Debts';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // This token will be the 'access_token'
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the response status is 401 (Unauthorized) and it's not a retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the token using the refresh endpoint
        const { data: refreshData } = await api.post<AuthApiResponse>('/auth/refresh');
        const { access_token, user } = refreshData;

        // Save the new token to localStorage
        localStorage.setItem('token', access_token);

        // Store the updated user info (including role)
        const simplifiedUser = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          // If using Spatie and @roles is an array:
          role: user.roles[0].name as 'manager' | 'student' | 'teacher',
        };
        localStorage.setItem('user', JSON.stringify(simplifiedUser));

        // Update the Authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        // Retry the original request with the new token
        return api(originalRequest);
      } catch (_err) {
        // If refresh fails, clear session and redirect to login page
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(_err);
      }
    }

    // If not 401 or retry already attempted, just reject the error
    return Promise.reject(error);
  }
);


// Login function returns the API response structure
export const login = async (credentials: LoginCredentials): Promise<AuthApiResponse> => {
  const response = await api.post<AuthApiResponse>('/auth/login', credentials);
  return response.data;
};

// Register function returns the API response structure
export const register = async (data: RegisterData): Promise<AuthApiResponse> => {
  const response = await api.post<AuthApiResponse>('/auth/register', data);
  return response.data;
};

// Teachers List API functions
export const getTeachers = async (): Promise<ApiTeachersResponse> => {
  const response = await api.get<ApiTeachersResponse>('/teachers');
  return response.data;
};

// Teacher Registration API functions
export const registerTeacher = async (data: TeacherRegistrationData): Promise<TeacherRegistrationResponse> => {
  const response = await api.post<TeacherRegistrationResponse>('/users', data);
  return response.data;
};

// Teacher Update API functions
export const updateTeacherSalary = async (id: number, data: TeacherUpdateData): Promise<TeacherUpdateResponse> => {
  const response = await api.put<TeacherUpdateResponse>(`teachers/${id}/admin-info`, data);
  return response.data;
};

// Teacher Delete API functions
export const deleteTeacher = async (id: number): Promise<TeacherDeleteResponse> => {
  const response = await api.delete<TeacherDeleteResponse>(`teachers/${id}`);
  return response.data;
};

// Terms List API functions
export const getTerms = async (): Promise<TermsResponse> => {
  const response = await api.get<TermsResponse>('/terms');
  return response.data;
};

// Create Term API functions
export const createTerm = async (data: Term): Promise<TermResponse> => {
  const response = await api.post<TermResponse>('/terms', data);
  return response.data;
};

// Update Term API functions
export const updateTerm = async (id: number, data: Term): Promise<TermResponse> => {
  const response = await api.put<TermResponse>(`/terms/${id}`, data);
  return response.data;
};

// Delete Term API functions
export const deleteTerm = async (id: number): Promise<DeleteTermResponse> => {
  const response = await api.delete<DeleteTermResponse>(`/terms/${id}`);
  return response.data;
};

// Courses List API functions
export const getCourses = async(): Promise<CoursesResponse> => {
  const response = await api.get<CoursesResponse>(`/courses`);
  return response.data;
};
// Course API functions
export const getCourse = async(id: number): Promise<CourseResponse> => {
  const response = await api.get<CourseResponse>(`/courses/${id}`);
  return response.data;
};
// Create Course API functions
export const createCourse = async(data: Course): Promise<CourseResponse> => {
  const response = await api.post<CourseResponse>(`/courses`, data);
  return response.data;
};
// Update Course API functions
export const updateCourse = async(id: number, data: Course): Promise<CourseResponse> => {
  const response = await api.put<CourseResponse>(`/courses/${id}`, data);
  return response.data;
};
// Delete Course API functions
export const deleteCourse = async(id: number): Promise<DeleteCourseResponse> => {
  const response = await api.delete<DeleteCourseResponse>(`/courses/${id}`);
  return response.data;
};

// classes list api functions(for admin)
export const getClassesByTermId = async(termId: number): Promise<ClassesResponse> => {
  const response = await api.get<ClassesResponse>(`/terms/${termId}/classes`);
  return response.data;
};

// Create Class API functions
export const createClass = async(data: ClassFormData): Promise<ClassResponse> => {
  const response = await api.post<ClassResponse>(`/terms/${data.term_id}/classes`, data);
  return response.data;
};

// Update Class API functions
export const updateClass = async(id: number, data: ClassFormData): Promise<ClassResponse> => {
  const response = await api.put<ClassResponse>(`/terms/${data.term_id}/classes/${id}`, data);
  return response.data;
};

// Delete Class API functions
export const deleteClass = async(class_id: number, term_id: number): Promise<DeleteClassResponse> => {
  const response = await api.delete<DeleteClassResponse>(`/terms/${term_id}/classes/${class_id}`);
  return response.data;
};

// students list per class api functions
export const getStudentsByClassId = async(class_id: number): Promise<ApiStudentsResponse> => {
  const response = await api.get<ApiStudentsResponse>(`/classes/${class_id}/students`);
  return response.data;
};

export const getStudentById = async(student_id: number): Promise<ApiStudentsResponse> => {
  const response = await api.get<ApiStudentsResponse>(`/students/${student_id}`);
  return response.data;
};

export const deleteStudent = async(student_id: number): Promise<DeleteStudentResponse> => {
  const response = await api.delete<DeleteStudentResponse>(`/students/${student_id}`);
  return response.data;
};

// schedule list api functions
export const getSchedules = async(term_id: number): Promise<ApiSchedulesResponse> => {
  const response = await api.get<ApiSchedulesResponse>(`/terms/${term_id}/schedules`);
  return response.data;
};

// Create Schedule API functions
export const createSchedule = async(term_id: number, class_id: number, data: ApiScheduleFormData): Promise<ApiScheduleResponse> => {
  const response = await api.post<ApiScheduleResponse>(`/terms/${term_id}/classes/${class_id}/schedules`, data);
  return response.data;
};

// Update Schedule API functions
export const updateSchedule = async(term_id: number, class_id: number, schedule_id: number, data: ApiScheduleFormData): Promise<ApiScheduleResponse> => {
  const response = await api.put<ApiScheduleResponse>(`/terms/${term_id}/classes/${class_id}/schedules/${schedule_id}`, data);
  return response.data;
};

// Delete Schedule API functions
export const deleteSchedule = async(term_id: number, class_id: number, schedule_id: number): Promise<ApiScheduleResponse> => {
  const response = await api.delete<ApiScheduleResponse>(`/terms/${term_id}/classes/${class_id}/schedules/${schedule_id}`);
  return response.data;
};

// Grades List API functions
export const getGrades = async(class_id: number): Promise<ApiGradesResponse> => {
  const response = await api.get<ApiGradesResponse>(`/classes/${class_id}/grades`);
  return response.data;
};

// grade of student api functions
export const getGradesOfStudent = async(class_id: number): Promise<ApiGradeResponse> => {
  const response = await api.get<ApiGradeResponse>(`/me/classes/${class_id}/grades`);
  return response.data;
};



export const getClassesForTeacher = async(term_id: number): Promise<ClassesResponse> => {
  const response = await api.get<ClassesResponse>(`/me/teaching-terms/${term_id}/classes`);
  return response.data;
};

export const getSchedulesForTeacher = async(term_id: number): Promise<ApiSchedulesResponse> => {
  const response = await api.get<ApiSchedulesResponse>(`/me/teaching-terms/${term_id}/schedules`);
  return response.data;
};

export const getClassesForStudent = async(term_id: number): Promise<ClassesResponseForStudent> => {
  const response = await api.get<ClassesResponseForStudent>(`/me/studying-terms/${term_id}/classes`);
  return response.data;
};

export const getSchedulesForStudent = async(term_id: number): Promise<ApiSchedulesResponse> => {
  const response = await api.get<ApiSchedulesResponse>(`/me/studying-terms/${term_id}/schedules`);
  return response.data;
};

// delete registration api functions
export const deleteRegistration = async(class_id: number, term_id: number, registration_id: number): Promise<DeleteRegistrationResponse> => {
  const response = await api.delete<DeleteRegistrationResponse>(`/terms/${term_id}/classes/${class_id}/registrations/${registration_id}`);
  return response.data;
};

// debts list api functions
export const getDebtsOfStudent = async(): Promise<ApiDebtResponse> => {
  const response = await api.get<ApiDebtResponse>(`/me/students/debts`);
  return response.data;
};




export default api;