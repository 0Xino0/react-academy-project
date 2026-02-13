// src/pages/main Panel/MainGrades.tsx
import TeacherGrades from '../../components/TeacherGrades';
import StudentGrades from '../../components/StudentGrades';
import Navbar from '../../components/Navbar';
import UserSidebar from '../../components/UserSidebar';

const MainGrades = () => {
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <UserSidebar />
        <div className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Grades</h1>
          </div>

          {user?.role === 'teacher' && <TeacherGrades />}
          {user?.role === 'student' && <StudentGrades />}
        </div>
      </div>
    </div>
  );
};

export default MainGrades;