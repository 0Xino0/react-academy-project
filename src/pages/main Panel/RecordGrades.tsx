import { useState } from 'react';
import { Save } from 'lucide-react';
import Navbar from '../../components/Navbar';
import UserSidebar from '../../components/UserSidebar';
import toast from 'react-hot-toast';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  grade: number | null;
}

export default function RecordGrades() {
  const [students, setStudents] = useState<Student[]>([
    { id: 1, firstName: 'John', lastName: 'Doe', grade: null },
    { id: 2, firstName: 'Jane', lastName: 'Smith', grade: null },
    { id: 3, firstName: 'Michael', lastName: 'Johnson', grade: null },
    { id: 4, firstName: 'Emily', lastName: 'Brown', grade: null },
    { id: 5, firstName: 'William', lastName: 'Davis', grade: null },
  ]);

  const handleGradeChange = (studentId: number, grade: string) => {
    const numericGrade = parseFloat(grade);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 20) {
      return;
    }

    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId
          ? { ...student, grade: numericGrade }
          : student
      )
    );
  };

  const handleSubmit = () => {
    // Check if all students have grades
    if (students.some(student => student.grade === null)) {
      toast.error('Please enter grades for all students');
      return;
    }

    // Here you would typically make an API call to save the grades
    toast.success('Grades saved successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <UserSidebar />
        <div className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Record Grades</h1>
            <p className="mt-2 text-sm text-gray-600">Enter grades for each student (0-20)</p>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.firstName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={student.grade ?? ''}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Grades
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
