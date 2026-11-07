import type { ApiStudent } from './Students';
import type { Class } from './classes';
import type { CalendarPresentation } from './calendar';

export interface GradeRecord extends CalendarPresentation {
  id: number;
  student_id: number;
  class_id: number;
  grade: number;
  created_at: string;
  updated_at: string;
  student: ApiStudent;
}

export interface ApiGrade extends GradeRecord { class: Class }
export interface ApiGradesResponse {
  status: boolean;
  message: string;
  class: Class;
  students: ApiStudent[];
  grades: GradeRecord[];
}
export interface ApiGradeResponse {
  status: boolean;
  message: string;
  grade: ApiGrade | null;
}
export interface GradeEntry { student_id: number; grade: number }
export interface SaveGradesResponse { status: boolean; message: string; grades: GradeRecord[] }
