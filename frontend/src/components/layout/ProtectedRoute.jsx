import { Navigate, useLocation } from 'react-router-dom';
import useStore from '../../store/useStore';

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
