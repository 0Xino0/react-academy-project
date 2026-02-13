// src/components/TeacherGrades.tsx
import { useEffect, useState } from 'react';
import { getTerms, getClassesForTeacher } from '../services/api';
import { Term } from '../types/Terms';
import { Class } from '../types/classes';
import { useNavigate } from 'react-router-dom';
const TeacherGrades = () => {
  const navigate = useNavigate();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTerms().then(res => {
      setTerms(res.terms);
      if (res.terms.length > 0) setSelectedTerm(res.terms[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedTerm) {
      setLoading(true);
      setError(null);
      getClassesForTeacher(selectedTerm)
        .then(res => {
          setClasses(res.classes || []);
        })
        .catch(() => setError('Error fetching classes'))
        .finally(() => setLoading(false));
    } else {
      setClasses([]);
    }
  }, [selectedTerm]);

  return (
    <div className="mb-12">
      <h2 className="text-xl font-bold mb-4">Term</h2>
      <select
        className="mb-6 p-2 border rounded"
        value={selectedTerm ?? ''}
        onChange={e => setSelectedTerm(Number(e.target.value))}
      >
        {terms.map(term => (
          <option key={term.id} value={term.id}>
            {term.season} {term.year}
          </option>
        ))}
      </select>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : classes.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">No classes found</td></tr>
            ) : (
              classes.map(cls => (
                <tr key={cls.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cls.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer">{cls.start_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer">{cls.end_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{cls.capacity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-700 font-semibold hover:underline" onClick={() => navigate(`/grades/record/${cls.id}`)}>Record Grades</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherGrades;