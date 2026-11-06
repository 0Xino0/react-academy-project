import { Course } from './Courses';
import { Term } from './Terms';
import { ApiTeacher } from './teachers';
import { Registration } from './Registrations';
import type { CalendarPresentation } from './calendar';

export interface Class extends CalendarPresentation {
    id: number;
    name: string;
    course_id: number;
    term_id: number;
    teacher_id: number;
    start_date: string;
    end_date: string;
    tuition_fee: string;
    capacity: number;
    startRegistration_Date: string;
    endRegistration_Date: string;
    created_at: string;
    updated_at: string;
    course: Course;
    term: Term;
    teacher: ApiTeacher | null;
    registrations_count: number;
}

export interface ClassForStudent extends CalendarPresentation {
    id: number;
    name: string;
    course_id: number;
    term_id: number;
    teacher_id: number;
    start_date: string;
    end_date: string;
    tuition_fee: string;
    capacity: number;
    startRegistration_Date: string;
    endRegistration_Date: string;
    created_at: string;
    updated_at: string;
    course: Course;
    term: Term;
    teacher: ApiTeacher | null;
    registrations_count: number;
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
    error: string | null;
}

export interface ClassesResponseForStudent {
    status: boolean;
    message: string;
    classes: ClassForStudent[];
}


