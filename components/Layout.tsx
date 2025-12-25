
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Image as ImageIcon, 
  Monitor, 
  Clock, 
  Settings as SettingsIcon,
  Bell,
  Search,
  Menu,
  ChevronLeft,
  ChevronRight,
  Tv
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { isTvPlayerContext } from '../services/config';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(StorageService.getUser());
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate page types BEFORE any hooks (needed for useEffect)
  const isTvContext = isTvPlayerContext();
  const isTvPage = isTvContext 
    ? (location.pathname === '/' || /^\/[A-Z0-9-]+$/.test(location.pathname))
    : (location.pathname === '/tv' || location.pathname.startsWith('/tv/'));
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin');

  // Navigation items - MUST be called before any early returns (Rules of Hooks)
  // Admin tab removed - will be replaced with features from display-menupi repo
  const navItems = React.useMemo(() => {
    return [
      { to: '/dashboard', icon: Home, label: 'Home' },
      { to: '/media', icon: ImageIcon, label: 'Media' },
      { to: '/screens', icon: Monitor, label: 'Screens' },
      { to: '/tvs', icon: Tv, label: 'TVs' },
      { to: '/schedules', icon: Clock, label: 'Schedules' },
    ];
  }, []); // No dependencies needed

  // Update user when storage changes - but only if user actually changed
  useEffect(() => {
    const handleStorageChange = () => {
      const newUser = StorageService.getUser();
      // Only update if user actually changed (prevents unnecessary re-renders)
      setUser(prevUser => {
        if (JSON.stringify(prevUser) !== JSON.stringify(newUser)) {
          return newUser;
        }
        return prevUser;
      });
    };
    window.addEventListener('menupi-storage-change', handleStorageChange);
    return () => window.removeEventListener('menupi-storage-change', handleStorageChange);
  }, []);

  // Require authentication for protected pages
  useEffect(() => {
    // Only navigate if we're not already on the target page
    if (!user && !isAuthPage && !isTvPage && !isAdminPage && location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
  }, [user, navigate, isAuthPage, isTvPage, isAdminPage, location.pathname]);
  
  // For TV pages, return minimal layout
  if (isTvPage) {
    return <main className="h-screen w-full bg-black overflow-hidden">{children}</main>;
  }

  // For auth pages, return without navigation
  if (isAuthPage) {
    return <main className="h-screen w-full bg-[#fdfbff] overflow-auto">{children}</main>;
  }

  // For admin pages, return without navigation (admin has its own layout)
  if (isAdminPage) {
    return <>{children}</>;
  }

  // Require authentication for protected pages
  if (!user) {
    return null;
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#fdfbff] overflow-hidden">
      {/* Desktop Navigation Drawer (Expandable) - MD3 */}
      <aside 
        className={`hidden md:flex flex-col py-6 border-r border-[#f3f3f7] bg-white z-50 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
          isExpanded ? 'w-64 px-4' : 'w-20 items-center'
        }`}
      >
        <div className={`mb-8 flex items-center ${isExpanded ? 'justify-between px-2 w-full' : 'justify-center'}`}>
          {isExpanded ? (
            <>
              <img 
                src="https://www.menupi.com/src/menupi-logo-black.svg" 
                alt="MENUPI" 
                className="h-8 w-auto cursor-pointer transition-all duration-300 scale-110" 
                onClick={() => navigate('/dashboard')}
              />
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-full hover:bg-[#f3f3f7] text-[#44474e] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsExpanded(true)}
              className="p-3 rounded-full hover:bg-[#f3f3f7] text-[#44474e] transition-all active:scale-90"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-2 w-full">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink 
                key={item.to}
                to={item.to}
                className={`flex items-center group relative transition-all duration-200 overflow-hidden ${
                  isExpanded 
                    ? `px-4 py-3 rounded-2xl gap-4 ${isActive ? 'bg-[#e0e0ff] text-[#00006e]' : 'text-[#44474e] hover:bg-[#f3f3f7]'}` 
                    : `flex-col py-2 gap-1 ${isActive ? 'text-[#3f51b5]' : 'text-[#44474e] hover:text-[#1b1b1f]'}`
                }`}
              >
                <div className={`transition-all duration-300 flex items-center justify-center shrink-0 ${
                  isExpanded 
                    ? '' 
                    : `w-12 h-8 rounded-full ${isActive ? 'bg-[#e0e0ff]' : 'group-hover:bg-[#f3f3f7]'}`
                }`}>
                  <item.icon className={`w-6 h-6 ${isActive && !isExpanded ? 'fill-current' : ''}`} />
                </div>
                
                <span className={`font-bold tracking-tight whitespace-nowrap transition-all duration-300 ${
                  isExpanded 
                    ? 'text-sm' 
                    : `text-[10px] ${isActive ? 'opacity-100' : 'opacity-70'}`
                }`}>
                  {item.label}
                </span>

                {isExpanded && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#3f51b5]" />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className={`mt-auto flex flex-col gap-4 w-full ${isExpanded ? '' : 'items-center'}`}>
          <NavLink 
            to="/settings" 
            className={`flex items-center transition-all duration-200 ${
              isExpanded 
                ? 'px-4 py-3 rounded-2xl gap-4 text-[#44474e] hover:bg-[#f3f3f7]' 
                : 'p-3 rounded-full text-[#44474e] hover:bg-[#f3f3f7]'
            }`}
          >
            <SettingsIcon className="w-6 h-6 shrink-0" />
            {isExpanded && <span className="text-sm font-bold tracking-tight">Settings</span>}
          </NavLink>

          <div className={`flex items-center transition-all duration-300 ${isExpanded ? 'px-2 gap-3' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-[#e0e0ff] flex items-center justify-center text-[#00006e] font-bold text-sm border-2 border-white shadow-sm shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {isExpanded && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1b1b1f] truncate leading-tight">{user?.name}</p>
                <p className="text-[10px] font-bold text-[#777680] uppercase tracking-widest">{user?.plan}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#fdfbff] relative h-full">
        {/* Top App Bar */}
        <header className="h-16 md:h-20 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-[#f3f3f7] md:border-none sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <img 
              src="https://www.menupi.com/src/menupi-logo-black.svg" 
              alt="MENUPI" 
              className="h-6 md:hidden" 
            />
            <div className="hidden md:flex items-center bg-[#f3f3f7] rounded-full px-5 py-2.5 w-80 group focus-within:bg-white focus-within:ring-2 focus-within:ring-[#e0e0ff] transition-all">
              <Search className="w-4 h-4 text-[#777680] mr-3" />
              <input type="text" placeholder="Search menus..." className="bg-transparent border-none outline-none text-sm w-full font-medium" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2.5 rounded-full hover:bg-[#f3f3f7] transition-colors relative group">
              <Bell className="w-5 h-5 text-[#44474e] group-hover:scale-110 transition-transform" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ba1a1a] rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-[1px] bg-[#f3f3f7] mx-2 hidden md:block" />
            <div className="hidden md:flex items-center gap-3 pl-2">
               <div className="text-right">
                  <p className="text-xs font-bold text-[#1b1b1f] leading-tight">{user?.name}</p>
                  <p className="text-[10px] font-bold text-[#777680] uppercase tracking-widest">{user?.plan} PLAN</p>
               </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-fade w-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation - MD3 */}
        <nav className="md:hidden flex h-16 border-t border-[#f3f3f7] bg-white/95 backdrop-blur-lg items-center justify-around fixed bottom-0 left-0 right-0 z-50">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <NavLink 
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1 flex-1 transition-colors ${isActive ? 'text-[#3f51b5]' : 'text-[#44474e]'}`}
              >
                <div className={`w-16 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-[#e0e0ff]' : ''}`}>
                  <item.icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                </div>
                <span className="text-[10px] font-bold tracking-wider uppercase">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
