import { ApiStudent } from "./Students";
import { ApiTeacher } from "./teachers";
export interface ApiGradeClass{
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
    teacher: ApiTeacher;
}

export interface ApiGrade {
    id: number;
    student_id: number;
    class_id: number;
    grade: number;
    created_at: string;
    updated_at: string;
    student: ApiStudent;
    class: ApiGradeClass;
}
export interface ApiGrades {
    id: number;
    student_id: number;
    class_id: number;
    grade: number;
    created_at: string;
    updated_at: string;
    student: ApiStudent;
}

export interface ApiGradesResponse {
    status: boolean;
    message: string;
    data: ApiGrades[];
}

export interface ApiGradeResponse {
    status: boolean;
    message: string;
    grade: ApiGrade;
}


