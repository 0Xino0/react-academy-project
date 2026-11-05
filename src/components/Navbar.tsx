import { LogOut, User } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useSession } from '../hooks/useSession';
import { sessionStore } from '../services/session';
import { logout } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const user = useSession()?.user;
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      toast.error('Signed out on this device. Server sign-out could not be confirmed.');
    } finally {
      if (!sessionStore.getSnapshot()) navigate('/login', { replace: true });
      setLoggingOut(false);
    }
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
                disabled={loggingOut}
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
