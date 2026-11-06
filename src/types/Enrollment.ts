import type { CalendarPresentation } from './calendar';
import type { Registration } from './Registrations';

export interface AvailableClass extends CalendarPresentation {
  id: number;
  term_id: number;
  class_name: string;
  course_name: string;
  teacher_name: string;
  term_year: number;
  term_season: string;
  tuition_fee: string;
  capacity: number;
  available_capacity: number;
  registered_students_count: number;
  start_date: string;
  end_date: string;
  can_register: boolean;
  is_registered: boolean;
  registration_block_reason: string | null;
  schedules: Array<CalendarPresentation & { id: number; day_of_week: string; start_time: string; end_time: string }>;
}

export interface AvailableClassesResponse {
  status: boolean;
  data: AvailableClass[];
  registration_block_code: string | null;
  registration_block_reason: string | null;
}

export interface CancellationPolicy { cancellation_requires_settlement: boolean }
export interface PolicyResponse { status: boolean; policy: CancellationPolicy }
export interface EnrollmentResponse { status: boolean; message: string; registration: Registration }
