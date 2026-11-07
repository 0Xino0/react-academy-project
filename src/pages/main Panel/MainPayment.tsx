import { useCallback, useEffect, useRef, useState } from 'react';
import Navbar from '../../components/Navbar';
import UserSidebar from '../../components/UserSidebar';
import PaymentEntryDialog from '../../components/PaymentEntryDialog';
import PaymentDetailsDialog from '../../components/PaymentDetailsDialog';
import { getDebtsOfStudent } from '../../services/api';
import { enrollmentError } from '../../services/registrations';
import type { ApiDebt, ApiDebtResponse } from '../../types/Debts';
import { useSession } from '../../hooks/useSession';

export default function Payment() {
  const userId = useSession()?.user.id;
  const request = useRef(0);
  const [ledger, setLedger] = useState<ApiDebtResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ApiDebt | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true); setError(null); setLedger(null);
    try {
      const response = await getDebtsOfStudent();
      if (current === request.current) setLedger(response);
    } catch (error) { if (current === request.current) setError(enrollmentError(error, 'Could not load debt and payment records.')); }
    finally { if (current === request.current) setLoading(false); }
  }, []);
  useEffect(() => {
    setSelected(null); setPaymentId(null); load();
    return () => { request.current += 1; };
  }, [userId, load]);
  return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex"><UserSidebar />
    <main className="flex-1 p-8 min-w-0"><h1 className="text-2xl mb-4">Debt and payment records</h1>
      <p className="mb-4 text-gray-600">This page records amounts already paid to the academy. It does not transfer money through a bank gateway.</p>
      <button onClick={load} disabled={loading || selected !== null} className="mb-4 underline disabled:opacity-50">Reload records</button>
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      {loading ? <p>Loading records...</p> : ledger && <>
        {!ledger.data.length ? <p>No debt records.</p> : <div className="overflow-x-auto"><table className="min-w-full text-sm bg-white text-left">
          <thead><tr>{['Class', 'Enrollment', 'Original', 'Paid', 'Waived', 'Remaining', 'Action', 'Payment records'].map(label => <th key={label} className="p-3 border-b">{label}</th>)}</tr></thead>
          <tbody>{ledger.data.map(invoice => <tr key={invoice.id}>
            <td className="p-3 border-b">{invoice.registration.class.name}<p dir="ltr">{invoice.registration.class.display?.start_date} – {invoice.registration.class.display?.end_date}</p></td>
            <td className="p-3 border-b">{invoice.registration.cancelled_at ? 'Cancelled (history retained)' : 'Active'}</td>
            <td className="p-3 border-b">{invoice.total_amount}</td><td className="p-3 border-b">{invoice.paid_amount}</td>
            <td className="p-3 border-b">{invoice.waived_amount}</td><td className="p-3 border-b">{invoice.remaining_amount}</td>
            <td className="p-3 border-b"><button disabled={invoice.is_settled} onClick={() => setSelected(invoice)}
              className="rounded bg-indigo-600 px-3 py-2 text-white disabled:bg-gray-400">Record payment</button></td>
            <td className="p-3 border-b">{!invoice.payments.length ? 'No saved payment records' : invoice.payments.map(record =>
              <button key={record.id} onClick={() => setPaymentId(record.id)} className="block mb-2 underline text-indigo-700">#{record.id} · {record.amount} · {record.display?.paid_at}</button>)}</td>
          </tr>)}</tbody></table></div>}
        <div className="mt-6 space-y-2"><p>Original tuition: {ledger.original_total}</p><p>Remaining debt: {ledger.remaining_debt}</p>
          <p>Total paid: {ledger.paid_debt}</p><p>Total waived: {ledger.waived_debt}</p>
          <button disabled={!ledger.data.some(row => !row.is_settled)} onClick={() => setSelected(ledger.data.find(row => !row.is_settled) ?? null)}
            className="rounded bg-indigo-600 px-4 py-2 text-white disabled:bg-gray-400">Record a payment</button></div>
      </>}
    </main></div>
    {selected && <PaymentEntryDialog key={`${userId}-${selected.id}`} invoice={selected} onClose={() => setSelected(null)}
      onRecorded={payment => { setSelected(null); setPaymentId(payment.id); load(); }} />}
    {paymentId !== null && <PaymentDetailsDialog paymentId={paymentId} onClose={() => setPaymentId(null)} />}
  </div>;
}
