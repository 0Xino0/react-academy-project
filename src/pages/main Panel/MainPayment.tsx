import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import UserSidebar from '../../components/UserSidebar';
import { getDebtsOfStudent, recordPayment } from '../../services/api';
import { enrollmentError } from '../../services/registrations';
import type { ApiDebt } from '../../types/Debts';
import { useSession } from '../../hooks/useSession';

export default function Payment() {
  const userId = useSession()?.user.id;
  const request = useRef(0);
  const [debts, setDebts] = useState<ApiDebt[]>([]);
  const [remaining, setRemaining] = useState('0.00');
  const [paid, setPaid] = useState('0.00');
  const [waived, setWaived] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ApiDebt | null>(null);
  const [amount, setAmount] = useState('');

  const load = useCallback(async () => {
    const current = ++request.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getDebtsOfStudent();
      if (current !== request.current) return;
      setDebts(response.data ?? []);
      setRemaining(response.remaining_debt ?? '0.00');
      setPaid(response.paid_debt ?? '0.00');
      setWaived(response.waived_debt ?? '0.00');
    } catch (error) {
      if (current !== request.current) return;
      setError(enrollmentError(error, 'Failed to load debt records.'));
    } finally { if (current === request.current) setLoading(false); }
  }, []);
  useEffect(() => {
    setDebts([]);
    setSelected(null);
    setRemaining('0.00');
    setPaid('0.00');
    setWaived('0.00');
    load();
    return () => { request.current += 1; };
  }, [load, userId]);

  const openPayment = (debt: ApiDebt) => {
    setSelected(debt);
    setAmount(debt.remaining_amount);
    setFormError(null);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await recordPayment(selected, amount);
      setSelected(null);
      toast.success('Payment amount recorded.');
      await load();
    } catch (error) {
      setFormError(enrollmentError(error, 'Payment amount could not be recorded.'));
    } finally { setBusy(false); }
  };

  return <div className="min-h-screen bg-gray-50">
    <Navbar />
    <div className="flex"><UserSidebar /><main className="flex-1 p-8">
      <h1 className="text-2xl font-semibold mb-4">Debt and payment records</h1>
      <p className="mb-4 text-gray-600">This page records amounts paid to the academy. It does not transfer money through a bank gateway.</p>
      {error && <p role="alert" className="mb-4 text-red-700">{error} <button className="underline" onClick={load}>Reload</button></p>}
      {loading ? <p>Loading...</p> : debts.length === 0 ? <p>No debt records.</p> :
        <div className="overflow-x-auto rounded bg-white shadow"><table className="min-w-full text-sm">
          <thead><tr>{['Class', 'Enrollment', 'Original tuition', 'Paid', 'Waived', 'Remaining', 'Action'].map(label =>
            <th key={label} className="p-3 border-b text-left">{label}</th>)}</tr></thead>
          <tbody>{debts.map(debt => <tr key={debt.id}>
            <td className="p-3 border-b">{debt.registration.class.name}<br /><span dir="ltr">
              {debt.registration.class.display?.start_date} – {debt.registration.class.display?.end_date}</span></td>
            <td className="p-3 border-b">{debt.registration.cancelled_at ? 'Cancelled (history retained)' : 'Active'}</td>
            <td className="p-3 border-b">{debt.total_amount}</td>
            <td className="p-3 border-b">{debt.paid_amount}</td>
            <td className="p-3 border-b">{debt.waived_amount}</td>
            <td className="p-3 border-b">{debt.remaining_amount}</td>
            <td className="p-3 border-b"><button disabled={debt.is_settled || busy} onClick={() => openPayment(debt)}
              className="rounded bg-indigo-600 px-3 py-2 text-white disabled:bg-gray-400">Record payment</button></td>
          </tr>)}</tbody>
        </table></div>}
      <div className="mt-6 space-y-2"><p>Remaining debt: {remaining}</p><p>Total paid: {paid}</p><p>Total waived: {waived}</p>
        <button disabled={loading || busy || !debts.some(debt => !debt.is_settled)}
          onClick={() => { const debt = debts.find(item => !item.is_settled); if (debt) openPayment(debt); }}
          className="rounded bg-indigo-600 px-4 py-2 text-white disabled:bg-gray-400">Record a payment</button>
      </div>
    </main></div>
    {selected && <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded bg-white p-6 space-y-4">
        <h2 className="text-xl">Record payment: {selected.registration.class.name}</h2>
        <p>Remaining: {selected.remaining_amount}</p>
        {formError && <p role="alert" className="text-red-700">{formError}</p>}
        <label className="block">Amount<input type="number" min="0.01" step="0.01" max={selected.remaining_amount} required
          value={amount} onChange={event => setAmount(event.target.value)} disabled={busy} className="block border rounded p-2 w-full" /></label>
        <div className="flex gap-3"><button type="button" disabled={busy} onClick={() => setSelected(null)}>Cancel</button>
          <button disabled={busy} className="rounded bg-indigo-600 px-3 py-2 text-white">{busy ? 'Recording...' : 'Record amount'}</button></div>
      </form>
    </div>}
  </div>;
}
