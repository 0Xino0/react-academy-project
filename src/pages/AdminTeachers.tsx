import { useState, useEffect } from 'react';
import { PlusCircle, Pencil, Trash2, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import AdminSidebar from '../components/AdminSidebar';
import { useNavigate } from 'react-router-dom';
import { getTeachers, updateTeacherSalary, deleteTeacher } from '../services/api';
import { ApiTeacher } from '../types/teachers';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Teachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<ApiTeacher | null>(null);
  const [salary, setSalary] = useState('');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await getTeachers();
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers list');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (teacher: ApiTeacher) => {
    setSelectedTeacher(teacher);
    setSalary(teacher.salary?.toString() || '');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (teacher: ApiTeacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTeacher(null);
    setSalary('');
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTeacher(null);
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;

    setDeleting(true);
    try {
      const response = await deleteTeacher(selectedTeacher.id);

      if (response.status) {
        toast.success('Teacher deleted successfully');
        // Remove the teacher from the list
        setTeachers(teachers.filter(teacher => teacher.id !== selectedTeacher.id));
        handleCloseDeleteModal();
      } else {
        toast.error(response.message || 'Failed to delete teacher');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error('Unauthorized: Please login again');
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to delete teachers');
        } else if (error.response?.status === 404) {
          toast.error('Teacher not found');
        } else if (error.response?.status && error.response.status >= 500) {
          toast.error('Server error. Please try again later');
        } else {
          toast.error(error.response?.data?.message || 'Failed to delete teacher');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
      console.error('Delete teacher error:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    setUpdating(true);
    try {
      const response = await updateTeacherSalary(selectedTeacher.id, {
        salary: Number(salary)
      });

      if (response.status) {
        toast.success('Teacher salary updated successfully');
        // Update the teacher in the list
        setTeachers(teachers.map(teacher => 
          teacher.id === selectedTeacher.id 
            ? { ...teacher, salary: Number(salary) }
            : teacher
        ));
        handleCloseModal();
      } else {
        toast.error(response.message || 'Failed to update salary');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Handle validation errors
        if (error.response?.status === 422) {
          const validationErrors = error.response.data?.errors;
          if (validationErrors) {
            Object.entries(validationErrors).forEach(([field, messages]) => {
              if (Array.isArray(messages)) {
                messages.forEach(message => {
                  toast.error(`${field}: ${message}`);
                });
              }
            });
          } else {
            toast.error(error.response.data?.message || 'Validation error');
          }
        } else if (error.response?.status === 401) {
          toast.error('Unauthorized: Please login again');
        } else if (error.response?.status === 403) {
          toast.error('You do not have permission to update teacher salary');
        } else if (error.response?.status && error.response.status >= 500) {
          toast.error('Server error. Please try again later');
        } else {
          toast.error(error.response?.data?.message || 'Failed to update salary');
        }
      } else {
        toast.error('An unexpected error occurred');
      }
      console.error('Update salary error:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Teachers</h1>
            <button 
              onClick={() => navigate('/admin/teachers/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add Teacher
            </button>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-4 text-center">Loading...</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FirstName
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LastName
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salary
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {teacher.user.first_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {teacher.user.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {teacher.user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {teacher.user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {teacher.salary ? `$${teacher.salary}` : 'undefined'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                        <button 
                          onClick={() => handleEditClick(teacher)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(teacher)}
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

      {/* Edit Salary Modal */}
      {isModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Update Salary for {selectedTeacher.user.first_name} {selectedTeacher.user.last_name}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSalary} className="space-y-4">
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                  Salary ($)
                </label>
                <input
                  type="input"
                  id="salary"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  className="mt-1 block w-full rounded-md border-2 border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 sm:text-sm placeholder-gray-400"
                  required
                  min="0"
                  step="0.01"
                  placeholder="Enter salary amount"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Delete Teacher
              </h3>
              <button
                onClick={handleCloseDeleteModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete {selectedTeacher.user.first_name} {selectedTeacher.user.last_name}? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeacher}
                disabled={deleting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}