import { useState } from 'react';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import AdminSidebar from '../components/AdminSidebar';

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
}

export default function Teachers() {
  const [teachers] = useState<Teacher[]>([
    { id: 1, first_name: 'Emily', last_name: 'Johnson', phone: '555-1234' },
    { id: 2, first_name: 'Michael', last_name: 'Smith', phone: '555-5678' },
    { id: 3, first_name: 'Sarah', last_name: 'Williams', phone: '555-9012' },
    { id: 4, first_name: 'David', last_name: 'Brown', phone: '555-3456' },
    { id: 5, first_name: 'Jessica', last_name: 'Davis', phone: '555-7890' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Teachers</h1>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <PlusCircle className="w-5 h-5 mr-2" />
              Add Teacher
            </button>
          </div>

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Surname
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
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
                      {teacher.first_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {teacher.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}