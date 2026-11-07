import type { ApiDebt } from '../../src/types/Debts.ts';
import type { ApiPayment } from '../../src/types/Payments.ts';

const timestamp = '2026-03-21T08:00:00Z';
export function invoice(overrides: Partial<ApiDebt> = {}): ApiDebt {
  return {
    id: 9, registration_id: 8, total_amount: '0.30', paid_amount: '0.00', remaining_amount: '0.30', waived_amount: '0.00',
    is_paid: false, is_settled: false, created_at: timestamp, updated_at: timestamp, payments: [],
    registration: {
      id: 8, student_id: 7, class_id: 5, cancelled_at: null, created_at: timestamp, updated_at: timestamp,
      student: { id: 7, user_id: 3, deleted_at: null, father_name: null, mother_name: null, father_phone: null, mother_phone: null,
        created_at: timestamp, updated_at: timestamp, user: { id: 3, first_name: 'Real', last_name: 'Student', national_id: '0123456789',
          phone: '+989123456789', email: 'student@example.test', created_at: timestamp, updated_at: timestamp } },
      class: { id: 5, name: 'Real class', term_id: 11, course_id: 2, teacher_id: 4, capacity: 10, tuition_fee: '0.30',
        start_date: '2026-03-21', end_date: '2026-06-20', startRegistration_Date: '2026-02-01', endRegistration_Date: '2026-03-20',
        created_at: timestamp, updated_at: timestamp, term: { id: 11, year: 1405, season: 'spring' } },
    }, ...overrides,
  };
}
export function ledger(rows: ApiDebt[] = []) {
  const sum = (field: 'total_amount' | 'paid_amount' | 'waived_amount' | 'remaining_amount') => {
    const cents = rows.reduce((total, row) => total + BigInt(row[field].replace('.', '')), 0n);
    return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
  };
  return { status: true, message: 'Debts retrieved', data: rows, original_total: sum('total_amount'), paid_debt: sum('paid_amount'),
    waived_debt: sum('waived_amount'), remaining_debt: sum('remaining_amount') };
}
export function payment(debt = invoice(), amount = '0.10', id = 2): ApiPayment {
  return { id, debt_id: debt.id, amount, paid_at: '2026-03-21', created_at: timestamp, updated_at: timestamp, debt: { ...debt } };
}
