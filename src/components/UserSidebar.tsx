import { Home, BookOpen, GraduationCap, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserSidebar() {
  const navigate = useNavigate();
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
      <button 
          onClick={() => navigate('/main-panel')}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <Home className="w-5 h-5 mr-3" />
          Home
        </button> 
        <button 
          onClick={() => navigate('/classes')}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <BookOpen className="w-5 h-5 mr-3" />
          Classes
        </button>
        <button 
          onClick={() => navigate('/grades')}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <GraduationCap className="w-5 h-5 mr-3" />
          Grades
        </button>
        {isStudent && (
          <button 
            onClick={() => navigate('/payment')}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
          >
            <DollarSign className="w-5 h-5 mr-3" />
            Payment
          </button>
        )}
      </nav>
    </div>
  );
}