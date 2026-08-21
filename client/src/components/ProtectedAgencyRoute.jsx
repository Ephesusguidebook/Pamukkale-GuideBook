import { Navigate } from 'react-router-dom';
import { useAgencyAuth } from '../AgencyAuthContext';

export default function ProtectedAgencyRoute({ children }) {
  const { isAuthenticated, checking } = useAgencyAuth();

  if (checking) {
    return <div className="p-10 text-center text-gray-500">Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/agency/login" replace />;
  }
  return children;
}
