
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { isTvPlayerContext } from './services/config';

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

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* TV Player Routes - Context-aware */}
          {isTvContext ? (
            <>
              {/* On TV player domain: root-level routes */}
              <Route path="/" element={<TvLogin />} />
              <Route path="/:screenCode" element={<PublicPlayer />} />
            </>
          ) : (
            <>
              {/* On dashboard domain: /tv prefix routes */}
              <Route path="/tv" element={<TvLogin />} />
              <Route path="/tv/:screenCode" element={<PublicPlayer />} />
              {/* Root route - redirect to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/media" element={<MediaLibrary />} />
          <Route path="/media/:mediaId" element={<MediaPreview />} />
          <Route path="/screens" element={<Screens />} />
          <Route path="/screens/:screenId" element={<ScreenEditor />} />
          <Route path="/tvs" element={<PhysicalTVs />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Admin Routes - All tabs have their own routes for bookmarking and navigation */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <Navigate to="/admin/dashboard" replace />
              </ProtectedAdminRoute>
            }
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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
