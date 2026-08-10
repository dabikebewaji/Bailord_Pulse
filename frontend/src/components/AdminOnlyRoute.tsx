import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Sits inside ProtectedRoute — assumes the user is already authenticated.
// Sends retailers back to their own dashboard if they hit an admin-only
// URL (e.g. /retailers, /analytics) directly; the sidebar already hides
// these links for them, this is the server-equivalent guard on the client.
export const AdminOnlyRoute = () => {
  const { user } = useAuth();

  if (user?.role === 'retailer') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
