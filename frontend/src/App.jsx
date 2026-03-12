import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import useAuthStore from '@/store/authStore';

// Layout
import Navbar from '@/components/layout/Navbar/Navbar';
import Footer from '@/components/layout/Footer/Footer';
import Loader from '@/components/ui/Loader/Loader';

// Pages
import Landing from '@/pages/Landing/Landing';
import Gujcet2026 from '@/pages/Gujcet2026/Gujcet2026';
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
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <Loader text="Checking authentication..." />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore();
  if (isLoading) return <Loader text="Checking authentication..." />;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  const { isAdmin, checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return <Loader text="Loading..." />;
  }


  return (
    <GoogleOAuthProvider clientId='864847094209-u3t36jucer522tvpb4mq8qpqv33l76i9.apps.googleusercontent.com'>
      {!isAdmin && <Navbar />}
      <main className="page-animate">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/events/gujcet-2026" element={<Gujcet2026 />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/help-desk" element={<HelpDesk />} />

          {/* Student Protected */}
          <Route
            path="/events/:eventId/register"
            element={
              <ProtectedRoute>
                <RegisterForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register/success"
            element={
              <ProtectedRoute>
                <RegisterSuccess />
              </ProtectedRoute>
            }
          />
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
    </GoogleOAuthProvider>
  );
}
