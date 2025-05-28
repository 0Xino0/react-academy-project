export interface Course{
    id: number;
    title: string;
    level: string;
    description: string;
    updated_at: string;
    created_at: string;
    
}

export interface CourseFormData{
    title: string;
    level: string;
    description: string;
}

export interface CourseResponse{
    status: boolean;
    message: string;
    data: Course;
}

export interface CoursesResponse{
    status: boolean;
    message: string;
    data: Course[];
}

export interface DeleteCourseResponse{
    status: boolean;
    message: string;
}

