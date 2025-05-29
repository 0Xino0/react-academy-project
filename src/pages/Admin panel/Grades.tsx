import { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import { getTerms, getClassesByTermId, getGrades } from '../../services/api';
import { Term } from '../../types/Terms';
import { Class } from '../../types/classes';
import { ApiGrade } from '../../types/Grades';

export default function Grades() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [grades, setGrades] = useState<ApiGrade[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showGrades, setShowGrades] = useState(false);
  
  // Loading states
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  
  // Error states
  const [termsError, setTermsError] = useState<string | null>(null);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [gradesError, setGradesError] = useState<string | null>(null);

  // Fetch terms on component mount
  useEffect(() => {
    fetchTerms();
  }, []);

  // Fetch classes when term changes
  useEffect(() => {
    if (selectedTerm) {
      fetchClasses(selectedTerm.id);
    } else {
      setClasses([]);
    }
  }, [selectedTerm]);

  const fetchTerms = async () => {
    try {
      setIsLoadingTerms(true);
      setTermsError(null);
      const response = await getTerms();
      if (response.status) {
        setTerms(response.terms || []);
      } else {
        setTermsError('Failed to fetch terms');
      }
    } catch (err) {
      console.error('Error fetching terms:', err);
      setTermsError('Error loading terms. Please try again.');
    } finally {
      setIsLoadingTerms(false);
    }
  };

  const fetchClasses = async (termId: number) => {
    try {
      setIsLoadingClasses(true);
      setClassesError(null);
      const response = await getClassesByTermId(termId);
      if (response.status) {
        setClasses(response.classes || []);
      } else {
        setClassesError('Failed to fetch classes');
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setClassesError('Error loading classes. Please try again.');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const fetchGrades = async (classId: number) => {
    try {
      setIsLoadingGrades(true);
      setGradesError(null);
      const response = await getGrades(classId);
      if (response.status) {
        setGrades(response.data || []);
      } else {
        setGradesError('Failed to fetch grades');
      }
    } catch (err) {
      console.error('Error fetching grades:', err);
      setGradesError('Error loading grades. Please try again.');
    } finally {
      setIsLoadingGrades(false);
    }
  };

  const handleTermChange = (termId: string) => {
    const term = terms.find(t => t.id === parseInt(termId));
    setSelectedTerm(term || null);
    setSelectedClass(null);
    setShowGrades(false);
    setGrades([]);
  };

  const handleClassChange = (classId: string) => {
    const classItem = classes.find(c => c.id === parseInt(classId));
    setSelectedClass(classItem || null);
    setShowGrades(false);
    setGrades([]);
  };

  const handleDisplay = async () => {
    if (selectedTerm && selectedClass) {
      await fetchGrades(selectedClass.id);
      setShowGrades(true);
    }
  };

  const filteredClasses = selectedTerm
    ? classes.filter(c => c.term_id === selectedTerm.id)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        
        <div className="flex-1 p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
                  <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={selectedTerm?.id || ''}
                    onChange={(e) => handleTermChange(e.target.value)}
                    disabled={isLoadingTerms}
                  >
                    <option value="">Select Term</option>
                    {terms?.map(term => (
                      <option key={term.id} value={term.id}>
                        {term.season} {term.year}
                      </option>
                    ))}
                  </select>
                  {isLoadingTerms && <p className="mt-1 text-sm text-gray-500">Loading terms...</p>}
                  {termsError && <p className="mt-1 text-sm text-red-500">{termsError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                  <select
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={selectedClass?.id || ''}
                    onChange={(e) => handleClassChange(e.target.value)}
                    disabled={!selectedTerm || isLoadingClasses}
                  >
                    <option value="">Select Class</option>
                    {filteredClasses?.map(classItem => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingClasses && <p className="mt-1 text-sm text-gray-500">Loading classes...</p>}
                  {classesError && <p className="mt-1 text-sm text-red-500">{classesError}</p>}
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleDisplay}
                    disabled={!selectedTerm || !selectedClass || isLoadingGrades}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingGrades ? 'Loading...' : 'Display'}
                  </button>
                </div>
              </div>
            </div>

            {gradesError && (
              <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-md">
                {gradesError}
              </div>
            )}

            {showGrades && (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        First Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {grades.map((grade) => (
                      <tr key={grade.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {grade.student.user.first_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {grade.student.user.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {grade.grade.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}