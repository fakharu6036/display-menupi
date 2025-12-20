import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { StorageService } from "./services/storage";
import { UserRole } from "./types";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import MediaLibrary from "./pages/MediaLibrary";
import MediaPreview from "./pages/MediaPreview";
import Screens from "./pages/Screens";
import ScreenEditor from "./pages/ScreenEditor";
import Schedules from "./pages/Schedules";
import Settings from "./pages/Settings";
import PublicPlayer from "./pages/PublicPlayer";
import TvLogin from "./pages/TvLogin";
import AdminDashboard from "./pages/AdminDashboard";
import TvSubdomainRoute from "./components/TvSubdomainRoute";
import TvSubdomainGuard from "./components/TvSubdomainGuard";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const isAuthenticated = !!localStorage.getItem("menupi_user");
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = StorageService.getUser();
  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

// Root route handler - shows TvLogin on TV subdomain, redirects to dashboard on app subdomain
const RootRoute: React.FC = () => {
  const hostname = window.location.hostname;
  const isTvSubdomain =
    hostname === "tv.menupi.com" || hostname.includes("tv.");

  // On TV subdomain, always show TvLogin (screen code input)
  if (isTvSubdomain) {
    return <TvLogin />;
  }

  // On app subdomain, check if authenticated
  const isAuthenticated = !!localStorage.getItem("menupi_user");
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not authenticated on app subdomain, show login
  return <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  useEffect(() => {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // Check if we're on TV subdomain (public player routes don't need auth)
    const isTvSubdomain = hostname === "tv.menupi.com" || hostname.includes("tv.");
    
    // Check if this is a public route (public player, login, register, verify-email)
    const isPublicRoute = 
      pathname.startsWith("/tv/") || // /tv/:screenCode
      pathname.match(/^\/[A-Z0-9]{6,}$/) || // /:screenCode (on TV subdomain)
      pathname === "/tv" || // /tv (TvLogin)
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/verify-email";
    
    // Skip authentication check for public routes on TV subdomain
    if (isTvSubdomain && isPublicRoute) {
      return; // Don't check auth for public player routes
    }
    
    // Check for valid token on app load (only for protected routes)
    const userStr = localStorage.getItem("menupi_user");
    let shouldLogout = false;
    if (!userStr) {
      shouldLogout = true;
    } else {
      try {
        const user = JSON.parse(userStr);
        if (!user || !user.token || user.token === "undefined") {
          shouldLogout = true;
        }
      } catch (e) {
        shouldLogout = true;
      }
    }
    if (shouldLogout) {
      localStorage.removeItem("menupi_user");
      // Only redirect to login if not already on a public route
      if (!isPublicRoute && !pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
  }, []);
  return (
    <BrowserRouter>
      <TvSubdomainGuard>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route path="/" element={<RootRoute />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/media"
              element={
                <ProtectedRoute>
                  <MediaLibrary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/media/:mediaId"
              element={
                <ProtectedRoute>
                  <MediaPreview />
                </ProtectedRoute>
              }
            />

            <Route
              path="/screens"
              element={
                <ProtectedRoute>
                  <Screens />
                </ProtectedRoute>
              }
            />
            <Route
              path="/screens/:screenId"
              element={
                <ProtectedRoute>
                  <ScreenEditor />
                </ProtectedRoute>
              }
            />

            <Route
              path="/schedules"
              element={
                <ProtectedRoute>
                  <Schedules />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

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

            {/* Public Player Routes */}
            <Route path="/tv" element={<TvLogin />} />
            <Route path="/tv/:screenCode" element={<PublicPlayer />} />

            {/* TV Subdomain Route: tv.menupi.com/[code] - Must be last to catch screen codes */}
            <Route path="/:screenCode" element={<TvSubdomainRoute />} />
          </Routes>
        </Layout>
      </TvSubdomainGuard>
    </BrowserRouter>
  );
};

export default App;
