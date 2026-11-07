import { useCallback, useEffect, useRef, useState } from 'react';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import PaymentEntryDialog from '../../components/PaymentEntryDialog';
import PaymentDetailsDialog from '../../components/PaymentDetailsDialog';
import { getDebts, getPayments } from '../../services/api';
import { enrollmentError } from '../../services/registrations';
import type { ApiDebt, ApiDebtResponse } from '../../types/Debts';
import type { PaymentsResponse } from '../../types/Payments';
import { useSession } from '../../hooks/useSession';

export default function Financial() {
  const userId = useSession()?.user.id;
  const request = useRef(0);
  const [ledger, setLedger] = useState<ApiDebtResponse | null>(null);
  const [payments, setPayments] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'invoices' | 'payments'>('invoices');
  const [selected, setSelected] = useState<ApiDebt | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true); setError(null); setLedger(null); setPayments(null);
    try {
      const [invoices, records] = await Promise.all([getDebts(), getPayments()]);
      if (current !== request.current) return;
      setLedger(invoices); setPayments(records);
    } catch (error) { if (current === request.current) setError(enrollmentError(error, 'Could not load academy financial records.')); }
    finally { if (current === request.current) setLoading(false); }
  }, []);
  useEffect(() => {
    setSelected(null); setPaymentId(null); setTab('invoices'); load();
    return () => { request.current += 1; };
  }, [userId, load]);
  return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex"><AdminSidebar />
    <main className="flex-1 p-8 min-w-0"><h1 className="text-2xl mb-4">Financial affairs</h1>
      <p className="mb-4 text-gray-600">Review academy invoices and record amounts already paid. Waivers are shown separately from payments.</p>
      <button disabled={loading || selected !== null} onClick={load} className="mb-4 underline disabled:opacity-50">Reload financial records</button>
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      {loading ? <p>Loading financial records...</p> : ledger && payments && <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">{[
          ['Original tuition', ledger.original_total], ['Paid', ledger.paid_debt], ['Waived', ledger.waived_debt], ['Remaining', ledger.remaining_debt],
        ].map(([label, amount]) => <div key={label} className="rounded bg-white p-4"><p className="text-gray-600">{label}</p><p className="text-xl">{amount}</p></div>)}</div>
        <p className="mb-6">Total in saved payment records: {payments.recorded_total}</p>
        <div className="flex gap-4 mb-4"><button className={tab === 'invoices' ? 'font-bold underline' : 'underline'} onClick={() => setTab('invoices')}>Invoices ({ledger.data.length})</button>
          <button className={tab === 'payments' ? 'font-bold underline' : 'underline'} onClick={() => setTab('payments')}>Payment records ({payments.data.length})</button></div>
        {tab === 'invoices' ? !ledger.data.length ? <p>No invoices have been created.</p> : <div className="overflow-x-auto"><table className="min-w-full bg-white text-left text-sm">
          <thead><tr>{['Invoice / student', 'Class / term', 'Enrollment', 'Original', 'Paid', 'Waived', 'Remaining', 'Actions'].map(label => <th key={label} className="p-3 border-b">{label}</th>)}</tr></thead>
          <tbody>{ledger.data.map(invoice => <tr key={invoice.id}>
            <td className="p-3 border-b">#{invoice.id} · {invoice.registration.student.user.first_name} {invoice.registration.student.user.last_name}
              {invoice.registration.student.deleted_at && <p className="text-gray-600">Profile deactivated</p>}</td>
            <td className="p-3 border-b">{invoice.registration.class.name}<br />{invoice.registration.class.term.season} {invoice.registration.class.term.year}</td>
            <td className="p-3 border-b">{invoice.registration.cancelled_at ? 'Cancelled' : 'Active'}</td>
            <td className="p-3 border-b">{invoice.total_amount}</td><td className="p-3 border-b">{invoice.paid_amount}</td>
            <td className="p-3 border-b">{invoice.waived_amount}</td><td className="p-3 border-b">{invoice.remaining_amount}</td>
            <td className="p-3 border-b"><button disabled={invoice.is_settled} onClick={() => setSelected(invoice)}
              className="rounded bg-indigo-600 px-3 py-2 text-white disabled:bg-gray-400">{invoice.is_settled ? 'Settled' : 'Record payment'}</button>
              {invoice.payments.map(record => <button key={record.id} className="block mt-2 underline text-indigo-700" onClick={() => setPaymentId(record.id)}>Payment record #{record.id}</button>)}</td>
          </tr>)}</tbody></table></div> : !payments.data.length ? <p>No payments have been recorded.</p> : <div className="overflow-x-auto"><table className="min-w-full bg-white text-left text-sm">
            <thead><tr>{['Record', 'Student', 'Class / invoice', 'Amount', 'Payment date', 'Action'].map(label => <th key={label} className="p-3 border-b">{label}</th>)}</tr></thead>
            <tbody>{payments.data.map(record => <tr key={record.id}>
              <td className="p-3 border-b">#{record.id}</td><td className="p-3 border-b">{record.debt.registration.student.user.first_name} {record.debt.registration.student.user.last_name}</td>
              <td className="p-3 border-b">{record.debt.registration.class.name} · #{record.debt_id}</td><td className="p-3 border-b">{record.amount}</td>
              <td className="p-3 border-b" dir="ltr">{record.display?.paid_at}</td><td className="p-3 border-b"><button className="underline text-indigo-700" onClick={() => setPaymentId(record.id)}>Details</button></td>
            </tr>)}</tbody></table></div>}
      </>}
    </main></div>
    {selected && <PaymentEntryDialog key={`${userId}-${selected.id}`} invoice={selected} onClose={() => setSelected(null)}
      onRecorded={payment => { setSelected(null); setPaymentId(payment.id); load(); }} />}
    {paymentId !== null && <PaymentDetailsDialog paymentId={paymentId} onClose={() => setPaymentId(null)} />}
  </div>;
}
