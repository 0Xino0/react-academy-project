import { Calendar } from 'lucide-react';
import { getTerms, getClassesForTeacher, getSchedulesForTeacher } from '../services/api';
import { usePersonalClasses } from '../hooks/usePersonalClasses';
import PersonalScheduleDialog from './PersonalScheduleDialog';

const teacherApi = { getTerms, getClasses: getClassesForTeacher, getSchedules: getSchedulesForTeacher };

export default function TeacherClasses() {
  const { state, controller } = usePersonalClasses(teacherApi);
  const { selectedTerm, terms, classes, loadingTerms, isScheduleModalOpen } = state;
  const loading = state.loadingClasses;
  const error = state.termsError || state.classesError;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Teacher Classes</h2>
        
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
            disabled={loadingTerms}
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
          : error ? null : !classes.length ? <p>No assigned classes in this term.</p> : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
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
                      {class_.display?.start_date ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {class_.display?.end_date ?? '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {class_.capacity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={() => void controller.openSchedule()}
          disabled={!selectedTerm || isScheduleModalOpen}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedule
        </button>
      </div>

      <PersonalScheduleDialog open={isScheduleModalOpen}
        term={terms.find(term => term.id === selectedTerm)} loading={state.loadingSchedules}
        error={state.schedulesError} schedules={state.schedules} onClose={controller.closeSchedule} />
    </div>
  );
}
