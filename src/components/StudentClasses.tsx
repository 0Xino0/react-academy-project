import { useState, useEffect } from 'react';
import { Calendar, X, AlertTriangle } from 'lucide-react';
import { Term } from '../types/Terms';
import { ClassForStudent } from '../types/classes';
import { ApiSchedule } from '../types/Schedule';
import { enrollmentError } from '../services/registrations';
import { getTerms, getClassesForStudent, getSchedulesForStudent, cancelRegistration, getCancellationPolicy } from '../services/api';

export default function StudentClasses() {
  const [requiresSettlement, setRequiresSettlement] = useState<boolean | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<number | ''>('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassForStudent | null>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<ClassForStudent[]>([]);
  const [schedules, setSchedules] = useState<ApiSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch terms when component mounts
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await getTerms();
        if (response.status) {
          setTerms(response.terms);
          setError(null);
        } else {
          setError(response.message);
        }
      } catch (error) {
        setError('Failed to fetch terms. Please try again later.');
        console.error('Error fetching terms:', error);
      }
    };
    fetchTerms();
    let active = true;
    getCancellationPolicy().then(response => { if (active) setRequiresSettlement(response.policy.cancellation_requires_settlement); }).catch(() => {});
    return () => { active = false; };
  }, []);

  // Fetch classes when term changes
  useEffect(() => {
    let active = true;
    setClasses([]);
    setSchedules([]);
    setSelectedClass(null);
    setIsDeleteModalOpen(false);
    setIsScheduleModalOpen(false);
    setError(null);
    const fetchClasses = async () => {
      if (!selectedTerm) { setLoading(false); return; }
      
      setLoading(true);
      setError(null);
      try {
        const response = await getClassesForStudent(selectedTerm);
        if (!active) return;
        if (response.status) {
          setClasses(response.classes);
        } else {
          setError(response.message);
        }
      } catch (error) {
        if (!active) return;
        setError('Failed to fetch classes. Please try again later.');
        console.error('Error fetching classes:', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchClasses();
    return () => { active = false; };
  }, [selectedTerm]);

  // Fetch schedules when modal opens
  const fetchSchedules = async () => {
    if (!selectedTerm) return;
    
    setError(null);
    try {
      const response = await getSchedulesForStudent(selectedTerm);
      if (response.status) {
        setSchedules(response.schedules);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Failed to fetch schedules. Please try again later.');
      console.error('Error fetching schedules:', error);
    }
  };

  const handleScheduleModalOpen = async () => {
    await fetchSchedules();
    setIsScheduleModalOpen(true);
  };

  const handleDeleteClick = (class_: ClassForStudent) => {
    setError(null);
    setSelectedClass(class_);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClass) return;

    // Get the first registration from the registrations array
    const registration = selectedClass.registrations[0];
    // console.log('Registration:', registration);
    
    if (!registration) {
      setError('Registration information not found');
      return;
    }

    setDeleteLoading(true);
    setError(null);
    try {
      const response = await cancelRegistration(selectedClass);
      
      if (response.status) {
        // Remove the class from the list
        setClasses(current => current.filter(c => c.id !== selectedClass.id));
        setSchedules([]);
        setIsDeleteModalOpen(false);
        setSelectedClass(null);
      } else {
        setError(response.message || 'Failed to remove class');
      }
    } catch (error) {
      setError(enrollmentError(error, 'Enrollment could not be cancelled.'));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Classes</h2>
        
        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-4">
          <select
            className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(Number(e.target.value) || '')}
          >
            <option value="">Select Term</option>
            {terms.map(term => (
              <option key={term.id} value={term.id}>
                {term.season} {term.year}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tuition
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes.map((class_) => (
                  <tr key={class_.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {class_.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {class_.teacher ? `${class_.teacher.user.first_name} ${class_.teacher.user.last_name}` : 'Unavailable teacher'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${class_.tuition_fee}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {class_.display?.start_date ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {class_.display?.end_date ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => handleDeleteClick(class_)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel enrollment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={handleScheduleModalOpen}
          disabled={!selectedTerm}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedule
        </button>
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Class Schedule</h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {schedule.display?.day_of_week ?? '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {schedule.display?.start_time ?? '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {schedule.display?.end_time ?? '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {schedule.class.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-medium">Cancel enrollment</h3>
            </div>
            
            <p className="text-gray-500 mb-4">
              Cancel enrollment in {selectedClass.name}? Enrollment, payment and grade records will be retained.
            </p>

            <p className="text-gray-600 mb-4">{requiresSettlement === true ? 'Full settlement is required before cancellation.' : requiresSettlement === false ? 'The unpaid balance will be waived. Previous payments remain in your history.' : 'The academy cancellation policy will be checked before confirming.'}</p>
            {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedClass(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Cancelling...' : 'Confirm cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
