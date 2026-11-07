import { useId } from 'react';
import { X } from 'lucide-react';
import type { ApiSchedule } from '../types/Schedule';
import type { Term } from '../types/Terms';

interface Props {
  open: boolean;
  term?: Term;
  loading: boolean;
  error: string | null;
  schedules: ApiSchedule[];
  onClose(): void;
}

export default function PersonalScheduleDialog({ open, term, loading, error, schedules, onClose }: Props) {
  const titleId = useId();
  if (!open) return null;
  return <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
    <section role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={loading}
      className="bg-white rounded-lg max-w-2xl w-full p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 id={titleId} className="text-lg font-medium">Class Schedule{term ? ' — ' + term.season + ' ' + term.year : ''}</h3>
        <button type="button" onClick={onClose} aria-label="Close schedule" className="text-gray-400 hover:text-gray-500">
          <X className="w-6 h-6" />
        </button>
      </div>
      {loading ? <p role="status" className="py-4">Loading schedule...</p>
        : error ? <p role="alert" className="py-4 text-red-700">{error}</p>
        : !schedules.length ? <p className="py-4">No scheduled sessions in this term.</p>
        : <div className="overflow-auto"><table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr>{['Day', 'Start Time', 'End Time', 'Class'].map(label =>
            <th key={label} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</th>)}</tr></thead>
          <tbody className="bg-white divide-y divide-gray-200">{schedules.map(schedule =>
            <tr key={schedule.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.display?.day_of_week ?? '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.display?.start_time ?? '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.display?.end_time ?? '—'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.class.name}</td>
            </tr>)}</tbody>
        </table></div>}
      <button type="button" onClick={onClose}
        className="mt-6 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Close</button>
    </section>
  </div>;
}
