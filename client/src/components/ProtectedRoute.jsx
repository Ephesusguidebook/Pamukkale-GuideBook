import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../AdminAuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, checking } = useAdminAuth();

  if (checking) {
    return <div className="p-10 text-center text-gray-500">Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
