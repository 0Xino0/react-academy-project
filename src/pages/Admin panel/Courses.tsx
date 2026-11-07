import { useId } from 'react';
import { PlusCircle, Pencil, Trash2, X } from 'lucide-react';
import Navbar from '../../components/Navbar';
import AdminSidebar from '../../components/AdminSidebar';
import CourseEditorDialog from '../../components/CourseEditorDialog';
import { useCourses } from '../../hooks/useCourses';

export default function Courses() {
  const { state, controller } = useCourses();
  const { courses, loading, listError, saving, deleting } = state;
  const busy = saving || deleting;
  const detailTitleId = useId();
  const deleteTitleId = useId();

  return <div className="min-h-screen bg-gray-50">
    <Navbar />
    <div className="flex"><AdminSidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Courses</h1>
          <button type="button" onClick={controller.openCreate}
            disabled={loading || !!listError || busy || state.editor !== null || state.toDelete !== null}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
            <PlusCircle className="w-5 h-5 mr-2" />Add Course
          </button>
        </div>
        {loading ? <p role="status">Loading courses...</p>
          : listError ? <div><p role="alert" className="mb-4 text-red-700">{listError}</p>
            <button type="button" onClick={() => void controller.reload()} className="underline">Retry</button></div>
          : courses.length === 0 ? <p>No courses found</p>
          : <div className="bg-white shadow-sm rounded-lg overflow-hidden"><table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>{['Name', 'Level', 'Description', 'Actions'].map(label =>
              <th key={label} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</th>)}</tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">{courses.map(course =>
              <tr key={course.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <button type="button" disabled={busy} onClick={() => void controller.openDetails(course.id)} className="text-indigo-600 hover:text-indigo-900">{course.title}</button></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{course.level}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{course.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                  <button type="button" aria-label={'Edit ' + course.title} disabled={busy} onClick={() => controller.openEdit(course.id)} className="text-indigo-600 hover:text-indigo-900"><Pencil className="w-5 h-5" /></button>
                  <button type="button" aria-label={'Delete ' + course.title} disabled={busy} onClick={() => controller.openDelete(course.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-5 h-5" /></button>
                </td>
              </tr>)}</tbody>
          </table></div>}
      </main>
    </div>

    {state.editor && <CourseEditorDialog mode={state.editor} form={state.form} busy={saving} error={state.formError}
      onField={controller.setField} onClose={controller.closeEditor} onSubmit={() => void controller.save()} />}

    {state.toDelete && <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <section role="dialog" aria-modal="true" aria-labelledby={deleteTitleId} aria-busy={deleting} className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 id={deleteTitleId} className="text-xl font-semibold">Delete Course</h2>
          <button type="button" disabled={deleting} onClick={controller.closeDelete} aria-label="Close course deletion" className="text-gray-400 hover:text-gray-500"><X className="w-6 h-6" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          حذف دوره «{state.toDelete.title}» به‌صورت منطقی، تمام کلاس‌ها و برنامه‌های وابسته را از مدار خارج و ثبت‌نام‌های فعال آن‌ها را لغو می‌کند. مانده همان کلاس‌ها بخشوده می‌شود و اصل مبالغ، پرداخت‌ها و نمره‌ها در سوابق باقی می‌مانند.
        </p>
        {state.deleteError && <p role="alert" className="mb-4 text-red-700">{state.deleteError}</p>}
        <div className="flex justify-end space-x-3">
          <button type="button" disabled={deleting} onClick={controller.closeDelete} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="button" disabled={deleting} onClick={() => void controller.confirmDelete()} className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">{deleting ? 'Deleting...' : 'Delete'}</button>
        </div>
      </section>
    </div>}

    {state.detailOpen && <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <section role="dialog" aria-modal="true" aria-labelledby={detailTitleId} aria-busy={state.loadingDetails} className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 id={detailTitleId} className="text-xl font-semibold">Course Details — {state.detail?.title ?? state.detailTarget?.title}</h2>
          <button type="button" onClick={controller.closeDetails} aria-label="Close course details" className="text-gray-400 hover:text-gray-500"><X className="w-6 h-6" /></button>
        </div>
        {state.loadingDetails ? <p role="status">Loading course details...</p>
          : state.detailError ? <p role="alert" className="text-red-700">{state.detailError}</p>
          : state.detail && <div className="space-y-2">
            <p><strong>Title:</strong> {state.detail.title}</p><p><strong>Level:</strong> {state.detail.level}</p>
            <p><strong>Description:</strong> {state.detail.description ?? '—'}</p>
          </div>}
        <button type="button" onClick={controller.closeDetails} className="mt-6 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Close</button>
      </section>
    </div>}
  </div>;
}
