import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

// Layout
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';

// Pages
import Landing from '@/pages/Landing/Landing';
import EventDetail from '@/pages/EventDetail/EventDetail';
import RegisterForm from '@/pages/RegisterForm/RegisterForm';
import RegisterSuccess from '@/pages/RegisterSuccess/RegisterSuccess';
import Login from '@/pages/Login/Login';
import Profile from '@/pages/Profile/Profile';
import HelpDesk from '@/pages/HelpDesk/HelpDesk';

// Admin Pages
import AdminLogin from '@/pages/admin/AdminLogin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard/AdminDashboard';
import ManageEvents from '@/pages/admin/ManageEvents/ManageEvents';
import EventForm from '@/pages/admin/EventForm/EventForm';
import AdminRegistrations from '@/pages/admin/Registrations/Registrations';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuthStore();
  if (!isAuthenticated || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  const { isAdmin } = useAuthStore();

  return (
    <>
      {!isAdmin && <Navbar />}
      <main className="page-animate">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
          <Route path="/events/:eventId/register" element={<RegisterForm />} />
          <Route path="/register/success" element={<RegisterSuccess />} />
          <Route path="/login" element={<Login />} />
          <Route path="/help-desk" element={<HelpDesk />} />

          {/* Student Protected */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <AdminRoute>
                <ManageEvents />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/events/new"
            element={
              <AdminRoute>
                <EventForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/events/:id/edit"
            element={
              <AdminRoute>
                <EventForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/events/:id/registrations"
            element={
              <AdminRoute>
                <AdminRegistrations />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}
