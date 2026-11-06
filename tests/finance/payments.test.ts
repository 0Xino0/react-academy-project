import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createPaymentsApi } from '../../src/services/payments.ts';
import type { ApiDebt } from '../../src/types/Debts.ts';
import { response } from '../helpers.ts';

const debt = { id: 9 } as ApiDebt;

test('a payment sends an exact decimal string and displays paid_at as a Persian date', async () => {
  let call: unknown;
  const api = createPaymentsApi(axios.create({ adapter: config => {
    call = [config.url, JSON.parse(config.data as string)];
    return Promise.resolve(response(config, { status: true, data: { id: 2, debt_id: 9, amount: '0.10', paid_at: '2026-03-21' }, remaining_debt: '0.20' }));
  } }));
  const result = await api.recordPayment(debt, '0.10');
  assert.deepEqual(call, ['/debts/9/payments', { amount: '0.10' }]);
  assert.equal(result.remaining_debt, '0.20');
  assert.equal(result.data.paid_at, '2026-03-21');
  assert.equal((result.data as typeof result.data & { display: { paid_at: string } }).display.paid_at, '۱۴۰۵/۰۱/۰۱');
});

test('invalid zero, negative, scientific or overprecise amounts do not dispatch a payment', async () => {
  let calls = 0;
  const api = createPaymentsApi(axios.create({ adapter: config => { calls++; return Promise.resolve(response(config, {})); } }));
  for (const amount of ['0', '-1', '1e2', '0.001', '', '100000000']) await assert.rejects(api.recordPayment(debt, amount));
  assert.equal(calls, 0);
});

test('a resolved but failed response or missing receipt cannot confirm a payment', async () => {
  for (const body of [{ status: false }, { status: true, data: {} }]) {
    const api = createPaymentsApi(axios.create({ adapter: config => Promise.resolve(response(config, body)) }));
    await assert.rejects(api.recordPayment(debt, '1.00'), /not confirmed/);
  }
});

test('an empty ledger is valid and waiver remains distinct from payment', async () => {
  let empty = true;
  const api = createPaymentsApi(axios.create({ adapter: config => Promise.resolve(response(config, {
    status: true, data: empty ? [] : [{ id: 9, total_amount: '100.00', paid_amount: '20.00', remaining_amount: '0.00', waived_amount: '80.00', is_paid: false, is_settled: true }],
    paid_debt: empty ? '0.00' : '20.00', waived_debt: empty ? '0.00' : '80.00', remaining_debt: '0.00',
  })) }));
  assert.deepEqual((await api.getDebtsOfStudent()).data, []);
  empty = false;
  const result = await api.getDebtsOfStudent();
  assert.equal(result.data?.[0].is_paid, false);
  assert.equal(result.data?.[0].is_settled, true);
  assert.equal(result.paid_debt, '20.00');
  assert.equal(result.waived_debt, '80.00');
});
