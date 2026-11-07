import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import { registerTeacher } from '../../services/api';
import { peopleError } from '../../services/people';
import type { TeacherRegistrationData } from '../../types/teachers';
import { useSession } from '../../hooks/useSession';

const empty: TeacherRegistrationData = { national_id: '', first_name: '', last_name: '', phone: '', email: '', password: '', password_confirmation: '' };
const fields: Array<{ name: keyof TeacherRegistrationData; label: string; type: string }> = [
  { name: 'national_id', label: 'National ID (10 digits)', type: 'text' },
  { name: 'first_name', label: 'First name', type: 'text' }, { name: 'last_name', label: 'Last name', type: 'text' },
  { name: 'phone', label: 'Phone (+989 followed by 9 digits)', type: 'tel' }, { name: 'email', label: 'Email', type: 'email' },
  { name: 'password', label: 'Password', type: 'password' }, { name: 'password_confirmation', label: 'Confirm password', type: 'password' },
];
export default function TeacherRegistration() {
  const userId = useSession()?.user.id;
  const version = useRef(0);
  const [form, setForm] = useState<TeacherRegistrationData>({ ...empty });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    version.current += 1; setForm({ ...empty }); setError(null); setLoading(false);
    return () => { version.current += 1; };
  }, [userId]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError(null);
    if (!/^\+989\d{9}$/.test(form.phone)) { setError('Enter an Iranian mobile number in +989xxxxxxxxx format.'); return; }
    if (!/^\d{10}$/.test(form.national_id)) { setError('National ID must have exactly 10 digits.'); return; }
    if (form.password.length < 8 || form.password !== form.password_confirmation) { setError('Passwords must match and have at least 8 characters.'); return; }
    const current = version.current;
    setLoading(true);
    try {
      await registerTeacher(form);
      if (current !== version.current) return;
      setForm({ ...empty }); toast.success('Teacher account created.');
    } catch (error) { if (current === version.current) setError(peopleError(error)); }
    finally { if (current === version.current) setLoading(false); }
  };
  return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex"><AdminSidebar />
    <main className="flex-1 p-8"><div className="max-w-xl mx-auto"><h1 className="text-2xl mb-4">Register teacher</h1>
      <Link to="/admin/teachers" className="text-indigo-700 underline">Back to teachers</Link>
      {error && <p role="alert" className="my-4 text-red-700">{error}</p>}
      <form onSubmit={submit} className="mt-6 rounded bg-white p-6"><fieldset disabled={loading} className="space-y-4">
        {fields.map(field => <label key={field.name} className="block" htmlFor={field.name}>{field.label}
          <input id={field.name} name={field.name} type={field.type} required value={form[field.name]}
            minLength={field.type === 'password' ? 8 : undefined} maxLength={field.name === 'national_id' ? 10 : field.name === 'first_name' || field.name === 'last_name' ? 255 : undefined}
            pattern={field.name === 'national_id' ? '[0-9]{10}' : field.name === 'phone' ? '[+]989[0-9]{9}' : undefined}
            autoComplete={field.type === 'password' ? 'new-password' : undefined}
            onChange={event => setForm(previous => ({ ...previous, [field.name]: event.target.value }))} className="block w-full border rounded p-2" /></label>)}
        <button disabled={loading} className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">{loading ? 'Creating account...' : 'Create teacher account'}</button>
      </fieldset></form>
    </div></main></div></div>;
}
