import { useState, useEffect } from 'react';
import { Eye, Trash2, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import { getTerms } from '../../services/api';
import { getClassesByTermId } from '../../services/api';
import { getStudentsByClassId, deleteStudent } from '../../services/api';
import { Term } from '../../types/Terms';
import { Class } from '../../types/classes';
import { ApiStudent } from '../../types/Students';

export default function Students() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [showStudents, setShowStudents] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ApiStudent | null>(null);
  
  // Loading states
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // Error states
  const [termsError, setTermsError] = useState<string | null>(null);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<ApiStudent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

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

  const fetchStudents = async (classId: number) => {
    try {
      setIsLoadingStudents(true);
      setStudentsError(null);
      const response = await getStudentsByClassId(classId);
      if (response.status) {
        const studentsData = Array.isArray(response.data) ? response.data : [response.data];
        setStudents(studentsData || []);
      } else {
        setStudentsError('Failed to fetch students or no students found');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudentsError('Error loading students. Please try again.');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleTermChange = (termId: string) => {
    const term = terms.find(t => t.id === parseInt(termId));
    setSelectedTerm(term || null);
    setSelectedClass(null);
    setShowStudents(false);
    setStudents([]);
  };

  const handleClassChange = (classId: string) => {
    const classItem = classes.find(c => c.id === parseInt(classId));
    setSelectedClass(classItem || null);
    setShowStudents(false);
    setStudents([]);
  };

  const handleDisplay = async () => {
    if (selectedTerm && selectedClass) {
      await fetchStudents(selectedClass.id);
      setShowStudents(true);
    }
  };

  const handleViewDetails = (student: ApiStudent) => {
    setSelectedStudent(student);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteClick = (student: ApiStudent) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      setDeleteSuccess(null);

      const response = await deleteStudent(studentToDelete.id);
      
      if (response.status) {
        setDeleteSuccess('Student deleted successfully');
        // Refresh the students list
        if (selectedClass) {
          await fetchStudents(selectedClass.id);
        }
        // Close the modal after a short delay
        setTimeout(() => {
          setIsDeleteModalOpen(false);
          setStudentToDelete(null);
        }, 1500);
      } else {
        setDeleteError(response.message || 'Failed to delete student');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      setDeleteError('Error deleting student. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setStudentToDelete(null);
    setDeleteError(null);
    setDeleteSuccess(null);
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Students</h1>

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
                  disabled={!selectedTerm || !selectedClass || isLoadingStudents}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingStudents ? 'Loading...' : 'Display'}
                </button>
              </div>
            </div>
          </div>

          {studentsError && (
            <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-md">
              {studentsError}
            </div>
          )}

          {showStudents && (
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
                      National ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students?.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.user.first_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.user.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.user.national_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                        <button
                          onClick={() => handleViewDetails(student)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(student)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Student Details Modal */}
          {isDetailsModalOpen && selectedStudent && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Student Details</h2>
                  <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">First Name</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.user.first_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Name</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.user.last_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">National ID</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.user.national_id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.user.phone}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.user.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Father's Name</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.father_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Father's Phone</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.father_phone}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Mother's Name</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.mother_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Mother's Phone</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedStudent.mother_phone}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {isDeleteModalOpen && studentToDelete && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Delete Student</h2>
                  <button 
                    onClick={handleDeleteCancel}
                    className="text-gray-400 hover:text-gray-500"
                    disabled={isDeleting}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {deleteError && (
                  <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-md">
                    {deleteError}
                  </div>
                )}

                {deleteSuccess && (
                  <div className="mb-4 p-4 bg-green-50 text-green-500 rounded-md">
                    {deleteSuccess}
                  </div>
                )}

                <p className="mb-6 text-gray-600">
                  Are you sure you want to delete {studentToDelete.user.first_name} {studentToDelete.user.last_name}? 
                  This action cannot be undone.
                </p>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}