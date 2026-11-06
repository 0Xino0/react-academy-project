import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import { getCancellationPolicy, updateCancellationPolicy } from '../../services/api';
import { enrollmentError } from '../../services/registrations';

export default function RegistrationPolicy() {
  const [requiresSettlement, setRequiresSettlement] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getCancellationPolicy().then(response => { if (active) setRequiresSettlement(response.policy.cancellation_requires_settlement); })
      .catch(error => { if (active) setError(enrollmentError(error, 'Could not load the cancellation policy.')); });
    return () => { active = false; };
  }, []);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (requiresSettlement === null || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await updateCancellationPolicy({ cancellation_requires_settlement: requiresSettlement });
      setRequiresSettlement(response.policy.cancellation_requires_settlement);
      toast.success('Cancellation policy saved.');
    } catch (error) { setError(enrollmentError(error, 'The policy could not be saved.')); }
    finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex"><AdminSidebar />
    <main className="flex-1 p-8" dir="rtl"><h1 className="text-2xl mb-6">سیاست لغو ثبت‌نام</h1>
      <p className="mb-4">ثبت‌نام جدید برای دانشجوی دارای مانده بدهی قبلی مجاز نیست. این شرط برای همه دانشجویان برقرار است.</p>
      <p className="mb-4">لغو فقط مربوط به همان کلاس است. سابقه ثبت‌نام، پرداخت و نمره حذف نمی‌شود.</p>
      {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
      {requiresSettlement === null ? <p>در حال بارگذاری سیاست...</p> : <form onSubmit={save} className="rounded bg-white p-6 space-y-5 max-w-2xl">
        <label className="block"><input type="radio" name="cancellation" checked={requiresSettlement} disabled={busy}
          onChange={() => setRequiresSettlement(true)} /> لغو فقط پس از تسویه کامل بدهی همان ثبت‌نام</label>
        <label className="block"><input type="radio" name="cancellation" checked={!requiresSettlement} disabled={busy}
          onChange={() => setRequiresSettlement(false)} /> اجازه لغو بدون پرداخت؛ مانده پرداخت‌نشده بخشوده شود</label>
        <p className="text-gray-600">در حالت بخشودگی، اصل شهریه و پرداخت‌های قبلی در سوابق باقی می‌مانند و فقط مانده قابل پرداخت صفر می‌شود. تغییر این سیاست، لغوها و بخشودگی‌های قبلی را تغییر نمی‌دهد.</p>
        <button disabled={busy} className="rounded bg-indigo-600 px-4 py-2 text-white">{busy ? 'در حال ذخیره...' : 'ذخیره سیاست آکادمی'}</button>
      </form>}
    </main></div></div>;
}
