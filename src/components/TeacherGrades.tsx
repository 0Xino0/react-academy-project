import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTerms, getClassesForTeacher } from '../services/api';
import { gradeError } from '../services/grades';
import type { Term } from '../types/Terms';
import type { Class } from '../types/classes';
import { useSession } from '../hooks/useSession';

export default function TeacherGrades() {
  const navigate = useNavigate();
  const userId = useSession()?.user.id;
  const [terms, setTerms] = useState<Term[]>([]);
  const [termId, setTermId] = useState(0);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setTerms([]); setClasses([]); setTermId(0); setError(null);
    getTerms().then(response => { if (active) { setTerms(response.terms); setTermId(response.terms[0]?.id ?? 0); } })
      .catch(error => { if (active) setError(gradeError(error)); });
    return () => { active = false; };
  }, [userId]);
  useEffect(() => {
    let active = true;
    setClasses([]); setLoading(!!termId);
    if (termId) getClassesForTeacher(termId).then(response => { if (active) setClasses(response.classes); })
      .catch(error => { if (active) setError(gradeError(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [termId, userId]);
  return <div className="mb-12"><h2 className="text-xl mb-4">Grades by class</h2>
    <label>Term<select className="block border rounded p-2 mb-6" value={termId || ''}
      onChange={event => { setClasses([]); setError(null); setTermId(Number(event.target.value)); }}>
      <option value="">Select term</option>{terms.map(term => <option key={term.id} value={term.id}>{term.season} {term.year}</option>)}</select></label>
    {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
    {loading ? <p>Loading classes...</p> : !classes.length ? <p>No classes found.</p> :
      <table className="min-w-full bg-white text-left"><thead><tr>{['Class', 'Dates', 'Enrolled students', 'Action'].map(label =>
        <th key={label} className="p-3 border-b">{label}</th>)}</tr></thead><tbody>{classes.map(row => <tr key={row.id}>
          <td className="p-3 border-b">{row.name}</td><td className="p-3 border-b" dir="ltr">{row.display?.start_date} – {row.display?.end_date}</td>
          <td className="p-3 border-b">{row.registrations_count}</td><td className="p-3 border-b">
            <button className="underline text-indigo-700" onClick={() => navigate(`/grades/record/${row.id}`)}>Record grades</button></td>
        </tr>)}</tbody></table>}
  </div>;
}
