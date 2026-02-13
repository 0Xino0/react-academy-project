import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import UserSidebar from '../../components/UserSidebar';
import TeacherClasses from '../../components/TeacherClasses';
import StudentClasses from '../../components/StudentClasses';

export default function MainClasses() {
  const [userRole, setUserRole] = useState<'teacher' | 'student' | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role === 'teacher' || user.role === 'student') {
        setUserRole(user.role);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <UserSidebar />
        <div className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Classes</h1>
          </div>

          {userRole === 'teacher' && <TeacherClasses />}
          {userRole === 'student' && <StudentClasses />}
        </div>
      </div>
    </div>
  );
}