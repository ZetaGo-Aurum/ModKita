import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) return null;

  const isDev = currentUser?.email === 'deltaastra24@gmail.com';
  const isAdmin = isDev || userData?.role === 'admin' || userData?.role === 'dev';

  if (!currentUser || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
