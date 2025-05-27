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
    salary: number;
    resume: string;
    deleted_at: string | null; 
    created_at: string;
    updated_at: string;
    bio: string;
    degree: string; 
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
    data: ApiTeacher;
}

export interface TeacherUpdateData {
    salary: number;
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


