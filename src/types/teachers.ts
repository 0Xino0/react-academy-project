import type { ApiUser } from './auth';

export interface ApiTeacherUser {
    id: number;
    national_id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    created_at: string;
    updated_at: string;
}

export interface ApiTeacher {
    id: number;
    user_id: number;
    salary: string | null;
    resume: string | null;
    deleted_at: string | null; 
    created_at: string;
    updated_at: string;
    bio: string | null;
    degree: string | null;
    user: ApiTeacherUser; 
}

export interface ApiTeachersResponse {
    status: boolean; 
    message: string;
    data: ApiTeacher[]; 
}

export interface TeacherRegistrationData {
  national_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface TeacherRegistrationResponse {
    status: boolean;
    message: string;
    data: ApiUser;
    role: ApiUser['roles'][number]['name'][];
    teacher: Omit<ApiTeacher, 'user'>;
}

export interface TeacherUpdateData {
    salary: string;
}

export interface TeacherUpdateResponse {
    status: boolean;
    message: string;
    data: ApiTeacher;
}

export interface TeacherDeleteResponse {
    status: boolean;
    message: string;
}


