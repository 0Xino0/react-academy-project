import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { createPaymentsApi } from '../../src/services/payments.ts';
import { moneyCents, normalizePaymentAmount } from '../../src/services/financeMoney.ts';
import { response, rejectStatus } from '../helpers.ts';
import { invoice, ledger, payment } from './fixtures.ts';

test('manager ledgers use existing protected routes and retain student, term and invoice context', async () => {
  const urls: string[] = [];
  const api = createPaymentsApi(axios.create({ adapter: config => {
    urls.push(config.url ?? '');
    return Promise.resolve(response(config, config.url === '/debts' ? ledger([invoice()])
      : { status: true, data: [payment()], recorded_total: '0.10' }));
  } }));
  assert.equal((await api.getDebts()).data[0].registration.student.user.id, 3);
  assert.equal((await api.getPayments()).data[0].debt.registration.class.term.id, 11);
  assert.deepEqual(urls, ['/debts', '/payments']);
});

test('empty manager payment records are a successful zero total', async () => {
  const api = createPaymentsApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: true, data: [], recorded_total: '0.00' })) }));
  assert.deepEqual((await api.getPayments()).data, []);
});

test('payment details use the selected record and retain Persian dates alongside raw dates', async () => {
  const api = createPaymentsApi(axios.create({ adapter: config => {
    assert.equal(config.url, '/payments/2');
    return Promise.resolve(response(config, { status: true, data: payment() }));
  } }));
  const record = (await api.getPayment(2)).data;
  assert.equal(record.debt_id, 9);
  assert.equal(record.paid_at, '2026-03-21');
  assert.equal(record.display?.paid_at, '۱۴۰۵/۰۱/۰۱');
  assert.match(record.display?.created_at ?? '', /۱۴۰۵/);
});

test('a payment record for another selection cannot populate the details dialog', async () => {
  const api = createPaymentsApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: true, data: payment(undefined, '0.10', 99) })) }));
  await assert.rejects(api.getPayment(2), /does not match/);
});

test('malformed owner, term, invoice identity and inconsistent balances are rejected', async () => {
  const good = invoice();
  for (const row of [
    { ...good, registration_id: 99 }, { ...good, remaining_amount: '0.31' }, { ...good, is_settled: true },
    { ...good, registration: { ...good.registration, student_id: 99 } },
    { ...good, registration: { ...good.registration, class: { ...good.registration.class, term_id: 99 } } },
  ]) {
    const api = createPaymentsApi(axios.create({ adapter: config => Promise.resolve(response(config, { ...ledger([good]), data: [row] })) }));
    await assert.rejects(api.getDebts(), /Invalid debt/);
  }
});

test('ledger totals must agree with displayed invoices rather than silently defaulting to zero', async () => {
  for (const original_total of ['0.00', undefined, 0.30]) {
    const api = createPaymentsApi(axios.create({ adapter: config => Promise.resolve(response(config, { ...ledger([invoice()]), original_total })) }));
    await assert.rejects(api.getDebts());
  }
});

test('totals support sums above a single invoice ceiling without float rounding', async () => {
  const first = invoice({ total_amount: '99999999.99', remaining_amount: '99999999.99' });
  const second = invoice({ ...first, id: 10, registration_id: 18, registration: { ...first.registration, id: 18, class_id: 6,
    class: { ...first.registration.class, id: 6 } } });
  const api = createPaymentsApi(axios.create({ adapter: config => Promise.resolve(response(config, ledger([first, second]))) }));
  assert.equal((await api.getDebts()).remaining_debt, '199999999.98');
  assert.equal(moneyCents('9007199254740993.99'), 900719925474099399n);
  assert.equal(normalizePaymentAmount('0001.2'), '1.20');
});

test('invalid IDs and amounts above the displayed balance cannot dispatch writes or reads', async () => {
  let calls = 0;
  const api = createPaymentsApi(axios.create({ adapter: config => { calls++; return Promise.resolve(response(config, {})); } }));
  for (const id of [0, -1, NaN, 1.5]) {
    await assert.rejects(api.getPayment(id)); await assert.rejects(api.recordPayment(invoice({ id }), '0.10'));
  }
  await assert.rejects(api.recordPayment(invoice(), '0.31'), /cannot exceed/);
  assert.equal(calls, 0);
});

test('wrong invoice, amount, state or remaining balance cannot confirm a payment write', async () => {
  const updated = invoice({ paid_amount: '0.10', remaining_amount: '0.20' });
  const good = { status: true, data: payment(updated), remaining_debt: '0.20', is_paid: false, is_settled: false };
  for (const body of [
    { ...good, data: { ...good.data, debt_id: 99 } }, { ...good, data: { ...good.data, amount: '0.20' } },
    { ...good, data: payment({ ...updated, registration_id: 18, registration: { ...updated.registration, id: 18 } }) },
    { ...good, remaining_debt: '0.10' }, { ...good, is_settled: true },
  ]) {
    const api = createPaymentsApi(axios.create({ adapter: config => Promise.resolve(response(config, body)) }));
    await assert.rejects(api.recordPayment(invoice(), '0.10'), /not confirmed/);
  }
});

test('another concurrent payment does not turn a correctly confirmed server write into a failure', async () => {
  const before = invoice({ total_amount: '10.00', remaining_amount: '10.00' });
  const after = invoice({ total_amount: '10.00', paid_amount: '1.50', remaining_amount: '8.50' });
  const api = createPaymentsApi(axios.create({ adapter: config => Promise.resolve(response(config, {
    status: true, data: payment(after, '1.00'), remaining_debt: '8.50', is_paid: false, is_settled: false,
  })) }));
  assert.equal((await api.recordPayment(before, '1.00')).remaining_debt, '8.50');
});

test('saved payment totals and invoice payment ownership are validated separately from ledger paid amounts', async () => {
  for (const body of [
    { status: true, data: [payment()], recorded_total: '0.20' },
    { status: true, data: [payment(), payment()], recorded_total: '0.20' },
  ]) {
    const api = createPaymentsApi(axios.create({ adapter: config => Promise.resolve(response(config, body)) }));
    await assert.rejects(api.getPayments());
  }
  const record = { ...payment(), debt_id: 99 };
  const api = createPaymentsApi(axios.create({ adapter: config => Promise.resolve(response(config, ledger([invoice({ payments: [record] })]))) }));
  await assert.rejects(api.getDebts(), /Invalid payment/);
});

test('failed resolved responses and authorization errors remain failures for financial reads', async () => {
  const api = createPaymentsApi(axios.create({ adapter: config => Promise.resolve(response(config, { status: false })) }));
  await assert.rejects(api.getDebts()); await assert.rejects(api.getPayments()); await assert.rejects(api.getPayment(2));
  for (const code of [403, 404]) {
    const rejected = createPaymentsApi(axios.create({ adapter: config => rejectStatus(config, code) }));
    await assert.rejects(rejected.getPayment(2), error => axios.isAxiosError(error) && error.response?.status === code);
  }
});
