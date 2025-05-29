import { ApiStudent } from "./Students";

export interface ApiGrade {
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
    data: ApiGrade[];
}

// export interface ApiGradeFormData {
//     class_id: number;
//     grade: number;
// }
