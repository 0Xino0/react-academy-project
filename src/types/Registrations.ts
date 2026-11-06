export interface Registration {
    id: number;
    student_id: number;
    class_id: number;
    created_at: string;
    updated_at: string;
    cancelled_at: string | null;
}

export interface DeleteRegistrationResponse {
    status: boolean;
    message: string;
    error: string | null;
}
