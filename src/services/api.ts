import axios from 'axios';
// Import AuthApiResponse (which is now updated) and the internal User types
import { AuthApiResponse, LoginCredentials, RegisterData } from '../types/auth';
import { ApiTeachersResponse, TeacherDeleteResponse, TeacherRegistrationData, TeacherRegistrationResponse, TeacherUpdateData, TeacherUpdateResponse } from '../types/teachers';
import { DeleteTermResponse, Term, TermResponse, TermsResponse } from '../types/Terms';

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

    // Only attempt to refresh token if it's a 401 error and we haven't tried before
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResponse = await api.post<AuthApiResponse>('/auth/refresh');
        const { access_token } = refreshResponse.data;
        localStorage.setItem('token', access_token);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (error) {
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect to login if we're not already on the login page
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    
    // For all other errors, just reject the promise
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





export default api;