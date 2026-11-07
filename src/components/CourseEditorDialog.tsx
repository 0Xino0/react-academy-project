import { useId } from 'react';
import { X } from 'lucide-react';
import type { CourseFormData } from '../types/Courses';

interface Props {
  mode: 'create' | 'edit';
  form: CourseFormData;
  busy: boolean;
  error: string | null;
  onField(field: keyof CourseFormData, value: string): void;
  onClose(): void;
  onSubmit(): void;
}

export default function CourseEditorDialog({ mode, form, busy, error, onField, onClose, onSubmit }: Props) {
  const titleId = useId();
  const nameId = useId();
  const levelId = useId();
  const descriptionId = useId();
  return <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
    <section role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} className="bg-white rounded-lg max-w-md w-full p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 id={titleId} className="text-xl font-semibold">{mode === 'create' ? 'Add New Course' : 'Edit Course'}</h2>
        <button type="button" disabled={busy} onClick={onClose} aria-label="Close course form" className="text-gray-400 hover:text-gray-500">
          <X className="w-6 h-6" />
        </button>
      </div>
      <form onSubmit={event => { event.preventDefault(); onSubmit(); }} className="space-y-4">
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div><label htmlFor={nameId} className="block text-sm font-medium text-gray-700">Name</label>
          <input id={nameId} type="text" required maxLength={255} disabled={busy} value={form.title}
            onChange={event => onField('title', event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" /></div>
        <div><label htmlFor={levelId} className="block text-sm font-medium text-gray-700">Level</label>
          <select id={levelId} required disabled={busy} value={form.level} onChange={event => onField('level', event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            <option value="">Select Level</option><option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option><option value="Advanced">Advanced</option>
          </select></div>
        <div><label htmlFor={descriptionId} className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id={descriptionId} rows={4} disabled={busy} value={form.description}
            onChange={event => onField('description', event.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" /></div>
        <div className="flex justify-end space-x-3 mt-6">
          <button type="button" disabled={busy} onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={busy} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            {busy ? 'Saving...' : mode === 'create' ? 'Add Course' : 'Save Changes'}</button>
        </div>
      </form>
    </section>
  </div>;
}
