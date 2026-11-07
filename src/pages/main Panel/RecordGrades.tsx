import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import UserSidebar from '../../components/UserSidebar';
import { getGrades, saveGrades } from '../../services/api';
import { gradeEntries, gradeError } from '../../services/grades';
import type { ApiGradesResponse } from '../../types/Grades';
import { useSession } from '../../hooks/useSession';

export default function RecordGrades() {
  const classId = Number(useParams().class_id);
  const userId = useSession()?.user.id;
  const version = useRef(0);
  const [data, setData] = useState<ApiGradesResponse | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const current = ++version.current;
    setData(null); setDrafts({}); setError(null); setLoading(true); setSaving(false);
    getGrades(classId).then(response => {
      if (current !== version.current) return;
      setData(response);
      setDrafts(Object.fromEntries(response.students.map(student => [student.id,
        String(response.grades.find(row => row.student_id === student.id)?.grade ?? '')])));
    }).catch(error => { if (current === version.current) setError(gradeError(error)); })
      .finally(() => { if (current === version.current) setLoading(false); });
    return () => { version.current += 1; };
  }, [classId, userId, revision]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data || saving) return;
    const current = version.current;
    setError(null);
    try {
      const entries = gradeEntries(data.students, drafts, data.grades);
      if (!entries.length) { toast('No grade changes to save.'); return; }
      setSaving(true);
      const response = await saveGrades(classId, entries);
      if (current !== version.current) return;
      setData(previous => previous ? { ...previous, grades: [
        ...previous.grades.filter(row => !response.grades.some(saved => saved.student_id === row.student_id)), ...response.grades,
      ] } : previous);
      toast.success('Grades saved successfully.');
    } catch (error) { if (current === version.current) setError(gradeError(error)); }
    finally { if (current === version.current) setSaving(false); }
  };

  return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex"><UserSidebar />
    <main className="flex-1 p-8"><h1 className="text-2xl mb-2">Record grades{data ? `: ${data.class.name}` : ''}</h1>
      <p className="mb-6 text-gray-600">Enter a grade from 0 to 20. Blank new rows stay unrecorded. Only changed grades are saved.</p>
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      {loading ? <p>Loading the class and its enrolled students...</p> : !data ?
        <button className="underline" onClick={() => setRevision(value => value + 1)}>Reload class</button> :
        data.students.length === 0 ? <p>No active enrolled students in this class.</p> : <form onSubmit={submit}>
          <p className="mb-4">Active students: {data.students.length}</p>
          <table className="min-w-full rounded bg-white text-left"><thead><tr>
            <th className="p-3 border-b">First name</th><th className="p-3 border-b">Last name</th><th className="p-3 border-b">Grade (0–20)</th>
          </tr></thead><tbody>{data.students.map(student => <tr key={student.id}>
            <td className="p-3 border-b">{student.user.first_name}</td><td className="p-3 border-b">{student.user.last_name}</td>
            <td className="p-3 border-b"><input aria-label={`Grade for ${student.user.first_name} ${student.user.last_name}`}
              type="number" min="0" max="20" step="any" value={drafts[student.id] ?? ''} disabled={saving}
              onChange={event => setDrafts(previous => ({ ...previous, [student.id]: event.target.value }))}
              className="w-28 rounded border p-2" /></td>
          </tr>)}</tbody></table>
          <button disabled={saving} className="mt-6 rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">
            {saving ? 'Saving...' : 'Save grades'}</button>
        </form>}
    </main></div></div>;
}
