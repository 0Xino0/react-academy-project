import { ApiStudent } from "./Students";
import type { CalendarPresentation } from './calendar';
import type { Term } from './Terms';
import type { PaymentSummary } from './Payments';

export interface ApiRegistrationClassDebt extends CalendarPresentation {
    id: number;
    name: string;
    teacher_id: number;
    term_id: number;
    course_id: number;
    created_at: string;
    updated_at: string;
    start_date: string;
    end_date: string;
    tuition_fee: string;
    capacity: number;
    term: Pick<Term, 'id' | 'year' | 'season'>;
    startRegistration_Date: string;
    endRegistration_Date: string;
    
}

export interface ApiRegistrationDebt extends CalendarPresentation {
    id: number;
    student_id: number;
    class_id: number;
    created_at: string;
    updated_at: string;
    student: ApiStudent;
    cancelled_at: string | null;
    class: ApiRegistrationClassDebt;
}

export interface ApiDebtRecord extends CalendarPresentation {
    id: number;
    registration_id: number;
    total_amount: string;
    paid_amount: string;
    remaining_amount: string;
    waived_amount: string;
    is_paid: boolean;
    is_settled: boolean;
    created_at: string;
    updated_at: string;
    registration: ApiRegistrationDebt;
    
}

export interface ApiDebt extends ApiDebtRecord { payments: PaymentSummary[] }

export interface ApiDebtResponse {
    status: boolean;
    message: string;
    data: ApiDebt[];
    original_total: string;
    remaining_debt: string;
    paid_debt: string;
    waived_debt: string;
}
