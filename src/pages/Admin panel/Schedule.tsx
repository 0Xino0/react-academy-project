import { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import { getTerms, getSchedules, getClassesByTermId, createSchedule, updateSchedule, deleteSchedule } from '../../services/api';
import { ApiSchedule, ApiScheduleFormData } from '../../types/Schedule';
import { Term } from '../../types/Terms';
import { Class } from '../../types/classes';

export default function Schedule() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [schedules, setSchedules] = useState<ApiSchedule[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ApiSchedule | null>(null);
  
  // Form data states
  const [formData, setFormData] = useState<ApiScheduleFormData>({
    day_of_week: 'monday',
    start_time: '00:00',
    end_time: '00:00'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Loading states
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Error states
  const [termsError, setTermsError] = useState<string | null>(null);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch terms on component mount
  useEffect(() => {
    fetchTerms();
  }, []);

  // Fetch schedules when term changes
  useEffect(() => {
    if (selectedTerm) {
      fetchSchedules(selectedTerm.id);
    } else {
      setSchedules([]);
    }
  }, [selectedTerm]);

  // Fetch classes when term changes in form
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
        if (response.terms && response.terms.length > 0) {
          setSelectedTerm(response.terms[0]);
        }
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

  const fetchSchedules = async (termId: number) => {
    try {
      setIsLoadingSchedules(true);
      setSchedulesError(null);
      const response = await getSchedules(termId);
      if (response.status) {
        setSchedules(response.schedules || []);
      } else {
        setSchedulesError('Failed to fetch schedules');
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setSchedulesError('Error loading schedules. Please try again.');
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const handleTermChange = (termId: string) => {
    const term = terms.find(t => t.id === parseInt(termId));
    setSelectedTerm(term || null);
    setSelectedClassId('');
    if (term) {
      fetchClasses(term.id);
      fetchSchedules(term.id);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatTimeForAPI = (time: string) => {
    // Convert from 24h format to 12h format with AM/PM
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTerm || !selectedClassId) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const response = await createSchedule(
        selectedTerm.id,
        parseInt(selectedClassId),
        {
          ...formData,
          start_time: formatTimeForAPI(formData.start_time),
          end_time: formatTimeForAPI(formData.end_time)
        }
      );

      if (response.status) {
        setIsCreateModalOpen(false);
        setFormData({
          day_of_week: 'monday',
          start_time: '00:00',
          end_time: '00:00'
        });
        setSelectedClassId('');
        fetchSchedules(selectedTerm.id);
      } else {
        setSubmitError(response.message || 'Failed to create schedule');
      }
    } catch (err) {
      console.error('Error creating schedule:', err);
      setSubmitError('Error creating schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (schedule: ApiSchedule) => {
    setSelectedSchedule(schedule);
    
    // Convert from 12h format to 24h format
    const convertTo24Hour = (time: string) => {
      const [timePart, period] = time.split(' ');
      const [hours, minutes] = timePart.split(':');
      let hour = parseInt(hours);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return `${hour.toString().padStart(2, '0')}:${minutes}`;
    };
    
    setFormData({
      day_of_week: schedule.day_of_week,
      start_time: convertTo24Hour(schedule.start_time),
      end_time: convertTo24Hour(schedule.end_time)
    });
    setSelectedClassId(schedule.class_id.toString());
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !selectedTerm || !selectedClassId) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await updateSchedule(
        selectedTerm.id,
        parseInt(selectedClassId),
        selectedSchedule.id,
        {
          ...formData,
          start_time: formatTimeForAPI(formData.start_time),
          end_time: formatTimeForAPI(formData.end_time)
        }
      );

      if (response.status) {
        setIsEditModalOpen(false);
        setSelectedSchedule(null);
        fetchSchedules(selectedTerm.id);
      } else {
        setSubmitError(response.message || 'Failed to update schedule');
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      setSubmitError('Error updating schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (schedule: ApiSchedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSchedule || !selectedTerm || !selectedClassId) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);
      const response = await deleteSchedule(
        selectedTerm.id,
        parseInt(selectedClassId),
        selectedSchedule.id
      );

      if (response.status) {
        setIsDeleteModalOpen(false);
        setSelectedSchedule(null);
        fetchSchedules(selectedTerm.id);
      } else {
        setDeleteError(response.message || 'Failed to delete schedule');
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setDeleteError('Error deleting schedule. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSelectedSchedule(null);
    setDeleteError(null);
  };

  const formatDayOfWeek = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const ScheduleForm = ({ isEdit = false }) => (
    <form onSubmit={isEdit ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Term</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={selectedTerm?.id || ''}
          onChange={(e) => handleTermChange(e.target.value)}
          disabled={isLoadingTerms || isSubmitting}
        >
          <option value="">Select a term</option>
          {terms.map(term => (
            <option key={term.id} value={term.id}>
              {term.season} {term.year}
            </option>
          ))}
        </select>
        {isLoadingTerms && <p className="mt-1 text-sm text-gray-500">Loading terms...</p>}
        {termsError && <p className="mt-1 text-sm text-red-500">{termsError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Class</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={selectedClassId}
          onChange={(e) => handleClassChange(e.target.value)}
          disabled={!selectedTerm || isLoadingClasses || isSubmitting}
        >
          <option value="">Select a class</option>
          {classes.map(classItem => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
            </option>
          ))}
        </select>
        {isLoadingClasses && <p className="mt-1 text-sm text-gray-500">Loading classes...</p>}
        {classesError && <p className="mt-1 text-sm text-red-500">{classesError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Day of Week</label>
        <select
          name="day_of_week"
          value={formData.day_of_week}
          onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          disabled={isSubmitting}
        >
          <option value="monday">Monday</option>
          <option value="tuesday">Tuesday</option>
          <option value="wednesday">Wednesday</option>
          <option value="thursday">Thursday</option>
          <option value="friday">Friday</option>
          <option value="saturday">Saturday</option>
          <option value="sunday">Sunday</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Start Time</label>
        <input
          type="time"
          name="start_time"
          value={formData.start_time}
          onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">End Time</label>
        <input
          type="time"
          name="end_time"
          value={formData.end_time}
          onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          disabled={isSubmitting}
          required
        />
      </div>

      {submitError && (
        <div className="text-red-500 text-sm">{submitError}</div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedSchedule(null);
            setFormData({
              day_of_week: 'monday',
              start_time: '00:00',
              end_time: '00:00'
            });
            setSelectedClassId('');
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>
              <select
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedTerm?.id || ''}
                onChange={(e) => handleTermChange(e.target.value)}
                disabled={isLoadingTerms}
              >
                <option value="">Select Term</option>
                {terms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.season} {term.year}
                  </option>
                ))}
              </select>
              {isLoadingTerms && <p className="text-sm text-gray-500">Loading terms...</p>}
              {termsError && <p className="text-sm text-red-500">{termsError}</p>}
            </div>
            <button 
              onClick={() => {
                setFormData({
                  day_of_week: 'monday',
                  start_time: '00:00',
                  end_time: '00:00'
                });
                setSelectedClassId('');
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Create Schedule
            </button>
          </div>

          {schedulesError && (
            <div className="mb-4 p-4 bg-red-50 text-red-500 rounded-md">
              {schedulesError}
            </div>
          )}

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {isLoadingSchedules ? (
              <div className="p-4 text-center text-gray-500">
                Loading schedules...
              </div>
            ) : schedules.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No schedules found for the selected term.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day of the Week
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {schedule.class.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {formatDayOfWeek(schedule.day_of_week)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(schedule.start_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(schedule.end_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                        <button 
                          onClick={() => handleEdit(schedule)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(schedule)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Schedule Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Schedule</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
                disabled={isSubmitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <ScheduleForm />
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {isEditModalOpen && selectedSchedule && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Schedule</h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
                disabled={isSubmitting}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <ScheduleForm isEdit />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedSchedule && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Delete Schedule</h2>
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

            <p className="mb-6 text-gray-600">
              Are you sure you want to delete the schedule for {selectedSchedule.class.name} on {formatDayOfWeek(selectedSchedule.day_of_week)}? 
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
  );
}