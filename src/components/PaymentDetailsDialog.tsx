import { useEffect, useState } from 'react';
import { getPayment } from '../services/api';
import { enrollmentError } from '../services/registrations';
import type { ApiPayment } from '../types/Payments';
import { useSession } from '../hooks/useSession';

export default function PaymentDetailsDialog({ paymentId, onClose }: { paymentId: number; onClose: () => void }) {
  const userId = useSession()?.user.id;
  const [payment, setPayment] = useState<ApiPayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setPayment(null); setError(null);
    getPayment(paymentId).then(response => { if (active) setPayment(response.data); })
      .catch(error => { if (active) setError(enrollmentError(error, 'Could not load the payment record.')); });
    return () => { active = false; };
  }, [paymentId, userId, revision]);
  const registration = payment?.debt.registration;
  return <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"><div role="dialog" aria-modal="true"
    aria-label="Payment record details" className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded bg-white p-6 space-y-4">
    <h2 className="text-xl">Payment record #{paymentId}</h2>
    {error && <p role="alert" className="text-red-700">{error} <button onClick={() => setRevision(value => value + 1)} className="underline">Reload record</button></p>}
    {!payment && !error && <p>Loading payment details...</p>}
    {payment && registration && <>
      <p>{registration.student.user.first_name} {registration.student.user.last_name}</p>
      <p>{registration.class.name} · {registration.class.term.season} {registration.class.term.year}</p>
      <dl className="grid grid-cols-2 gap-3">{[
        ['Invoice', String(payment.debt.id)], ['Recorded amount', payment.amount], ['Payment date', payment.display?.paid_at ?? '—'],
        ['Record created', payment.display?.created_at ?? '—'], ['Original tuition', payment.debt.total_amount],
        ['Paid to date', payment.debt.paid_amount], ['Waived', payment.debt.waived_amount], ['Remaining now', payment.debt.remaining_amount],
      ].map(([label, value]) => <div key={label}><dt className="text-sm text-gray-500">{label}</dt><dd dir="ltr">{value}</dd></div>)}</dl>
      <p>Enrollment: {registration.cancelled_at ? 'Cancelled (history retained)' : 'Active'}</p>
      {registration.cancelled_at && <p dir="ltr">{registration.display?.cancelled_at}</p>}
      {registration.student.deleted_at && <p>Student profile is deactivated; financial history is retained.</p>}
      <p className="text-sm text-gray-600">This is an academy payment record. Invoice balances reflect their current state.</p>
    </>}
    <button onClick={onClose} className="underline">Close</button>
  </div></div>;
}
