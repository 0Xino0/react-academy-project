// Interface for the 'role' object nested within the API's user object
export interface ApiUserRole {
  id: number;
  name: 'manager' | 'student' | 'teacher'; // Your defined roles
  guard_name: string;
}

// Interface for the 'user' object as it comes from the API
export interface ApiUser {
  id: number;
  national_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  roles: ApiUserRole[]; // The roles are an array of objects
  created_at: string;
  updated_at: string;
}

// Interface for the entire API authentication response
export interface AuthApiResponse {
  status: string;
  access_token: string;
  token_type: string;
  user: ApiUser;
}

// Simplified User interface for use within the application (e.g., in localStorage, PrivateRoute)
export interface User {
  id: string; // Or number, adapt as needed
  email: string;
  firstName: string;
  lastName: string;
  role: 'manager' | 'student' | 'teacher'; // A single role string
}

// These interfaces remain the same as they define the data sent TO the API
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  national_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ApiTeacher {
  id: number;
  user_id: number;
  salary: number;
  degree: string;
  bio: string;
  resume: string;
  created_at: string;
  updated_at: string;
}
