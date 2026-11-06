export type CalendarField = 'start_date' | 'end_date' | 'startRegistration_Date' | 'endRegistration_Date'
  | 'created_at' | 'updated_at' | 'deleted_at' | 'cancelled_at' | 'paid_at' | 'payment_date'
  | 'start_time' | 'end_time' | 'day_of_week';

export interface CalendarPresentation {
  display?: Partial<Record<CalendarField, string>>;
}
