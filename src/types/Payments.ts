import type { CalendarPresentation } from './calendar';
import type { ApiDebtRecord } from './Debts';

export interface PaymentSummary extends CalendarPresentation {
  id: number;
  debt_id: number;
  amount: string;
  paid_at: string;
  created_at: string;
  updated_at: string;
}
export interface ApiPayment extends PaymentSummary { debt: ApiDebtRecord }
export interface PaymentsResponse { status: boolean; message: string; data: ApiPayment[]; recorded_total: string }
export interface PaymentResponse { status: boolean; message: string; data: ApiPayment }
export interface RecordedPayment extends PaymentResponse { remaining_debt: string; is_paid: boolean; is_settled: boolean }
