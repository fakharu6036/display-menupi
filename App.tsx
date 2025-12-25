
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { isTvPlayerContext, isAdminPortalContext, isDashboardContext } from './services/config';

// Pages
import Dashboard from './pages/Dashboard';
import MediaLibrary from './pages/MediaLibrary';
import MediaPreview from './pages/MediaPreview';
import Screens from './pages/Screens';
import ScreenEditor from './pages/ScreenEditor';
import Schedules from './pages/Schedules';
import Settings from './pages/Settings';
import PublicPlayer from './pages/PublicPlayer';
import TvLogin from './pages/TvLogin';
import PhysicalTVs from './pages/PhysicalTVs';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';

const App: React.FC = () => {
  const isTvContext = isTvPlayerContext();
  const isAdminContext = isAdminPortalContext();
  const isDashboardCtx = isDashboardContext();

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public Routes - Available on all subdomains */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* TV Player Routes - Only on tv.menupi.com */}
          {isTvContext ? (
            <>
              {/* On TV player domain: root-level routes only */}
              <Route path="/" element={<TvLogin />} />
              <Route path="/:screenCode" element={<PublicPlayer />} />
              {/* Redirect any other routes to root */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : null}
          
          {/* Admin Portal Routes - Only on portal.menupi.com */}
          {isAdminContext ? (
            <>
              <Route
                path="/"
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route
                path="/admin"
                element={<Navigate to="/admin/dashboard" replace />}
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/restaurants"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/screens"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/media"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/player-controls"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/email"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/system-health"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/admins"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/user-requests"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              {/* Redirect any other routes to admin dashboard */}
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </>
          ) : null}
          
          {/* Dashboard Routes - Only on app.menupi.com (or default) */}
          {isDashboardCtx || (!isTvContext && !isAdminContext) ? (
            <>
              {/* Root route - redirect to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/media" element={<MediaLibrary />} />
              <Route path="/media/:mediaId" element={<MediaPreview />} />
              <Route path="/screens" element={<Screens />} />
              <Route path="/screens/:screenId" element={<ScreenEditor />} />
              <Route path="/tvs" element={<PhysicalTVs />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/settings" element={<Settings />} />
              {/* TV routes with /tv prefix for dashboard domain */}
              <Route path="/tv" element={<TvLogin />} />
              <Route path="/tv/:screenCode" element={<PublicPlayer />} />
            </>
          ) : null}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
