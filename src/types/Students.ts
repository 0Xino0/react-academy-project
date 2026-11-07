export interface ApiStudentUser {
    id: number;
    national_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    created_at: string;
    updated_at: string;
}

export interface ApiStudent {
    id: number;
    user_id: number;
    father_name: string | null;
    father_phone: string | null;
    mother_name: string | null;
    mother_phone: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    user: ApiStudentUser;
}

export interface ApiStudentsResponse {
    status: boolean;
    message: string;
    data: ApiStudent[];
}

export interface ApiStudentResponse {
    status: boolean;
    message: string;
    data: ApiStudent;
}

export interface DeleteStudentResponse {
    status: boolean;
    message: string;
    error: string | null;
}
