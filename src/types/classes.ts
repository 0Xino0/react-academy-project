import { Course } from './Courses';
import { Term } from './Terms';
import { ApiTeacher } from './teachers';
import { Registration } from './Registrations';

export interface Class {
    id: number;
    name: string;
    course_id: number;
    term_id: number;
    teacher_id: number;
    start_date: string;
    end_date: string;
    tuition_fee: number;
    capacity: number;
    startRegistration_Date: string;
    endRegistration_Date: string;
    created_at: string;
    updated_at: string;
    course: Course;
    term: Term;
    teacher: ApiTeacher;
}

export interface ClassForStudent {
    id: number;
    name: string;
    course_id: number;
    term_id: number;
    teacher_id: number;
    start_date: string;
    end_date: string;
    tuition_fee: number;
    capacity: number;
    startRegistration_Date: string;
    endRegistration_Date: string;
    created_at: string;
    updated_at: string;
    course: Course;
    term: Term;
    teacher: ApiTeacher;
    registrations: Registration[];
}

export interface ClassesResponse {
    status: boolean;
    message: string;
    classes: Class[];
}

export interface ClassResponse {
    status: boolean;
    message: string;
    class: Class;
}

export interface ClassFormData {
    name: string;
    course_id: number;
    term_id: number;
    teacher_id: number;
    start_date: string;
    end_date: string;
    tuition_fee: number;
    capacity: number;
    startRegistration_Date: string;
    endRegistration_Date: string;
}

export interface DeleteClassResponse {
    status: boolean;
    message: string;
    error: string;
}

export interface ClassesResponseForStudent {
    status: boolean;
    message: string;
    classes: ClassForStudent[];
}


