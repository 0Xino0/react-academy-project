import type { AxiosInstance } from 'axios';
import type { ApiDebtRecord, ApiDebtResponse } from '../types/Debts.ts';
import type { ApiPayment, PaymentSummary, PaymentResponse, PaymentsResponse, RecordedPayment } from '../types/Payments.ts';
import { moneyCents, normalizePaymentAmount } from './financeMoney.ts';
import { persianDate, withCalendarDisplay } from './calendar.ts';

const positiveId = (value: number) => Number.isInteger(value) && value > 0;
function id(value: number): number {
  if (!positiveId(value)) throw new Error('A valid invoice or payment record is required.');
  return value;
}
function success(value: { status: boolean }) {
  if (!value || value.status !== true) throw new Error('The financial request was not successful.');
}
function payment(row: PaymentSummary, debtId: number): void {
  if (!row || !positiveId(row.id) || row.debt_id !== debtId || moneyCents(row.amount) <= 0n
    || persianDate(row.paid_at) === '—') throw new Error('Invalid payment record response.');
}
function debt(row: ApiDebtRecord): void {
  if (!row || !positiveId(row.id) || !positiveId(row.registration_id)) throw new Error('Invalid debt response.');
  const total = moneyCents(row.total_amount), paid = moneyCents(row.paid_amount), waived = moneyCents(row.waived_amount), remaining = moneyCents(row.remaining_amount);
  const registration = row.registration;
  if (total > 9999999999n || total !== paid + waived + remaining || row.is_paid !== (total === paid) || row.is_settled !== (remaining === 0n)
    || !registration || registration.id !== row.registration_id || !positiveId(registration.student_id) || !positiveId(registration.class_id)
    || registration.student?.id !== registration.student_id || !positiveId(registration.student.user_id)
    || registration.student.user?.id !== registration.student.user_id || typeof registration.student.user.first_name !== 'string'
    || typeof registration.student.user.last_name !== 'string' || registration.class?.id !== registration.class_id
    || typeof registration.class.name !== 'string' || !positiveId(registration.class.term_id) || registration.class.term?.id !== registration.class.term_id
    || typeof registration.class.term.year !== 'number' || typeof registration.class.term.season !== 'string'
    || !(registration.cancelled_at === null || typeof registration.cancelled_at === 'string')) throw new Error('Invalid debt response.');
}
function ledger(data: ApiDebtResponse): ApiDebtResponse {
  success(data);
  if (!Array.isArray(data.data)) throw new Error('Invalid debt list response.');
  const sums = { original_total: 0n, paid_debt: 0n, waived_debt: 0n, remaining_debt: 0n };
  for (const row of data.data) {
    debt(row);
    if (!Array.isArray(row.payments) || new Set(row.payments.map(item => item?.id)).size !== row.payments.length) throw new Error('Invalid invoice payment records.');
    row.payments.forEach(item => payment(item, row.id));
    sums.original_total += moneyCents(row.total_amount); sums.paid_debt += moneyCents(row.paid_amount);
    sums.waived_debt += moneyCents(row.waived_amount); sums.remaining_debt += moneyCents(row.remaining_amount);
  }
  if (new Set(data.data.map(row => row.id)).size !== data.data.length
    || Object.entries(sums).some(([key, sum]) => moneyCents(data[key as keyof typeof sums]) !== sum)) throw new Error('The ledger totals do not match its invoices.');
  return withCalendarDisplay(data);
}
function detailedPayment(row: ApiPayment): void {
  if (!row?.debt) throw new Error('Invalid payment context.');
  debt(row.debt); payment(row, row.debt.id);
}

export function createPaymentsApi(client: AxiosInstance) {
  return {
    async getDebtsOfStudent(): Promise<ApiDebtResponse> {
      return ledger((await client.get<ApiDebtResponse>('/me/students/debts')).data);
    },
    async getDebts(): Promise<ApiDebtResponse> {
      return ledger((await client.get<ApiDebtResponse>('/debts')).data);
    },
    async getPayments(): Promise<PaymentsResponse> {
      const { data } = await client.get<PaymentsResponse>('/payments');
      success(data);
      if (!Array.isArray(data.data)) throw new Error('Invalid payment list response.');
      data.data.forEach(detailedPayment);
      if (new Set(data.data.map(row => row.id)).size !== data.data.length
        || data.data.reduce((sum, row) => sum + moneyCents(row.amount), 0n) !== moneyCents(data.recorded_total)) throw new Error('Invalid recorded payment total.');
      return withCalendarDisplay(data);
    },
    async getPayment(paymentId: number): Promise<PaymentResponse> {
      const { data } = await client.get<PaymentResponse>(`/payments/${id(paymentId)}`);
      success(data); detailedPayment(data.data);
      if (data.data.id !== paymentId) throw new Error('The payment record does not match the selection.');
      return withCalendarDisplay(data);
    },
    async recordPayment(invoice: ApiDebtRecord, input: string): Promise<RecordedPayment> {
      id(invoice.id);
      const amount = normalizePaymentAmount(input);
      if (moneyCents(amount) > moneyCents(invoice.remaining_amount)) throw new Error('Payment cannot exceed the displayed remaining debt. Reload the ledger if it has changed.');
      const { data } = await client.post<RecordedPayment>(`/debts/${invoice.id}/payments`, { amount });
      try {
        success(data); detailedPayment(data.data);
        if (data.data.debt_id !== invoice.id || data.data.debt.registration_id !== invoice.registration_id
          || data.data.debt.registration.student_id !== invoice.registration.student_id
          || data.data.amount !== amount || data.remaining_debt !== data.data.debt.remaining_amount
          || data.is_paid !== data.data.debt.is_paid || data.is_settled !== data.data.debt.is_settled) throw new Error('Invalid payment confirmation.');
      } catch {
        throw new Error('Payment recording was not confirmed. Reload the ledger and check its records before trying again.');
      }
      return withCalendarDisplay(data);
    },
  };
}
