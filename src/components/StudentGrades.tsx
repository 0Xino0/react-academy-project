// src/components/StudentGrades.tsx
import { useEffect, useState } from 'react';
import { getTerms, getClassesForStudent, getGradesOfStudent } from '../services/api';
import { Term } from '../types/Terms';
import { ApiGrade, ApiGradeClass } from '../types/Grades';

const StudentGrades = () => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [classes, setClasses] = useState<ApiGradeClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [grades, setGrades] = useState<ApiGrade[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch terms on component mount
  useEffect(() => {
    getTerms().then(res => {
      setTerms(res.terms);
      if (res.terms.length > 0) setSelectedTerm(res.terms[0].id);
    }).catch(err => {
      setError('Failed to load terms');
      console.error('Error loading terms:', err);
    });
  }, []);

  // Fetch classes when term changes
  useEffect(() => {
    if (selectedTerm) {
      setLoading(true);
      getClassesForStudent(selectedTerm)
        .then(res => {
          setClasses(res.classes);
          if (res.classes.length > 0) setSelectedClass(res.classes[0].id);
        })
        .catch(err => {
          setError('Failed to load classes');
          console.error('Error loading classes:', err);
        })
        .finally(() => setLoading(false));
    }
  }, [selectedTerm]);

  // Fetch grades when class is selected
  const handleShowGrades = () => {
    if (selectedClass) {
      setLoading(true);
      getGradesOfStudent(selectedClass)
        .then(res => {
          setGrades([res.grade]);
        })
        .catch(err => {
          setError('Failed to load grades');
          console.error('Error loading grades:', err);
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Student Grades</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Term</label>
          <select
            className="p-2 border rounded w-48"
            value={selectedTerm ?? ''}
            onChange={e => setSelectedTerm(Number(e.target.value))}
          >
            {terms.map(term => (
              <option key={term.id} value={term.id}>
                {term.season} {term.year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
          <select
            className="p-2 border rounded w-48"
            value={selectedClass ?? ''}
            onChange={e => setSelectedClass(Number(e.target.value))}
          >
            {classes.map(classItem => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleShowGrades}
          disabled={loading || !selectedClass}
        >
          {loading ? 'Loading...' : 'Show Grades'}
        </button>
      </div>

      {grades.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 border-b text-left">Class Name</th>
                <th className="px-6 py-3 border-b text-left">Teacher Name</th>
                <th className="px-6 py-3 border-b text-left">Start Date</th>
                <th className="px-6 py-3 border-b text-left">End Date</th>
                <th className="px-6 py-3 border-b text-left">Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades.map(grade => (
                <tr key={grade.id}>
                  <td className="px-6 py-4 border-b">{grade.class.name}</td>
                  <td className="px-6 py-4 border-b">{`${grade.class.teacher.user.first_name} ${grade.class.teacher.user.last_name}`}</td>
                  <td className="px-6 py-4 border-b">{new Date(grade.class.start_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 border-b">{new Date(grade.class.end_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 border-b">{grade.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentGrades;