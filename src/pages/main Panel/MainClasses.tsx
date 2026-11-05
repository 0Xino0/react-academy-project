import { useSession } from '../../hooks/useSession';
import Navbar from '../../components/Navbar';
import UserSidebar from '../../components/UserSidebar';
import TeacherClasses from '../../components/TeacherClasses';
import StudentClasses from '../../components/StudentClasses';

export default function MainClasses() {
  const userRole = useSession()?.user.role;

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
