import { Home, BookOpen, GraduationCap, DollarSign } from 'lucide-react';

export default function UserSidebar() {
  // Get user from localStorage
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const isStudent = user?.role === 'student';

  return (
    <div className="w-64 min-h-[calc(100vh-64px)] bg-white shadow-sm p-4">
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-500">Menu</h2>
      </div>
      
      <nav className="space-y-1">
        <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-900 rounded-lg bg-gray-100">
          <Home className="w-5 h-5 mr-3" />
          Home
        </a>
        <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50">
          <BookOpen className="w-5 h-5 mr-3" />
          Classes
        </a>
        <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50">
          <GraduationCap className="w-5 h-5 mr-3" />
          Grades
        </a>
        {isStudent && (
          <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50">
            <DollarSign className="w-5 h-5 mr-3" />
            Payment
          </a>
        )}
      </nav>
    </div>
  );
}