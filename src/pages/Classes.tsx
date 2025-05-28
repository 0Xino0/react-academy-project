import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { PlusCircle, Pencil, Trash2, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import AdminSidebar from '../components/AdminSidebar';
import { getTerms, getClassesByTermId, getCourses, getTeachers, createClass, updateClass, deleteClass } from '../services/api';
import { Term } from '../types/Terms';
import { Class, ClassFormData } from '../types/classes';
import { Course } from '../types/Courses';
import { ApiTeacher } from '../types/teachers';
import toast from 'react-hot-toast';

interface ClassFormProps {
  formData: {
    name: string;
    course_id: string;
    teacher_id: string;
    term_id: string;
    start_date: string;
    end_date: string;
    capacity: string;
    tuition_fee: string;
    startRegistration_date: string;
    endRegistration_date: string;
  };
  setFormData: Dispatch<SetStateAction<ClassFormProps['formData']>>;
  terms: Term[];
  courses: Course[];
  teachers: ApiTeacher[];
  isSubmitting: boolean;
  formError: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const ClassForm: React.FC<ClassFormProps> = ({
  formData,
  setFormData,
  terms,
  courses,
  teachers,
  isSubmitting,
  formError,
  onSubmit,
  onCancel
}) => (
  <form className="space-y-4" onSubmit={onSubmit}>
    {formError && (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600">{formError}</p>
      </div>
    )}

    <div>
      <label className="block text-sm font-medium text-gray-700">Term</label>
      <select
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        value={formData.term_id}
        onChange={(e) => setFormData({ ...formData, term_id: e.target.value })}
        disabled={isSubmitting}
      >
        <option value="">Select a term</option>
        {terms.map(term => (
          <option key={term.id} value={term.id}>
            {term.season} {term.year}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Course</label>
      <select
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        value={formData.course_id}
        onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
        disabled={isSubmitting}
      >
        <option value="">Select a course</option>
        {courses.map(course => (
          <option key={course.id} value={course.id}>{course.title}</option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Teacher</label>
      <select
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        value={formData.teacher_id}
        onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
        disabled={isSubmitting}
      >
        <option value="">Select a teacher</option>
        {teachers.map(teacher => (
          <option key={teacher.id} value={teacher.id}>
            {`${teacher.user.first_name} ${teacher.user.last_name}`}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700">Class Name</label>
      <input
        type="text"
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        disabled={isSubmitting}
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Start Date</label>
        <input
          type="date"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">End Date</label>
        <input
          type="date"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={formData.end_date}
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          disabled={isSubmitting}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Capacity</label>
        <input
          type="number"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Tuition Fee</label>
        <input
          type="number"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={formData.tuition_fee}
          onChange={(e) => setFormData({ ...formData, tuition_fee: e.target.value })}
          disabled={isSubmitting}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Registration Start</label>
        <input
          type="date"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={formData.startRegistration_date}
          onChange={(e) => setFormData({ ...formData, startRegistration_date: e.target.value })}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Registration End</label>
        <input
          type="date"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={formData.endRegistration_date}
          onChange={(e) => setFormData({ ...formData, endRegistration_date: e.target.value })}
          disabled={isSubmitting}
        />
      </div>
    </div>

    <div className="flex justify-end space-x-3 mt-6">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        disabled={isSubmitting}
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Class'}
      </button>
    </div>
  </form>
);

export default function Classes() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    teacher_id: '',
    term_id: '',
    start_date: '',
    end_date: '',
    capacity: '',
    tuition_fee: '',
    startRegistration_date: '',
    endRegistration_date: ''
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);

  const fetchClasses = async () => {
    if (!selectedTerm) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await getClassesByTermId(selectedTerm.id);
      if (response.status === true) {
        setClasses(response.classes);
      } else {
        setError(response.message || 'Failed to fetch classes');
      }
    } catch (err) {
      setError('Failed to fetch classes. Please try again later.');
      console.error('Error fetching classes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch terms on component mount
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getTerms();
        if (response.status === true && response.terms.length > 0) {
          setTerms(response.terms);
          setSelectedTerm(response.terms[0]);
        }
      } catch (err) {
        setError('Failed to fetch terms. Please try again later.');
        console.error('Error fetching terms:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTerms();
  }, []);

  // Fetch courses and teachers when add modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (!isAddModalOpen) return;

      try {
        setIsLoading(true);
        setError(null);
        const [coursesResponse, teachersResponse] = await Promise.all([
          getCourses(),
          getTeachers()
        ]);

        if (coursesResponse.status === true) {
          setCourses(coursesResponse.data);
        }
        if (teachersResponse.status === true) {
          setTeachers(teachersResponse.data);
        }
      } catch (err) {
        setError('Failed to fetch required data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAddModalOpen]);

  // Fetch classes when selected term changes
  useEffect(() => {
    fetchClasses();
  }, [selectedTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      setFormError(null);

      // Validate required fields
      if (!formData.name || !formData.course_id || !formData.teacher_id || 
          !formData.term_id || !formData.start_date || !formData.end_date || 
          !formData.capacity || !formData.tuition_fee || 
          !formData.startRegistration_date || !formData.endRegistration_date) {
        setFormError('Please fill in all required fields');
        return;
      }

      const classData: ClassFormData = {
        name: formData.name,
        course_id: parseInt(formData.course_id),
        teacher_id: parseInt(formData.teacher_id),
        term_id: parseInt(formData.term_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        capacity: parseInt(formData.capacity),
        tuition_fee: parseFloat(formData.tuition_fee),
        startRegistration_date: formData.startRegistration_date,
        endRegistration_date: formData.endRegistration_date
      };

      if (isEditModalOpen && selectedClass) {
        // Update existing class
        const response = await updateClass(selectedClass.id, classData);
        if (response.status === true) {
          toast.success('Class updated successfully');
          await fetchClasses(); // Refresh classes list
          setIsEditModalOpen(false);
        } else {
          setFormError(response.message || 'Failed to update class');
        }
      } else {
        // Create new class
        const response = await createClass(classData);
        if (response.status === true) {
          toast.success('Class created successfully');
          // Reset form
          setFormData({
            name: '',
            course_id: '',
            teacher_id: '',
            term_id: '',
            start_date: '',
            end_date: '',
            capacity: '',
            tuition_fee: '',
            startRegistration_date: '',
            endRegistration_date: ''
          });
          
          // Close modal
          setIsAddModalOpen(false);
          
          // Refresh classes list
          await fetchClasses();
        } else {
          setFormError(response.message || 'Failed to create class');
        }
      }
    } catch (err) {
      setFormError('An error occurred. Please try again later.');
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (classItem: Class) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      course_id: classItem.course_id.toString(),
      teacher_id: classItem.teacher_id.toString(),
      term_id: classItem.term_id.toString(),
      start_date: classItem.start_date,
      end_date: classItem.end_date,
      capacity: classItem.capacity.toString(),
      tuition_fee: classItem.tuition_fee.toString(),
      startRegistration_date: classItem.startRegistration_date,
      endRegistration_date: classItem.endRegistration_date
    });
    setIsEditModalOpen(true);
  };

  const handleShowInfo = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsInfoModalOpen(true);
  };

  const handleDelete = async () => {
    if (!classToDelete || !selectedTerm) return;

    try {
      const response = await deleteClass(classToDelete.id, selectedTerm.id);
      if (response.status === true) {
        toast.success('Class deleted successfully');
        await fetchClasses(); // Refresh classes list
      } else {
        toast.error(response.message || 'Failed to delete class');
      }
    } catch (err) {
      toast.error('An error occurred while deleting the class');
      console.error('Error:', err);
    } finally {
      setIsDeleteModalOpen(false);
      setClassToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">Classes</h1>
              <select
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedTerm?.id?.toString() || ''}
                onChange={(e) => {
                  const term = terms.find(t => t.id === parseInt(e.target.value));
                  if (term) setSelectedTerm(term);
                }}
                disabled={isLoading}
              >
                {terms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.season} {term.year}
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => {
                setFormData({
                  name: '',
                  course_id: '',
                  teacher_id: '',
                  term_id: '',
                  start_date: '',
                  end_date: '',
                  capacity: '',
                  tuition_fee: '',
                  startRegistration_date: '',
                  endRegistration_date: ''
                });
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add Class
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tuition Fee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classes.map((classItem) => (
                    <tr key={classItem.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleShowInfo(classItem)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          {classItem.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {classItem.course.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {`${classItem.teacher.user.first_name} ${classItem.teacher.user.last_name}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {classItem.start_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {classItem.end_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${classItem.tuition_fee}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                        <button 
                          onClick={() => handleEdit(classItem)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => {
                            setClassToDelete(classItem);
                            setIsDeleteModalOpen(true);
                          }}
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
        </div>
      </div>

      {/* Add Class Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Class</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <ClassForm
              formData={formData}
              setFormData={setFormData}
              terms={terms}
              courses={courses}
              teachers={teachers}
              isSubmitting={isSubmitting}
              formError={formError}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsAddModalOpen(false);
                setFormError(null);
                setFormData({
                  name: '',
                  course_id: '',
                  teacher_id: '',
                  term_id: '',
                  start_date: '',
                  end_date: '',
                  capacity: '',
                  tuition_fee: '',
                  startRegistration_date: '',
                  endRegistration_date: ''
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {isEditModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Class</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <ClassForm
              formData={formData}
              setFormData={setFormData}
              terms={terms}
              courses={courses}
              teachers={teachers}
              isSubmitting={isSubmitting}
              formError={formError}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsEditModalOpen(false);
                setFormError(null);
                setFormData({
                  name: '',
                  course_id: '',
                  teacher_id: '',
                  term_id: '',
                  start_date: '',
                  end_date: '',
                  capacity: '',
                  tuition_fee: '',
                  startRegistration_date: '',
                  endRegistration_date: ''
                });
              }}
            />
          </div>
        </div>
      )}

      {/* Class Info Modal */}
      {isInfoModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Class Information</h2>
              <button onClick={() => setIsInfoModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Class Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedClass.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Course</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedClass.course.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Teacher</h3>
                  <p className="mt-1 text-sm text-gray-900">{`${selectedClass.teacher.user.first_name} ${selectedClass.teacher.user.last_name}`}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Capacity</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedClass.capacity} students</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedClass.start_date}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedClass.end_date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Registration Start</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedClass.startRegistration_date}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Registration End</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedClass.endRegistration_date}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Tuition Fee</h3>
                <p className="mt-1 text-sm text-gray-900">${selectedClass.tuition_fee}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Term</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {terms.find(t => t.id === selectedClass.term_id)?.season} {terms.find(t => t.id === selectedClass.term_id)?.year}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && classToDelete && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Delete Class</h2>
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setClassToDelete(null);
                }} 
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete the class "{classToDelete.name}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setClassToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}