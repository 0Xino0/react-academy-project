import { useEffect, useRef, useState } from 'react';
import { getTerms, getClassesForStudent, getGradesOfStudent } from '../services/api';
import { gradeError } from '../services/grades';
import type { Term } from '../types/Terms';
import type { ApiGrade } from '../types/Grades';
import type { ClassForStudent } from '../types/classes';
import { useSession } from '../hooks/useSession';

export default function StudentGrades() {
  const userId = useSession()?.user.id;
  const [terms, setTerms] = useState<Term[]>([]);
  const [termId, setTermId] = useState(0);
  const [classes, setClasses] = useState<ClassForStudent[]>([]);
  const [classId, setClassId] = useState(0);
  const [grade, setGrade] = useState<ApiGrade | null | undefined>(undefined);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingGrade, setLoadingGrade] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  useEffect(() => {
    let active = true;
    request.current += 1;
    setTerms([]); setTermId(0); setClasses([]); setClassId(0); setGrade(undefined); setError(null); setLoadingTerms(true);
    getTerms(true).then(response => { if (active) { setTerms(response.terms); setTermId(response.terms[0]?.id ?? 0); } })
      .catch(error => { if (active) setError(gradeError(error)); })
      .finally(() => { if (active) setLoadingTerms(false); });
    return () => { active = false; request.current += 1; };
  }, [userId]);
  useEffect(() => {
    let active = true;
    request.current += 1;
    setClasses([]); setClassId(0); setGrade(undefined); setLoadingGrade(false); setLoadingClasses(!!termId);
    if (termId) getClassesForStudent(termId, true).then(response => {
      if (active) { setClasses(response.classes); setClassId(response.classes[0]?.id ?? 0); }
    }).catch(error => { if (active) setError(gradeError(error)); })
      .finally(() => { if (active) setLoadingClasses(false); });
    return () => { active = false; };
  }, [termId, userId]);
  const reset = () => { request.current += 1; setGrade(undefined); setLoadingGrade(false); setError(null); };
  const display = async () => {
    if (!classId || loadingGrade) return;
    const current = ++request.current;
    setGrade(undefined); setLoadingGrade(true); setError(null);
    try {
      const response = await getGradesOfStudent(classId);
      if (current === request.current) setGrade(response.grade);
    } catch (error) { if (current === request.current) setError(gradeError(error)); }
    finally { if (current === request.current) setLoadingGrade(false); }
  };
  const selected = classes.find(row => row.id === classId);
  const historical = selected?.registrations.length && selected.registrations.every(row => row.cancelled_at !== null);
  return <div className="p-4"><h2 className="text-xl font-bold mb-4">Student grades</h2>
    {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
    <div className="flex gap-4 mb-6">
      <label>Term<select className="block border rounded p-2" value={termId || ''} disabled={loadingTerms}
        onChange={event => { reset(); setClasses([]); setClassId(0); setTermId(Number(event.target.value)); }}>
        <option value="">Select term</option>{terms.map(term => <option key={term.id} value={term.id}>{term.season} {term.year}{term.deleted_at ? ' (archived)' : ''}</option>)}</select></label>
      <label>Class<select className="block border rounded p-2" value={classId || ''} disabled={!termId || loadingClasses}
        onChange={event => { reset(); setClassId(Number(event.target.value)); }}>
        <option value="">Select class</option>{classes.map(row => <option key={row.id} value={row.id}>{row.name}{row.deleted_at ? ' (archived)' : ''}</option>)}</select></label>
      <button disabled={!classId || loadingGrade || loadingClasses} onClick={display}
        className="self-end rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">{loadingGrade ? 'Loading...' : 'Show grade'}</button>
    </div>
    {loadingClasses && <p>Loading classes...</p>}
    {!loadingTerms && !loadingClasses && !!termId && !classes.length && <p>No enrollment history in this term.</p>}
    {historical ? <p className="mb-4 text-gray-600">This enrollment was cancelled. Its recorded grade is retained.</p> : null}
    {grade === null && <p>A grade has not been recorded yet.</p>}
    {grade && <table className="min-w-full bg-white text-left"><thead><tr>{['Class', 'Teacher', 'Dates', 'Grade'].map(label =>
      <th key={label} className="p-3 border-b">{label}</th>)}</tr></thead><tbody><tr>
        <td className="p-3">{grade.class.name}</td><td className="p-3">{grade.class.teacher ?
          `${grade.class.teacher.user.first_name} ${grade.class.teacher.user.last_name}` : 'Unavailable teacher'}</td>
        <td className="p-3" dir="ltr">{grade.class.display?.start_date} – {grade.class.display?.end_date}</td><td className="p-3">{grade.grade}</td>
      </tr></tbody></table>}
  </div>;
}
