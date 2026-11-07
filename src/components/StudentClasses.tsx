import { useState, useEffect, useId } from 'react';
import { Calendar, AlertTriangle } from 'lucide-react';
import { getTerms, getClassesForStudent, getSchedulesForStudent, cancelRegistration, getCancellationPolicy } from '../services/api';
import { usePersonalClasses } from '../hooks/usePersonalClasses';
import PersonalScheduleDialog from './PersonalScheduleDialog';

const studentApi = { getTerms, getClasses: getClassesForStudent, getSchedules: getSchedulesForStudent, cancelRegistration };

export default function StudentClasses() {
  const [requiresSettlement, setRequiresSettlement] = useState<boolean | null>(null);
  const { state, controller } = usePersonalClasses(studentApi);
  const { ownerId, selectedTerm, terms, classes, loadingTerms, selectedClass, isScheduleModalOpen } = state;
  const loading = state.loadingClasses;
  const error = state.termsError || state.classesError;
  const isDeleteModalOpen = selectedClass !== null;
  const deleteLoading = state.cancelling;
  const cancelTitleId = useId();

  useEffect(() => {
    let active = true;
    setRequiresSettlement(null);
    getCancellationPolicy().then(response => {
      if (active) setRequiresSettlement(response.policy.cancellation_requires_settlement);
    }).catch(() => {});
    return () => { active = false; };
  }, [ownerId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Classes</h2>
        
        {error && (
          <div role="alert" className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-4">
          <select
            className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={selectedTerm}
            aria-label="Term"
            disabled={loadingTerms || deleteLoading}
            onChange={(e) => controller.selectTerm(Number(e.target.value) || '')}
          >
            <option value="">Select Term</option>
            {terms.map(term => (
              <option key={term.id} value={term.id}>
                {term.season} {term.year}
              </option>
            ))}
          </select>
        </div>

        {loadingTerms && <p role="status" className="py-4">Loading terms...</p>}
        {loading ? (
          <div role="status" className="text-center py-4">Loading classes...</div>
        ) : !selectedTerm ? <p>Select a term to view classes.</p>
          : error ? null : !classes.length ? <p>No active enrollments in this term.</p> : (
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
                        onClick={() => controller.openCancellation(class_.id)}
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
          onClick={() => void controller.openSchedule()}
          disabled={!selectedTerm || isScheduleModalOpen || isDeleteModalOpen}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedule
        </button>
      </div>

      <PersonalScheduleDialog open={isScheduleModalOpen}
        term={terms.find(term => term.id === selectedTerm)} loading={state.loadingSchedules}
        error={state.schedulesError} schedules={state.schedules} onClose={controller.closeSchedule} />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby={cancelTitleId} aria-busy={deleteLoading} className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 id={cancelTitleId} className="text-lg font-medium">Cancel enrollment</h3>
            </div>
            
            <p className="text-gray-500 mb-4">
              Cancel enrollment in {selectedClass.name}? Enrollment, payment and grade records will be retained.
            </p>

            <p className="text-gray-600 mb-4">{requiresSettlement === true ? 'Full settlement is required before cancellation.' : requiresSettlement === false ? 'The unpaid balance will be waived. Previous payments remain in your history.' : 'The academy cancellation policy will be checked before confirming.'}</p>
            {state.cancellationError && <p role="alert" className="text-red-700 mb-4">{state.cancellationError}</p>}
            <div className="mt-6 flex space-x-3">
              <button
                onClick={controller.closeCancellation}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => void controller.confirmCancellation()}
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
