import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('manager' | 'student' | 'teacher')[];
}

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const location = useLocation();
  const session = useSession();

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
