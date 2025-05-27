import { Users, CalendarDays, BookOpen, MessageSquare, Users2, Calendar, GraduationCap, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminSidebar() {
  const navigate = useNavigate();
  
  return (
    <div className="w-64 min-h-[calc(100vh-64px)] bg-white shadow-sm p-4">
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-500">Menu</h2>
      </div>
      
      <nav className="space-y-1">
        <button 
          onClick={() => navigate('/admin/teachers')}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <Users className="w-5 h-5 mr-3" />
          Teachers
        </button>
        <button 
          onClick={() => navigate('/admin/terms')}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <CalendarDays className="w-5 h-5 mr-3" />
          Terms
        </button>
        <button 
          onClick={() => navigate('/admin/courses')}
          className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <BookOpen className="w-5 h-5 mr-3" />
          Courses
        </button>
        <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50">
          <MessageSquare className="w-5 h-5 mr-3" />
          Classes
        </a>
        <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50">
          <Users2 className="w-5 h-5 mr-3" />
          Students
        </a>
        <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50">
          <Calendar className="w-5 h-5 mr-3" />
          Schedule
        </a>
        <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50">
          <GraduationCap className="w-5 h-5 mr-3" />
          Grades
        </a>
        <a href="#" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50">
          <DollarSign className="w-5 h-5 mr-3" />
          Financial
        </a>
      </nav>
    </div>
  );
}