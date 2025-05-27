import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => navigate(user?.role === 'manager' ? '/admin-dashboard' : '/main-panel')}
              className="text-xl font-semibold hover:text-gray-600 transition-colors"
            >
              English Academy
            </button>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User size={20} />
                <span className="font-medium">{user.firstName} {user.lastName}</span>
                <span className="text-sm text-gray-500 capitalize">({user.role})</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}