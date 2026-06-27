import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/admin-login" replace />;
  return children;
};

export default AdminRoute;
