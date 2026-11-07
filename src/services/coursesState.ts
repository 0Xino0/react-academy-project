import type { Course, CourseFormData } from '../types/Courses.ts';
import type { createCoursesApi } from './courses.ts';
import { academicErrorMessage } from './academics.ts';

type CoursesApi = ReturnType<typeof createCoursesApi>;
interface CoursesState {
  ownerId?: string;
  courses: Course[];
  loading: boolean;
  listError: string | null;
  editor: 'create' | 'edit' | null;
  editorCourse: Course | null;
  form: CourseFormData;
  saving: boolean;
  formError: string | null;
  detailOpen: boolean;
  detailTarget: Course | null;
  detail: Course | null;
  loadingDetails: boolean;
  detailError: string | null;
  toDelete: Course | null;
  deleting: boolean;
  deleteError: string | null;
}
const emptyForm = (): CourseFormData => ({ title: '', level: '', description: '' });
const initialState = (ownerId?: string): CoursesState => ({
  ownerId, courses: [], loading: true, listError: null,
  editor: null, editorCourse: null, form: emptyForm(), saving: false, formError: null,
  detailOpen: false, detailTarget: null, detail: null, loadingDetails: false, detailError: null,
  toDelete: null, deleting: false, deleteError: null,
});

export function createCoursesController(api: CoursesApi, ownerId?: string, onSuccess?: (message: string) => void) {
  let state = initialState(ownerId);
  let active = false;
  let lifetime = 0;
  let listRequest = 0;
  let detailRequest = 0;
  const listeners = new Set<() => void>();
  const update = (patch: Partial<CoursesState>) => {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  };
  const current = (version: number) => active && version === lifetime;
  const busy = () => state.saving || state.deleting;
  const canSelect = () => active && !state.loading && !state.listError && !busy() && !state.editor && !state.toDelete;
  const resetDetails = () => {
    detailRequest += 1;
    return { detailOpen: false, detailTarget: null, detail: null, loadingDetails: false, detailError: null };
  };

  async function loadCourses() {
    const version = lifetime;
    const request = ++listRequest;
    const isCurrent = () => current(version) && request === listRequest;
    update({ loading: true, listError: null, courses: [], ...resetDetails() });
    try {
      const response = await api.getCourses();
      if (!isCurrent()) return;
      if (!response.status) throw new Error(response.message || 'Could not load courses.');
      update({ courses: response.data });
    } catch (error) {
      if (isCurrent()) update({ listError: academicErrorMessage(error, 'Could not load courses.') });
    } finally {
      if (isCurrent()) update({ loading: false });
    }
  }

  async function openDetails(id: number) {
    if (!canSelect() || (state.detailOpen && state.detailTarget?.id === id)) return;
    const target = state.courses.find(row => row.id === id);
    if (!target) return;
    const version = lifetime;
    const request = ++detailRequest;
    const isCurrent = () => current(version) && request === detailRequest
      && state.detailOpen && state.detailTarget?.id === id;
    update({ detailOpen: true, detailTarget: target, detail: null, loadingDetails: true, detailError: null });
    try {
      const response = await api.getCourse(id);
      if (!isCurrent()) return;
      if (!response.status) throw new Error(response.message || 'Could not load course details.');
      update({ detail: response.data });
    } catch (error) {
      if (isCurrent()) update({ detailError: academicErrorMessage(error, 'Could not load course details.') });
    } finally {
      if (isCurrent()) update({ loadingDetails: false });
    }
  }

  async function save() {
    const kind = state.editor;
    const selected = state.editorCourse;
    if (!active || !kind || busy() || (kind === 'edit' && !selected)) return;
    const version = lifetime;
    const payload = { ...state.form };
    update({ saving: true, formError: null });
    let notice: string | null = null;
    try {
      const response = kind === 'edit' && selected
        ? await api.updateCourse(selected.id, payload)
        : await api.createCourse(payload);
      if (!current(version)) return;
      if (!response.status) throw new Error(response.message || 'The course could not be saved.');
      listRequest += 1;
      update({
        courses: kind === 'edit' && selected
          ? state.courses.map(row => row.id === selected.id ? response.data : row)
          : [...state.courses, response.data],
        loading: false, editor: null, editorCourse: null, form: emptyForm(),
        saving: false, formError: null, ...resetDetails(),
      });
      notice = kind === 'edit' ? 'Course updated successfully' : 'Course added successfully';
    } catch (error) {
      if (current(version)) update({ formError: academicErrorMessage(error, 'The course could not be saved.') });
    } finally {
      if (current(version) && state.saving) update({ saving: false });
    }
    if (notice && current(version)) onSuccess?.(notice);
  }

  async function confirmDelete() {
    const selected = state.toDelete;
    if (!active || !selected || busy()) return;
    const version = lifetime;
    update({ deleting: true, deleteError: null });
    let confirmed = false;
    try {
      const response = await api.deleteCourse(selected.id);
      if (!current(version)) return;
      if (!response.status) throw new Error(response.message || 'Could not archive the course.');
      listRequest += 1;
      update({
        courses: state.courses.filter(row => row.id !== selected.id),
        loading: false, toDelete: null, deleting: false, deleteError: null, ...resetDetails(),
      });
      confirmed = true;
    } catch (error) {
      if (current(version)) update({ deleteError: academicErrorMessage(error, 'Could not archive the course.') });
    } finally {
      if (current(version) && state.deleting) update({ deleting: false });
    }
    if (confirmed && current(version)) onSuccess?.('Course and its classes archived.');
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start() {
      active = true;
      const version = ++lifetime;
      state = initialState(ownerId);
      listeners.forEach(listener => listener());
      void loadCourses();
      return () => {
        if (version !== lifetime) return;
        active = false;
        lifetime += 1;
        listRequest += 1;
        detailRequest += 1;
      };
    },
    reload() {
      if (active && !state.loading && !busy() && !state.editor && !state.toDelete) return loadCourses();
    },
    openDetails,
    closeDetails() { if (active) update(resetDetails()); },
    openCreate() {
      if (canSelect()) update({ editor: 'create', editorCourse: null, form: emptyForm(), formError: null, ...resetDetails() });
    },
    openEdit(id: number) {
      if (!canSelect()) return;
      const course = state.courses.find(row => row.id === id);
      if (course) update({
        editor: 'edit', editorCourse: course,
        form: { title: course.title, level: course.level, description: course.description ?? '' },
        formError: null, ...resetDetails(),
      });
    },
    setField(field: keyof CourseFormData, value: string) {
      if (active && state.editor && !busy()) update({ form: { ...state.form, [field]: value }, formError: null });
    },
    closeEditor() {
      if (active && !busy()) update({ editor: null, editorCourse: null, form: emptyForm(), formError: null });
    },
    save,
    openDelete(id: number) {
      if (!canSelect()) return;
      const course = state.courses.find(row => row.id === id);
      if (course) update({ toDelete: course, deleteError: null, ...resetDetails() });
    },
    closeDelete() {
      if (active && !busy()) update({ toDelete: null, deleteError: null });
    },
    confirmDelete,
  };
}
