import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TicketListPage from './pages/TicketListPage';
import CustomerTicketListPage from './pages/CustomerTicketListPage';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketDetailsPage from './pages/TicketDetailsPage';

// The "/" route resolves to a different dashboard depending on who's logged in,
// rather than living at separate /agent and /customer URLs.
function RoleHome() {
  const { user } = useAuth();
  return user.role === 'agent' ? <TicketListPage /> : <CustomerTicketListPage />;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<RoleHome />} />
          <Route path="/tickets/:id" element={<TicketDetailsPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['customer']} />}>
          <Route path="/tickets/new" element={<CreateTicketPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}
