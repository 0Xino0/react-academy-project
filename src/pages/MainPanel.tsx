import Navbar from '../components/Navbar';
import UserSidebar from '../components/UserSidebar';

export default function MainPanel() {

  const courses = [
    {
      id: 1,
      name: 'English 101',
      teacher: 'Dr. Eleanor Bennett',
      schedule: 'Mon/Wed 10:00 AM - 11:15 AM',
      capacity: '20/30'
    },
    {
      id: 2,
      name: 'History 202',
      teacher: 'Prof. Samuel Harper',
      schedule: 'Tue/Thu 1:00 PM - 2:15 PM',
      capacity: '15/25'
    },
    {
      id: 3,
      name: 'Math 150',
      teacher: 'Dr. Olivia Hayes',
      schedule: 'Mon/Wed/Fri 9:00 AM - 9:50 AM',
      capacity: '25/30'
    },
    {
      id: 4,
      name: 'Science 210',
      teacher: 'Prof. Ethan Foster',
      schedule: 'Tue/Thu 10:00 AM - 11:15 AM',
      capacity: '18/20'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <UserSidebar />

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Home</h1>
            <div className="text-sm text-gray-500">English Academy</div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Fall 2024</h2>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {course.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {course.teacher}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.schedule}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.capacity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}