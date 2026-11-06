import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import UserSidebar from '../components/UserSidebar';
import TeacherClasses from '../components/TeacherClasses';
import { useSession } from '../hooks/useSession';
import { getAvailableClasses, enrollInClass } from '../services/api';
import { enrollmentError } from '../services/registrations';
import type { AvailableClass } from '../types/Enrollment';

export default function MainPanel() {
  const user = useSession()?.user;
  const [classes, setClasses] = useState<AvailableClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setClasses([]);
    setBlockReason(null);
    if (user?.role !== 'student') return;
    setLoading(true);
    getAvailableClasses().then(response => {
      if (!active) return;
      setClasses(response.data);
      setBlockReason(response.registration_block_reason);
    }).catch(error => {
      if (active) setError(enrollmentError(error, 'Failed to load available classes.'));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id, user?.role, revision]);

  useEffect(() => { setError(null); }, [user?.id]);

  const enroll = async (row: AvailableClass) => {
    if (busy !== null) return;
    setBusy(row.id);
    setError(null);
    try {
      await enrollInClass(row);
      toast.success('Enrollment confirmed.');
    } catch (error) {
      setError(enrollmentError(error, 'Enrollment could not be completed.'));
    } finally {
      setBusy(null);
      setRevision(value => value + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <UserSidebar />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-semibold mb-6">Home</h1>
          {user?.role === 'teacher' ? <TeacherClasses /> : <>
            <h2 className="text-xl mb-4">Available classes</h2>
            {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
            {blockReason && <div className="mb-4 rounded bg-amber-50 p-4">
              <p>{blockReason}</p>
              <Link className="text-indigo-700 underline" to="/payment">Review your debt and payments</Link>
            </div>}
            <Link className="text-indigo-700 underline" to="/classes">My enrolled classes</Link>
            {loading ? <p className="mt-4">Loading...</p> : classes.length === 0 ? <p className="mt-4">No classes are currently available for enrollment.</p> :
              <div className="mt-4 overflow-x-auto rounded bg-white shadow">
                <table className="min-w-full text-sm">
                  <thead><tr>{['Course / class', 'Term', 'Teacher', 'Dates', 'Schedule', 'Seats', 'Tuition', 'Action'].map(label =>
                    <th key={label} className="p-3 text-left border-b">{label}</th>)}</tr></thead>
                  <tbody>{classes.map(row => <tr key={row.id}>
                    <td className="p-3 border-b">{row.course_name}<br />{row.class_name}</td>
                    <td className="p-3 border-b">{row.term_season} {row.term_year}</td>
                    <td className="p-3 border-b">{row.teacher_name}</td>
                    <td className="p-3 border-b" dir="ltr">{row.display?.start_date} – {row.display?.end_date}</td>
                    <td className="p-3 border-b">{row.schedules.map(slot => <div key={slot.id}>
                      {slot.display?.day_of_week} <span dir="ltr">{slot.display?.start_time} – {slot.display?.end_time}</span>
                    </div>)}</td>
                    <td className="p-3 border-b">{row.available_capacity} / {row.capacity}</td>
                    <td className="p-3 border-b">{row.tuition_fee}</td>
                    <td className="p-3 border-b">
                      <button disabled={!row.can_register || busy !== null || loading} onClick={() => enroll(row)}
                        className="rounded bg-indigo-600 px-3 py-2 text-white disabled:bg-gray-400">
                        {busy === row.id ? 'Enrolling...' : row.is_registered ? 'Enrolled' : 'Enroll'}
                      </button>
                      {row.registration_block_reason && <p className="mt-2 text-xs text-gray-600">{row.registration_block_reason}</p>}
                    </td>
                  </tr>)}</tbody>
                </table>
              </div>}
          </>}
        </main>
      </div>
    </div>
  );
}
