import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Image, Monitor, Calendar, LogOut, Settings, HardDrive, PieChart, AlertTriangle, Menu, X, User as UserIcon, Shield } from 'lucide-react';
import { StorageService } from '../services/storage';
import { PlanLimits, PlanType, User, UserRole } from '../types';
import { Modal } from './Modal';
import { Button } from './Button';
import { ToastContainer, useToast } from './Toast';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toasts, removeToast } = useToast();
  
  // Storage & User State
  const [storageStats, setStorageStats] = useState({ used: 0, limit: 0, percent: 0 });
  const [storageBreakdown, setStorageBreakdown] = useState({ image: 0, video: 0, pdf: 0, other: 0 });
  const [userPlan, setUserPlan] = useState<PlanLimits | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // UI State
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('menupi_user');
    navigate('/login');
  };

  const updateStats = async () => {
    try {
        const [used, breakdown] = await Promise.all([
            StorageService.getStorageUsage(),
            StorageService.getStorageBreakdown()
        ]);
        const config = StorageService.getCurrentPlanConfig();
        const usedNum = typeof used === 'number' ? used : 0;
        const limit = config.storageMB;
        setStorageStats({
            used: usedNum,
            limit: limit,
            percent: limit > 0 ? Math.min((usedNum / limit) * 100, 100) : 0
        });
        setStorageBreakdown(breakdown || { image: 0, video: 0, pdf: 0, gif: 0, other: 0 });
        setUserPlan(config);
        setUser(StorageService.getUser());
    } catch (err) {
        console.error('Failed to update storage stats:', err);
        // Set defaults on error
        const config = StorageService.getCurrentPlanConfig();
        setStorageStats({
            used: 0,
            limit: config.storageMB,
            percent: 0
        });
        setStorageBreakdown({ image: 0, video: 0, pdf: 0, gif: 0, other: 0 });
    }
  };

  useEffect(() => {
    updateStats();
    
    // Listen for storage updates
    const handleStorageChange = () => updateStats();
    window.addEventListener('menupi-storage-change', handleStorageChange);
    
    return () => {
        window.removeEventListener('menupi-storage-change', handleStorageChange);
    };
  }, []);

  // Update stats and close mobile menu on route change
  useEffect(() => {
      setIsMobileMenuOpen(false);
      updateStats();
  }, [location.pathname]);

  // Don't show layout on public pages, login, register, or admin dashboard (which has its own header and navigation)
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/display') || location.pathname.startsWith('/tv') || location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Determine progress bar color based on usage
  const getProgressColor = (percent: number) => {
      if (percent > 90) return 'bg-red-500';
      if (percent > 70) return 'bg-amber-500';
      return 'bg-indigo-500';
  };

  const isCritical = storageStats.percent > 90;

  // --- Components ---

  const StorageWidget = ({ compact = false }) => (
    <div 
        className={`bg-slate-50 rounded-xl border cursor-pointer transition-colors ${isCritical ? 'border-red-100 hover:bg-red-50' : 'border-slate-100 hover:bg-slate-100'} ${compact ? 'p-3' : 'p-4'}`}
        onClick={() => setIsStorageModalOpen(true)}
    >
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <HardDrive className="w-3.5 h-3.5" />
                Storage
            </div>
            <span className={`text-[10px] font-bold ${isCritical ? 'text-red-600' : 'text-slate-500'}`}>
                {Math.round(storageStats.percent)}%
            </span>
        </div>
        
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
                className={`h-full transition-all duration-500 rounded-full ${getProgressColor(storageStats.percent)}`} 
                style={{ width: `${storageStats.percent}%` }}
            />
        </div>
        
        <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-slate-500 font-medium">
                {typeof storageStats.used === 'number' ? storageStats.used.toFixed(1) : '0.0'} MB
            </span>
            <span className="text-[10px] text-slate-400">{storageStats.limit} MB</span>
        </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* ==================== MOBILE HEADER (Top Bar) ==================== */}
      <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-30 pt-safe">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
              <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
             <img src="https://www.menupi.com/src/menupi-logo-black.svg" alt="MENUPI" className="h-5" />
             <span className="text-[10px] font-bold text-slate-300 mb-0.5 leading-none mt-1">APP</span>
          </div>

          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden ${user?.avatarUrl ? 'bg-white border border-slate-200' : 'bg-indigo-100 text-indigo-700'}`}>
              {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                  user?.name.charAt(0)
              )}
          </div>
      </header>

      {/* ==================== MOBILE DRAWER (Hamburger Content) ==================== */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
              {/* Backdrop */}
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />
              
              {/* Drawer Panel */}
              <div className="absolute top-0 bottom-0 left-0 w-80 bg-white shadow-2xl animate-in slide-in-from-left duration-200 flex flex-col">
                  {/* Drawer Header */}
                  <div className="p-5 border-b border-slate-100 pt-safe mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden ${user?.avatarUrl ? 'bg-white border border-slate-200' : 'bg-slate-900 text-white'}`}>
                              {user?.avatarUrl ? (
                                  <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
                              ) : (
                                  user?.name.charAt(0)
                              )}
                          </div>
                          <div>
                              <p className="font-bold text-slate-900">{user?.name}</p>
                              <p className="text-xs text-slate-500">{user?.email}</p>
                          </div>
                      </div>
                      <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                      {/* Storage Section */}
                      <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Storage & Plan</p>
                          <StorageWidget />
                      </div>

                      {/* Settings Links */}
                      <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Settings</p>
                          <nav className="space-y-1">
                              <NavLink to="/settings?tab=team" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg">
                                  <UserIcon className="w-5 h-5" /> Team & Profile
                              </NavLink>
                              <NavLink to="/settings?tab=billing" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-50 rounded-lg">
                                  <Settings className="w-5 h-5" /> Plans & Billing
                              </NavLink>
                              {user?.role === UserRole.SUPER_ADMIN && (
                                  <NavLink to="/admin" className="flex items-center gap-3 px-3 py-2.5 text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 rounded-lg mt-2">
                                      <Shield className="w-5 h-5" /> Admin Dashboard
                                  </NavLink>
                              )}
                          </nav>
                      </div>
                  </div>

                  {/* Drawer Footer */}
                  <div className="p-4 border-t border-slate-100 pb-safe">
                      <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full text-red-600 hover:bg-red-50 rounded-lg font-medium">
                          <LogOut className="w-5 h-5" /> Sign Out
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* ==================== DESKTOP SIDEBAR ==================== */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-white to-slate-50/50 border-r border-slate-200/60 flex-col sticky top-0 h-screen z-10 backdrop-blur-sm">
        <div className="p-8 flex items-end gap-1 border-b border-slate-100/60">
          <img src="https://www.menupi.com/src/menupi-logo-black.svg" alt="MENUPI" className="h-8" />
          <span className="text-sm font-bold text-slate-400 mb-0.5 leading-none">.sign</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
            <NavLink 
                to="/dashboard" 
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group ${
                    isActive 
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
            >
                {({ isActive }) => (
                    <>
                        <LayoutDashboard className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'}`} /> 
                        Dashboard
                    </>
                )}
            </NavLink>
            <NavLink 
                to="/media" 
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group ${
                    isActive 
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
            >
                {({ isActive }) => (
                    <>
                        <Image className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'}`} /> 
                        Media Library
                    </>
                )}
            </NavLink>
            <NavLink 
                to="/screens" 
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group ${
                    isActive 
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
            >
                {({ isActive }) => (
                    <>
                        <Monitor className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'}`} /> 
                        Screens
                    </>
                )}
            </NavLink>
            <NavLink 
                to="/schedules" 
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group ${
                    isActive 
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
            >
                {({ isActive }) => (
                    <>
                        <Calendar className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'}`} /> 
                        Schedules
                    </>
                )}
            </NavLink>
            <NavLink 
                to="/settings" 
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group ${
                    isActive 
                        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
            >
                {({ isActive }) => (
                    <>
                        <Settings className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'}`} /> 
                        Settings
                    </>
                )}
            </NavLink>
            
            {user?.role === UserRole.SUPER_ADMIN && (
                <div className="pt-4 mt-4 border-t border-slate-100">
                    <NavLink 
                        to="/admin" 
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 shadow-sm ${
                            isActive 
                                ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg' 
                                : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-700 hover:to-slate-800 hover:shadow-md'
                        }`}
                    >
                        <Shield className="w-5 h-5" /> Admin Panel
                    </NavLink>
                </div>
            )}
        </nav>

        <div className="px-4 py-4 mb-2">
            <StorageWidget compact />
        </div>

        <div className="p-4 border-t border-slate-100/60">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-slate-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-50 hover:text-red-600 transition-all duration-200 font-medium group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
            Sign Out
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1 overflow-y-auto h-full scroll-smooth pt-14 md:pt-0 pb-[80px] md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
          {children}
        </div>
      </main>

      {/* ==================== MOBILE BOTTOM NAV ==================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 pb-safe">
        <div className="grid grid-cols-5 h-16 items-center">
            
            {/* 1. Media */}
            <NavLink to="/media" className={({ isActive }) => `flex flex-col items-center justify-center gap-1 h-full ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                <Image className="w-5 h-5" />
                <span className="text-[10px] font-medium">Media</span>
            </NavLink>

            {/* 2. Screens */}
            <NavLink to="/screens" className={({ isActive }) => `flex flex-col items-center justify-center gap-1 h-full ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                <Monitor className="w-5 h-5" />
                <span className="text-[10px] font-medium">Screens</span>
            </NavLink>

            {/* 3. Dashboard (Center Highlight) */}
            <NavLink to="/dashboard" className="flex flex-col items-center justify-center h-full relative -top-3">
                 {({ isActive }) => (
                     <>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-slate-50 transition-transform active:scale-95 ${isActive ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>Home</span>
                     </>
                 )}
            </NavLink>

            {/* 4. Schedules */}
            <NavLink to="/schedules" className={({ isActive }) => `flex flex-col items-center justify-center gap-1 h-full ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] font-medium">Schedule</span>
            </NavLink>

            {/* 5. Profile/Settings Short Link */}
            <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center justify-center gap-1 h-full ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                {({ isActive }) => (
                    <>
                        <div className={`w-6 h-6 rounded-full overflow-hidden border border-current flex items-center justify-center ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-4 h-4" />
                            )}
                        </div>
                        <span className="text-[10px] font-medium mt-0.5">Profile</span>
                    </>
                )}
            </NavLink>

        </div>
      </nav>

      {/* ==================== STORAGE MODAL (Shared) ==================== */}
      <Modal isOpen={isStorageModalOpen} onClose={() => setIsStorageModalOpen(false)} title="Storage Usage">
          <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Plan</p>
                      <h4 className="text-lg font-bold text-slate-900">{userPlan?.name}</h4>
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Limit</p>
                      <h4 className="text-lg font-bold text-slate-900">{userPlan?.storageMB} MB</h4>
                  </div>
              </div>

              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-indigo-600" /> Usage Breakdown
                      </h4>
                      <span className={`text-sm font-medium ${isCritical ? 'text-red-600' : 'text-slate-600'}`}>
                          {typeof storageStats.used === 'number' ? storageStats.used.toFixed(2) : '0.00'} MB Used
                      </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      {storageStats.limit > 0 && (
                          <>
                              <div className="bg-blue-500 h-full" style={{ width: `${((storageBreakdown.image || 0) / storageStats.limit) * 100}%` }} title="Images" />
                              <div className="bg-purple-500 h-full" style={{ width: `${((storageBreakdown.video || 0) / storageStats.limit) * 100}%` }} title="Videos" />
                              <div className="bg-red-500 h-full" style={{ width: `${((storageBreakdown.pdf || 0) / storageStats.limit) * 100}%` }} title="PDFs" />
                              <div className="bg-pink-500 h-full" style={{ width: `${((storageBreakdown.gif || 0) / storageStats.limit) * 100}%` }} title="GIFs" />
                              <div className="bg-slate-400 h-full" style={{ width: `${((storageBreakdown.other || 0) / storageStats.limit) * 100}%` }} title="Other" />
                          </>
                      )}
                  </div>

                  {/* Legend List */}
                  <div className="space-y-2">
                      <div className="flex justify-between text-sm items-center p-2 rounded hover:bg-slate-50">
                          <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <span className="text-slate-700">Images</span>
                          </div>
                          <span className="font-medium text-slate-900">
                              {typeof storageBreakdown.image === 'number' ? storageBreakdown.image.toFixed(2) : '0.00'} MB
                          </span>
                      </div>
                      <div className="flex justify-between text-sm items-center p-2 rounded hover:bg-slate-50">
                          <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500" />
                              <span className="text-slate-700">Videos</span>
                          </div>
                          <span className="font-medium text-slate-900">
                              {typeof storageBreakdown.video === 'number' ? storageBreakdown.video.toFixed(2) : '0.00'} MB
                          </span>
                      </div>
                      <div className="flex justify-between text-sm items-center p-2 rounded hover:bg-slate-50">
                          <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              <span className="text-slate-700">Documents (PDF)</span>
                          </div>
                          <span className="font-medium text-slate-900">
                              {typeof storageBreakdown.pdf === 'number' ? storageBreakdown.pdf.toFixed(2) : '0.00'} MB
                          </span>
                      </div>
                  </div>
              </div>

              {storageStats.percent > 70 && (
                  <div className={`p-4 rounded-xl flex gap-3 text-sm ${isCritical ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <p>
                          You have used <strong>{Math.round(storageStats.percent)}%</strong> of your storage. 
                          {isCritical ? ' Please delete some files or upgrade to avoid upload failures.' : ' Consider upgrading if you need more space.'}
                      </p>
                  </div>
              )}

              {userPlan?.id !== PlanType.PRO && (
                  <div className="pt-2">
                      <Button className="w-full" onClick={() => { setIsStorageModalOpen(false); navigate('/settings?tab=billing'); }}>
                          Upgrade Plan
                      </Button>
                  </div>
              )}
          </div>
      </Modal>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};