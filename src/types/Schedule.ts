export interface ApiScheduleClass {
    id: number;
    course_id: number;
    teacher_id: number;
    tuition_fee: string;
    capacity: number;
    start_date: string;
    end_date: string;
    name: string;
    created_at: string;
    updated_at: string;
    term_id: number;
    startRegistration_date: string;
    endRegistration_date: string;
}

export interface ApiSchedule {
    id: number;
    class_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    created_at: string;
    updated_at: string;
    class: ApiScheduleClass;
}

export interface ApiSchedulesResponse {
    status: boolean;
    message: string;
    schedules: ApiSchedule[];
}

export interface ApiScheduleResponse {
    status: boolean;
    message: string;
    schedule: ApiSchedule;
}

export interface ApiScheduleFormData {
    day_of_week: string;
    start_time: string;
    end_time: string;
}

    
