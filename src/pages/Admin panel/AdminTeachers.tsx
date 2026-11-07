import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import { getTeachers, updateTeacherSalary, deleteTeacher } from '../../services/api';
import { peopleError } from '../../services/people';
import type { ApiTeacher } from '../../types/teachers';
import { useSession } from '../../hooks/useSession';

export default function Teachers() {
  const userId = useSession()?.user.id;
  const version = useRef(0);
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ teacher: ApiTeacher; mode: 'salary' | 'deactivate' } | null>(null);
  const [salary, setSalary] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const current = ++version.current;
    setTeachers([]); setSelected(null); setError(null); setFormError(null); setLoading(true); setBusy(false);
    getTeachers().then(response => { if (current === version.current) setTeachers(response.data); })
      .catch(error => { if (current === version.current) setError(peopleError(error)); })
      .finally(() => { if (current === version.current) setLoading(false); });
    return () => { version.current += 1; };
  }, [revision, userId]);
  const open = (teacher: ApiTeacher, mode: 'salary' | 'deactivate') => {
    setSelected({ teacher, mode }); setSalary(teacher.salary ?? ''); setFormError(null);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || busy) return;
    const current = version.current;
    const { teacher, mode } = selected;
    setBusy(true); setFormError(null);
    try {
      if (mode === 'salary') {
        const response = await updateTeacherSalary(teacher.id, { salary });
        if (current !== version.current) return;
        setTeachers(rows => rows.map(row => row.id === teacher.id ? response.data : row));
        toast.success('Teacher salary updated.');
      } else {
        await deleteTeacher(teacher.id);
        if (current !== version.current) return;
        setTeachers(rows => rows.filter(row => row.id !== teacher.id));
        toast.success('Teacher profile deactivated.');
      }
      setSelected(null);
    } catch (error) { if (current === version.current) setFormError(peopleError(error)); }
    finally { if (current === version.current) setBusy(false); }
  };
  return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex"><AdminSidebar />
    <main className="flex-1 p-8"><div className="flex justify-between mb-6"><h1 className="text-2xl">Teachers</h1>
      <Link className="text-indigo-700 underline" to="/admin/teachers/new">Add teacher</Link></div>
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      <button disabled={loading || busy} onClick={() => setRevision(value => value + 1)} className="mb-4 underline disabled:opacity-50">Reload teachers</button>
      {loading ? <p>Loading teachers...</p> : !teachers.length ? <p>No active teacher profiles.</p> :
        <table className="min-w-full bg-white text-left"><thead><tr>{['Name', 'Phone', 'Email', 'Salary', 'Actions'].map(label =>
          <th key={label} className="p-3 border-b">{label}</th>)}</tr></thead><tbody>{teachers.map(teacher => <tr key={teacher.id}>
            <td className="p-3 border-b">{teacher.user.first_name} {teacher.user.last_name}</td><td className="p-3 border-b">{teacher.user.phone}</td>
            <td className="p-3 border-b">{teacher.user.email}</td><td className="p-3 border-b">{teacher.salary ?? 'Not set'}</td>
            <td className="p-3 border-b space-x-3"><button disabled={busy} onClick={() => open(teacher, 'salary')} className="underline text-indigo-700">Edit salary</button>
              <button disabled={busy} onClick={() => open(teacher, 'deactivate')} className="underline text-red-700">Deactivate profile</button></td>
          </tr>)}</tbody></table>}
    </main></div>
    {selected && <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"><form onSubmit={submit} role="dialog" aria-modal="true"
      aria-label={selected.mode === 'salary' ? 'Edit salary' : 'Deactivate teacher profile'} className="w-full max-w-lg rounded bg-white p-6 space-y-4">
      <h2 className="text-xl">{selected.mode === 'salary' ? 'Edit salary' : 'Deactivate teacher profile'}: {selected.teacher.user.first_name} {selected.teacher.user.last_name}</h2>
      {formError && <p role="alert" className="text-red-700">{formError}</p>}
      {selected.mode === 'salary' ? <label className="block">Salary (whole number, including zero)
        <input type="number" min="0" step="1" required disabled={busy} value={salary} onChange={event => setSalary(event.target.value)}
          className="block w-full border rounded p-2" /></label> :
        <p>This deactivates the teacher profile and removes its teacher role. The user account, teaching assignments and records remain. Affected classes need an active teacher assigned separately.</p>}
      <div className="flex gap-4"><button type="button" disabled={busy} onClick={() => setSelected(null)}>Cancel</button>
        <button disabled={busy} className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Saving...' : selected.mode === 'salary' ? 'Save salary' : 'Confirm deactivation'}</button></div>
    </form></div>}
  </div>;
}
