import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import AdmissionRegister from '@/pages/AdmissionRegister/AdmissionRegister';
import RegisterSuccess from '@/pages/RegisterSuccess/RegisterSuccess';
import HelpDesk from '@/pages/HelpDesk/HelpDesk';
import HPCLCricket from '@/pages/HPCLCricket/HPCLCricket';
import HPCLSuccess from '@/pages/HPCLSuccess/HPCLSuccess';
import HPCLRegistrations from '@/pages/admin/HPCLRegistrations/HPCLRegistrations';
import HelpDeskAdmin from '@/pages/admin/HelpDeskAdmin/HelpDeskAdmin';

// Admin Pages
import AdminLogin from '@/pages/admin/AdminLogin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard/AdminDashboard';
import ManageEvents from '@/pages/admin/ManageEvents/ManageEvents';
import EventForm from '@/pages/admin/EventForm/EventForm';
import AdminRegistrations from '@/pages/admin/Registrations/Registrations';

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore();
  if (isLoading) return <Loader text="Checking authentication..." fullPage />;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  const { isAdmin, checkAuth, isLoading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return <Loader text="Loading..." fullPage />;
  }

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main className="page-animate">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/events/gujcet-2026" element={<Gujcet2026 />} />
          <Route path="/events/:eventId" element={<EventDetail />} />
          <Route path="/events/:eventId/register" element={<RegisterForm />} />
          <Route path="/admission-2026/register" element={<AdmissionRegister />} />
          <Route path="/register/success" element={<RegisterSuccess />} />
          <Route path="/help-desk" element={<HelpDesk />} />
          <Route path="/hpcl-2026" element={<HPCLCricket />} />
          <Route path="/hpcl-2026/success" element={<HPCLSuccess />} />

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
          <Route
            path="/admin/hpcl-registrations"
            element={
              <AdminRoute>
                <HPCLRegistrations />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/help-desk"
            element={
              <AdminRoute>
                <HelpDeskAdmin />
              </AdminRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </>
  );
}
