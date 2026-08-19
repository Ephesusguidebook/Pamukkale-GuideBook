import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../AdminAuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, checking } = useAdminAuth();

  if (checking) {
    return <div className="p-10 text-center text-gray-500">Yükleniyor...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/admin/giris" replace />;
  }
  return children;
}
