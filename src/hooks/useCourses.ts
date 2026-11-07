import { useEffect, useMemo, useSyncExternalStore } from 'react';
import toast from 'react-hot-toast';
import { getCourses, getCourse, createCourse, updateCourse, deleteCourse } from '../services/api';
import { createCoursesController } from '../services/coursesState';
import { useSession } from './useSession';

const coursesApi = { getCourses, getCourse, createCourse, updateCourse, deleteCourse };

export function useCourses() {
  const ownerId = useSession()?.user.id;
  const controller = useMemo(() => createCoursesController(coursesApi, ownerId, message => {
    toast.success(message);
  }), [ownerId]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => controller.start(), [controller]);
  return { state, controller };
}
