import { ApiStudent } from "./Students";

export interface ApiRegistrationClassDebt{
    id: number;
    name: string;
    teacher_id: number;
    term_id: number;
    course_id: number;
    created_at: string;
    updated_at: string;
    start_date: string;
    end_date: string;
    tuition_fee: number;
    capacity: number;
    startRegistration_date: string;
    endRegistration_date: string;
    
}

export interface ApiRegistrationDebt{
    id: number;
    student_id: number;
    class_id: number;
    created_at: string;
    updated_at: string;
    student: ApiStudent;
    class: ApiRegistrationClassDebt;
}

export interface ApiDebt{
    id: number;
    registration_id: number;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    created_at: string;
    updated_at: string;
    registration: ApiRegistrationDebt;
    
}

export interface ApiDebtResponse{
    status: boolean;
    message: string;
    data?: ApiDebt[];
    remaining_debt?: number;
    paid_debt?: number;
    error?: string;
}

