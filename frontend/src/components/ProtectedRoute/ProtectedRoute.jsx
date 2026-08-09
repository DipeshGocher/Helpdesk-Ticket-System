import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

// `roles` omitted = any authenticated role. Gates on `isLoading` (not just
// `isAuthenticated`) so a hard refresh on a protected page doesn't flash-redirect to
// /login while the token is still being verified against GET /auth/me.
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingSpinner label="Loading…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
