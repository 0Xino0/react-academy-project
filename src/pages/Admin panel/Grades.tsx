import { useEffect, useRef, useState } from 'react';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import { getTerms, getClassesByTermId, getGrades } from '../../services/api';
import { gradeError } from '../../services/grades';
import type { Term } from '../../types/Terms';
import type { Class } from '../../types/classes';
import type { GradeRecord } from '../../types/Grades';

export default function Grades() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [grades, setGrades] = useState<GradeRecord[] | null>(null);
  const [termId, setTermId] = useState(0);
  const [classId, setClassId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  useEffect(() => {
    let active = true;
    getTerms(true).then(response => { if (active) setTerms(response.terms); })
      .catch(error => { if (active) setError(gradeError(error)); })
      .finally(() => { if (active) setLoadingTerms(false); });
    return () => { active = false; request.current += 1; };
  }, []);
  useEffect(() => {
    let active = true;
    setClasses([]); setLoadingClasses(!!termId);
    if (termId) getClassesByTermId(termId, true).then(response => { if (active) setClasses(response.classes); })
      .catch(error => { if (active) setError(gradeError(error)); })
      .finally(() => { if (active) setLoadingClasses(false); });
    return () => { active = false; };
  }, [termId]);
  const reset = () => { request.current += 1; setGrades(null); setLoading(false); setError(null); };
  const display = async () => {
    if (!classId || loading) return;
    const current = ++request.current;
    setLoading(true); setGrades(null); setError(null);
    try {
      const response = await getGrades(classId);
      if (current === request.current) setGrades(response.grades);
    } catch (error) { if (current === request.current) setError(gradeError(error)); }
    finally { if (current === request.current) setLoading(false); }
  };
  return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex"><AdminSidebar />
    <main className="flex-1 p-8"><h1 className="text-2xl mb-6">Grades</h1>
      <div className="flex gap-4 mb-6">
        <label>Term<select className="block border rounded p-2" value={termId || ''} disabled={loadingTerms}
          onChange={event => { reset(); setClassId(0); setClasses([]); setTermId(Number(event.target.value)); }}>
          <option value="">Select term</option>{terms.map(term => <option key={term.id} value={term.id}>{term.season} {term.year}{term.deleted_at ? ' (archived)' : ''}</option>)}</select></label>
        <label>Class<select className="block border rounded p-2" value={classId || ''} disabled={!termId || loadingClasses}
          onChange={event => { reset(); setClassId(Number(event.target.value)); }}>
          <option value="">Select class</option>{classes.map(row => <option key={row.id} value={row.id}>{row.name}{row.deleted_at ? ' (archived)' : ''}</option>)}</select></label>
        <button disabled={!classId || loading || loadingClasses} onClick={display} className="self-end rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">
          {loading ? 'Loading...' : 'Display'}</button>
      </div>
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      {loadingClasses && <p>Loading classes...</p>}
      {grades !== null && (grades.length === 0 ? <p>No grades have been recorded for this class.</p> :
        <table className="min-w-full bg-white text-left"><thead><tr>{['First name', 'Last name', 'Grade', 'Updated'].map(label =>
          <th key={label} className="p-3 border-b">{label}</th>)}</tr></thead><tbody>{grades.map(row => <tr key={row.id}>
            <td className="p-3 border-b">{row.student.user.first_name}</td><td className="p-3 border-b">{row.student.user.last_name}</td>
            <td className="p-3 border-b">{row.grade}</td><td className="p-3 border-b" dir="ltr">{row.display?.updated_at ?? '—'}</td>
          </tr>)}</tbody></table>)}
    </main></div></div>;
}
