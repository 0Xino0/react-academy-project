import type { AxiosInstance } from 'axios';
import type { ApiDebt, ApiDebtResponse } from '../types/Debts.ts';
import { withCalendarDisplay } from './calendar.ts';

export interface RecordedPayment {
  status: boolean;
  data: { id: number; debt_id: number; amount: string; paid_at: string };
  remaining_debt: string;
}

export function createPaymentsApi(client: AxiosInstance) {
  return {
    async getDebtsOfStudent(): Promise<ApiDebtResponse> {
      const { data } = await client.get<ApiDebtResponse>('/me/students/debts');
      if (!data || data.status !== true || !Array.isArray(data.data)) throw new Error('Invalid debt list response.');
      return withCalendarDisplay(data);
    },
    async recordPayment(debt: ApiDebt, amount: string): Promise<RecordedPayment> {
      if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) throw new Error('Enter a positive payment amount with at most two decimals.');
      const { data } = await client.post<RecordedPayment>(`/debts/${debt.id}/payments`, { amount });
      if (!data || data.status !== true || !data.data?.id) throw new Error('Payment recording was not confirmed.');
      return withCalendarDisplay(data);
    },
  };
}
