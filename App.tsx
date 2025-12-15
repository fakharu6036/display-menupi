import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { StorageService } from './services/storage';
import { UserRole } from './types';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import MediaLibrary from './pages/MediaLibrary';
import MediaPreview from './pages/MediaPreview';
import Screens from './pages/Screens';
import ScreenEditor from './pages/ScreenEditor';
import Schedules from './pages/Schedules';
import Settings from './pages/Settings';
import PublicPlayer from './pages/PublicPlayer';
import TvLogin from './pages/TvLogin';
import AdminDashboard from './pages/AdminDashboard';
import TvSubdomainRoute from './components/TvSubdomainRoute';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('menupi_user');
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = StorageService.getUser();
  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          
          <Route path="/media" element={
            <ProtectedRoute><MediaLibrary /></ProtectedRoute>
          } />
          <Route path="/media/:mediaId" element={
            <ProtectedRoute><MediaPreview /></ProtectedRoute>
          } />
          
          <Route path="/screens" element={
            <ProtectedRoute><Screens /></ProtectedRoute>
          } />
          <Route path="/screens/:screenId" element={
            <ProtectedRoute><ScreenEditor /></ProtectedRoute>
          } />
          
          <Route path="/schedules" element={
            <ProtectedRoute><Schedules /></ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          } />

          {/* Admin Routes - All tabs have their own routes for bookmarking and navigation */}
          <Route path="/admin" element={
            <ProtectedAdminRoute><Navigate to="/admin/dashboard" replace /></ProtectedAdminRoute>
          } />
          <Route path="/admin/dashboard" element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          } />
          <Route path="/admin/restaurants" element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          } />
          <Route path="/admin/screens" element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          } />
          <Route path="/admin/media" element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          } />
          <Route path="/admin/player-controls" element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          } />
          <Route path="/admin/email" element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          } />
          <Route path="/admin/audit" element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          } />
          <Route path="/admin/system-health" element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          } />
          <Route path="/admin/admins" element={
            <ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>
          } />

          {/* Public Player Routes */}
          <Route path="/tv" element={<TvLogin />} />
          <Route path="/tv/:screenCode" element={<PublicPlayer />} />
          
          {/* TV Subdomain Route: tv.menupi.com/[code] */}
          <Route path="/:screenCode" element={<TvSubdomainRoute />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;