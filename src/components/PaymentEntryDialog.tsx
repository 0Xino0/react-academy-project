import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { recordPayment } from '../services/api';
import { enrollmentError } from '../services/registrations';
import type { ApiDebtRecord } from '../types/Debts';
import type { ApiPayment } from '../types/Payments';

interface Props { invoice: ApiDebtRecord; onClose: () => void; onRecorded: (payment: ApiPayment) => void }

export default function PaymentEntryDialog({ invoice, onClose, onRecorded }: Props) {
  const active = useRef(false);
  const [amount, setAmount] = useState(invoice.remaining_amount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const response = await recordPayment(invoice, amount);
      if (!active.current) return;
      toast.success('Payment amount recorded.');
      onRecorded(response.data);
    } catch (error) { if (active.current) setError(enrollmentError(error, 'Payment amount could not be recorded.')); }
    finally { if (active.current) setBusy(false); }
  };
  const student = invoice.registration.student.user;
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"><form onSubmit={submit}
    role="dialog" aria-modal="true" aria-label="Record a payment" className="w-full max-w-lg rounded bg-white p-6 space-y-4">
    <h2 className="text-xl">Record payment — invoice #{invoice.id}</h2>
    <p>{student.first_name} {student.last_name} · {invoice.registration.class.name}</p>
    <p>Remaining debt: {invoice.remaining_amount}</p>
    <p className="text-sm text-gray-600">Enter an amount already paid to the academy.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <label className="block">Amount<input type="number" required min="0.01" step="0.01" max={invoice.remaining_amount}
      disabled={busy} value={amount} onChange={event => setAmount(event.target.value)} className="block border rounded p-2 w-full" /></label>
    <div className="flex gap-4"><button type="button" disabled={busy} onClick={onClose}>Cancel</button>
      <button disabled={busy} className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Recording...' : 'Record amount'}</button></div>
  </form></div>;
}
