import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import { getTerms, getClassesByTermId, getStudentsByClassId, getStudentById, deleteStudent } from '../../services/api';
import { peopleError } from '../../services/people';
import type { Term } from '../../types/Terms';
import type { Class } from '../../types/classes';
import type { ApiStudent } from '../../types/Students';
import { useSession } from '../../hooks/useSession';

export default function Students() {
  const userId = useSession()?.user.id;
  const request = useRef(0);
  const detailRequest = useRef(0);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<ApiStudent[] | null>(null);
  const [termId, setTermId] = useState(0);
  const [classId, setClassId] = useState(0);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApiStudent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [toDeactivate, setToDeactivate] = useState<ApiStudent | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const reset = useCallback(() => {
    request.current += 1; detailRequest.current += 1;
    setStudents(null); setLoadingStudents(false); setError(null); setDetail(null); setDetailOpen(false); setDetailError(null);
    setToDeactivate(null); setFormError(null);
  }, []);
  useEffect(() => {
    let active = true;
    reset(); setTerms([]); setClasses([]); setTermId(0); setClassId(0); setLoadingTerms(true); setDeactivating(false);
    getTerms().then(response => { if (active) setTerms(response.terms); })
      .catch(error => { if (active) setError(peopleError(error)); })
      .finally(() => { if (active) setLoadingTerms(false); });
    return () => { active = false; request.current += 1; detailRequest.current += 1; };
  }, [userId, reset]);
  useEffect(() => {
    let active = true;
    setClasses([]); setLoadingClasses(!!termId);
    if (termId) getClassesByTermId(termId).then(response => { if (active) setClasses(response.classes); })
      .catch(error => { if (active) setError(peopleError(error)); })
      .finally(() => { if (active) setLoadingClasses(false); });
    return () => { active = false; };
  }, [termId, userId]);
  const display = async () => {
    if (!classId || loadingStudents || deactivating) return;
    reset(); const current = request.current;
    setLoadingStudents(true);
    try {
      const response = await getStudentsByClassId(classId);
      if (current === request.current) setStudents(response.data);
    } catch (error) { if (current === request.current) setError(peopleError(error)); }
    finally { if (current === request.current) setLoadingStudents(false); }
  };
  const showDetails = async (student: ApiStudent) => {
    const context = request.current;
    const current = ++detailRequest.current;
    setDetail(null); setDetailError(null); setDetailOpen(true);
    try {
      const response = await getStudentById(student.id);
      if (context === request.current && current === detailRequest.current) setDetail(response.data);
    } catch (error) { if (context === request.current && current === detailRequest.current) setDetailError(peopleError(error)); }
  };
  const deactivate = async () => {
    if (!toDeactivate || deactivating) return;
    const current = request.current;
    const profileId = toDeactivate.id;
    setDeactivating(true); setFormError(null);
    try {
      await deleteStudent(profileId);
      if (current !== request.current) return;
      setStudents(rows => rows?.filter(row => row.id !== profileId) ?? null);
      setToDeactivate(null); setDetailOpen(false); setDetail(null); detailRequest.current += 1;
      toast.success('Student profile deactivated.');
    } catch (error) { if (current === request.current) setFormError(peopleError(error)); }
    finally { if (current === request.current) setDeactivating(false); }
  };
  return <div className="min-h-screen bg-gray-50"><Navbar /><div className="flex"><AdminSidebar />
    <main className="flex-1 p-8"><h1 className="text-2xl mb-6">Students by class</h1>
      <div className="flex gap-4 mb-6"><label>Term<select value={termId || ''} disabled={loadingTerms || deactivating}
        onChange={event => { reset(); setClassId(0); setClasses([]); setTermId(Number(event.target.value)); }} className="block border rounded p-2">
        <option value="">Select term</option>{terms.map(term => <option key={term.id} value={term.id}>{term.season} {term.year}</option>)}</select></label>
        <label>Class<select value={classId || ''} disabled={!termId || loadingClasses || deactivating}
          onChange={event => { reset(); setClassId(Number(event.target.value)); }} className="block border rounded p-2">
          <option value="">Select class</option>{classes.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
        <button onClick={display} disabled={!classId || loadingClasses || loadingStudents || deactivating}
          className="self-end rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">{loadingStudents ? 'Loading...' : 'Display'}</button>
      </div>
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      {loadingClasses && <p>Loading classes...</p>}
      {students !== null && (!students.length ? <p>No active students enrolled in this class.</p> :
        <table className="min-w-full bg-white text-left"><thead><tr>{['Name', 'Phone', 'Email', 'Actions'].map(label =>
          <th key={label} className="p-3 border-b">{label}</th>)}</tr></thead><tbody>{students.map(student => <tr key={student.id}>
            <td className="p-3 border-b">{student.user.first_name} {student.user.last_name}</td><td className="p-3 border-b">{student.user.phone}</td>
            <td className="p-3 border-b">{student.user.email}</td><td className="p-3 border-b space-x-3">
              <button disabled={deactivating} onClick={() => showDetails(student)} className="text-indigo-700 underline">Details</button>
              <button disabled={deactivating} onClick={() => { setToDeactivate(student); setFormError(null); }} className="text-red-700 underline">Deactivate profile</button>
            </td></tr>)}</tbody></table>)}
    </main></div>
    {detailOpen && <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" aria-label="Student details" className="w-full max-w-xl rounded bg-white p-6 space-y-4">
      <h2 className="text-xl">Student details</h2>{detailError && <p role="alert" className="text-red-700">{detailError}</p>}
      {!detail && !detailError && <p>Loading student details...</p>}
      {detail && <dl className="grid grid-cols-2 gap-3">{[
        ['First name', detail.user.first_name], ['Last name', detail.user.last_name], ['National ID', detail.user.national_id],
        ['Phone', detail.user.phone], ['Email', detail.user.email], ["Father's name", detail.father_name], ["Father's phone", detail.father_phone],
        ["Mother's name", detail.mother_name], ["Mother's phone", detail.mother_phone],
      ].map(([label, value]) => <div key={label}><dt className="text-sm text-gray-500">{label}</dt><dd>{value ?? 'Not provided'}</dd></div>)}</dl>}
      <button onClick={() => { detailRequest.current += 1; setDetailOpen(false); setDetail(null); }}>Close</button>
    </div></div>}
    {toDeactivate && <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"><div role="dialog" aria-modal="true" aria-label="Deactivate student profile" className="w-full max-w-lg rounded bg-white p-6 space-y-4">
      <h2 className="text-xl">Deactivate profile: {toDeactivate.user.first_name} {toDeactivate.user.last_name}</h2>
      <p>This deactivates the student profile across the academy and removes its student role. Enrollments, debts, payments and grades remain. It does not cancel a class enrollment or free its seat.</p>
      {formError && <p role="alert" className="text-red-700">{formError}</p>}
      <div className="flex gap-4"><button disabled={deactivating} onClick={() => setToDeactivate(null)}>Cancel</button>
        <button disabled={deactivating} onClick={deactivate} className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50">{deactivating ? 'Saving...' : 'Confirm deactivation'}</button></div>
    </div></div>}
  </div>;
}
