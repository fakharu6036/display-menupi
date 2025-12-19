import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StorageService, PLAN_CONFIGS } from '../services/storage';
import { Image, Monitor, Calendar, Upload, HardDrive, Crown, ChevronRight, PlayCircle, Plus, Activity, AlertTriangle, TrendingUp, TrendingDown, Clock, RefreshCw, FileVideo, FileText, Zap, BarChart3, ArrowUpRight, CheckCircle, XCircle, Eye, Settings, Sparkles, PieChart, Users, Target, Info, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { PlanType, Screen, Schedule, RepeatType, ActivityLog, MediaType } from '../types';
import { normalizeMediaUrl } from '../utils/url';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [activeScreenIds, setActiveScreenIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState(StorageService.getUser());
  const [usedStorage, setUsedStorage] = useState(0);
  const [storageBreakdown, setStorageBreakdown] = useState({ image: 0, video: 0, pdf: 0, gif: 0, other: 0 });
  const [recentMedia, setRecentMedia] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [mediaByType, setMediaByType] = useState({ image: 0, video: 0, pdf: 0, gif: 0, other: 0 });
  const [allMedia, setAllMedia] = useState<any[]>([]);
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(true);
  const [warnings, setWarnings] = useState<any[]>([]);
  
  useEffect(() => {
    refreshStats();
    refreshUserData();
    loadWarnings();
    // Auto-refresh every 30 seconds for user data and warnings
    const interval = setInterval(() => {
      refreshStats(false);
      refreshUserData();
      loadWarnings();
    }, 30000);
    // Listen for user updates from admin actions
    const handleUserUpdate = () => {
      refreshUserData();
      loadWarnings();
    };
    window.addEventListener('menupi-user-updated', handleUserUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('menupi-user-updated', handleUserUpdate);
    };
  }, []);

  const refreshUserData = async () => {
    try {
      const updatedUser = await StorageService.refreshUserData();
      setUser(updatedUser);
    } catch (err: any) {
      // Don't log errors if it's just "No user session" - user might not be logged in yet
      if (err.message && !err.message.includes('No user session')) {
        console.error('Failed to refresh user data:', err);
      }
      // If refresh fails, keep current user state (don't clear it)
      const currentUser = StorageService.getUser();
      if (currentUser) {
        setUser(currentUser);
      }
    }
  };

  const loadWarnings = async () => {
    try {
      const userWarnings = await StorageService.getUserWarnings();
      setWarnings(userWarnings);
    } catch (err) {
      console.error('Failed to load warnings:', err);
    }
  };

  const refreshStats = async (showLoading = true) => {
    if (showLoading) setIsRefreshing(true);
    try {
        const [s, sch, m, storageUsage, storageBreakdownData] = await Promise.all([
            StorageService.getScreens(),
            StorageService.getSchedules(),
            StorageService.getMedia(),
            StorageService.getStorageUsage(),
            StorageService.getStorageBreakdown()
        ]);
        
        setScreens(s);
        setSchedules(sch);
        setMediaCount(m.length);
        setUsedStorage(storageUsage);
        setStorageBreakdown(storageBreakdownData);
        setAllMedia(m);
        setLastRefresh(new Date());
        
        // Get recent media (last 5) - ensure timestamps are valid and log for debugging
        const sortedMedia = [...m]
            .map(item => {
                // Ensure createdAt is a valid number
                let ts = item.createdAt;
                if (typeof ts === 'string') {
                    ts = parseInt(ts, 10);
                }
                if (ts && !isNaN(ts) && ts > 0) {
                    return { ...item, createdAt: ts };
                }
                return null;
            })
            .filter((item): item is any => item !== null)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        
        // Debug logging removed for production
        // Uncomment below for debugging if needed:
        // if (process.env.NODE_ENV === 'development' && sortedMedia.length > 0) {
        //     console.log('Recent Media Timestamps:', sortedMedia.slice(0, 3).map(item => ({
        //         name: item.name,
        //         createdAt: item.createdAt,
        //         date: new Date(item.createdAt).toISOString(),
        //         ago: formatTimeAgo(item.createdAt)
        //     })));
        // }
        
        setRecentMedia(sortedMedia.slice(0, 5));
        
        // Calculate media by type counts
        const typeCounts = { image: 0, video: 0, pdf: 0, gif: 0, other: 0 };
        m.forEach(item => {
            const type = item.type?.toLowerCase() || 'other';
            if (typeCounts.hasOwnProperty(type)) {
                typeCounts[type as keyof typeof typeCounts]++;
            } else {
                typeCounts.other++;
            }
        });
        setMediaByType(typeCounts);
        
        // Remove active screen detection - feature removed
        setActiveScreenIds(new Set());
    } catch (e) {
        console.error("Failed to load dashboard data", e);
    } finally {
        setIsRefreshing(false);
        setIsInitialLoading(false);
    }
  };

  const formatStorage = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const formatTimeAgo = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) return 'N/A';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'N/A';
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    
    // For older dates, show formatted date
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    </div>
  );

  const planConfig = PLAN_CONFIGS[user.plan || PlanType.FREE];
  const firstName = user.name ? user.name.split(' ')[0] : 'User';
  const storagePercentage = (usedStorage / planConfig.storageMB) * 100;
  const storageColor = storagePercentage > 90 ? 'text-red-600' : storagePercentage > 70 ? 'text-amber-600' : 'text-indigo-600';

  if (isInitialLoading) {
    return (
      <div className="space-y-6 md:space-y-8">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-10 bg-slate-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-20 bg-slate-200 rounded-2xl w-64 animate-pulse"></div>
        </div>
        
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-5 md:p-6 h-36 md:h-40 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-20 mb-3"></div>
              <div className="h-12 bg-slate-200 rounded w-16"></div>
            </Card>
          ))}
        </div>
        
        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-200 rounded"></div>
              ))}
            </div>
          </Card>
          <Card className="p-6 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-200 rounded"></div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      
      {/* Warnings and Account Status Alerts */}
      {(warnings.length > 0 || user?.accountStatus !== 'active') && (
        <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
          <div className="space-y-3">
            {user?.accountStatus !== 'active' && (
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Account {user?.accountStatus === 'suspended' ? 'Suspended' : 'Inactive'}</p>
                  <p className="text-sm text-red-700 mt-1">Your account has been {user?.accountStatus === 'suspended' ? 'suspended' : 'deactivated'}. Please contact support for assistance.</p>
                </div>
              </div>
            )}
            {warnings.map((warning) => (
              <div key={warning.id} className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  warning.warningType === 'ban' ? 'text-red-600' :
                  warning.warningType === 'suspension' ? 'text-orange-600' :
                  'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">
                    {warning.warningType === 'ban' ? 'Account Banned' :
                     warning.warningType === 'suspension' ? 'Account Suspended' :
                     'Warning'}
                  </p>
                  <p className="text-sm text-slate-700 mt-1">{warning.reason}</p>
                  {warning.adminName && (
                    <p className="text-xs text-slate-500 mt-1">Issued by: {warning.adminName}</p>
                  )}
                  {warning.expiresAt && (
                    <p className="text-xs text-slate-500 mt-1">
                      Expires: {new Date(warning.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              {getGreeting()}, {firstName}
            </h1>
            <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
          </div>
          <p className="text-slate-600 mt-1 text-sm md:text-base">Here's what's happening with your digital signage.</p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => refreshStats(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {lastRefresh && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated {formatTimeAgo(lastRefresh.getTime())}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-gradient-to-br from-white via-indigo-50/50 to-white p-4 pr-6 rounded-2xl border border-indigo-200/60 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => navigate('/settings?tab=billing')}>
           <div className={`p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform ${user.plan === PlanType.PRO ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' : user.plan === PlanType.BASIC ? 'bg-gradient-to-br from-indigo-400 to-indigo-600 text-white' : 'bg-gradient-to-br from-slate-400 to-slate-600 text-white'}`}>
             <Crown className="w-5 h-5" />
           </div>
           <div>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Current Plan</p>
             <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">{planConfig.name}</p>
                {user.plan !== PlanType.PRO && (
                  <ArrowUpRight className="w-3 h-3 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
             </div>
           </div>
        </div>
      </div>

      {/* Enhanced Stats Grid - 5 Cards (removed Types) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
         {/* Screens Stat */}
         <Card className="p-5 md:p-6 flex flex-col justify-between h-36 md:h-40 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-indigo-50 via-white to-indigo-50/50 border-indigo-200 hover:border-indigo-400 hover:shadow-xl" onClick={() => navigate('/screens')}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Monitor className="w-24 h-24 text-indigo-600" />
            </div>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 text-indigo-600">
                    <div className="p-2.5 bg-indigo-100 rounded-xl shadow-sm">
                        <Monitor className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-xs md:text-sm text-slate-600">Screens</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
                <span className="text-4xl md:text-5xl font-bold text-slate-900">{screens.length}</span>
            </div>
         </Card>

         {/* Playlists Stat */}
         <Card className="p-5 md:p-6 flex flex-col justify-between h-36 md:h-40 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 border-emerald-200 hover:border-emerald-400 hover:shadow-xl" onClick={() => navigate('/screens')}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <PlayCircle className="w-24 h-24 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 text-emerald-600">
                    <div className="p-2.5 bg-emerald-100 rounded-xl shadow-sm">
                        <PlayCircle className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-xs md:text-sm text-slate-600">Playlists</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
                <span className="text-4xl md:text-5xl font-bold text-slate-900">{screens.reduce((sum, s) => sum + (s.playlist?.length || 0), 0)}</span>
                <span className="text-slate-500 text-xs md:text-sm ml-2">items</span>
            </div>
         </Card>

         {/* Media Stat */}
         <Card className="p-5 md:p-6 flex flex-col justify-between h-36 md:h-40 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-xl" onClick={() => navigate('/media')}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Image className="w-24 h-24 text-blue-600" />
            </div>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 text-blue-600">
                    <div className="p-2.5 bg-blue-100 rounded-xl shadow-sm">
                        <Image className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-xs md:text-sm text-slate-600">Library</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
                <span className="text-4xl md:text-5xl font-bold text-slate-900">{mediaCount}</span>
                <span className="text-slate-500 text-xs md:text-sm ml-2">files</span>
            </div>
         </Card>

         {/* Storage Stat */}
         <Card className="p-5 md:p-6 flex flex-col justify-between h-36 md:h-40 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-purple-50 via-white to-purple-50/50 border-purple-200 hover:border-purple-400 hover:shadow-xl" onClick={() => navigate('/media')}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <HardDrive className="w-24 h-24 text-purple-600" />
            </div>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 text-purple-600">
                    <div className="p-2.5 bg-purple-100 rounded-xl shadow-sm">
                        <HardDrive className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-xs md:text-sm text-slate-600">Storage</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
                <span className={`text-2xl md:text-3xl font-bold ${storageColor}`}>{storagePercentage.toFixed(0)}%</span>
                <p className="text-xs text-slate-500 mt-1">{formatStorage(usedStorage)} / {formatStorage(planConfig.storageMB)}</p>
            </div>
         </Card>

         {/* Schedules Stat */}
         <Card className="p-5 md:p-6 flex flex-col justify-between h-36 md:h-40 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 border-amber-200 hover:border-amber-400 hover:shadow-xl" onClick={() => navigate('/screens')}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Calendar className="w-24 h-24 text-amber-600" />
            </div>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5 text-amber-600">
                    <div className="p-2.5 bg-amber-100 rounded-xl shadow-sm">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-xs md:text-sm text-slate-600">Schedules</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
                <span className="text-4xl md:text-5xl font-bold text-slate-900">{schedules.length}</span>
                <span className="text-slate-500 text-xs md:text-sm ml-2">active</span>
            </div>
         </Card>
      </div>

      {/* Statistics Grid - Media Types & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media Type Breakdown */}
        <Card className="p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Media by Type
            </h2>
            <span className="text-sm font-semibold text-slate-600">{mediaCount} total files</span>
          </div>
          <div className="space-y-3">
            {mediaByType.image > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Image className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Images</p>
                    <p className="text-xs text-slate-500">{formatStorage(storageBreakdown.image)}</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">{mediaByType.image}</span>
              </div>
            )}
            {mediaByType.video > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50/50 border border-purple-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileVideo className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Videos</p>
                    <p className="text-xs text-slate-500">{formatStorage(storageBreakdown.video)}</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">{mediaByType.video}</span>
              </div>
            )}
            {mediaByType.pdf > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">PDFs</p>
                    <p className="text-xs text-slate-500">{formatStorage(storageBreakdown.pdf)}</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-red-600">{mediaByType.pdf}</span>
              </div>
            )}
            {mediaByType.gif > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-pink-50/50 border border-pink-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                    <Image className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">GIFs</p>
                    <p className="text-xs text-slate-500">{formatStorage(storageBreakdown.gif)}</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-pink-600">{mediaByType.gif}</span>
              </div>
            )}
            {mediaCount === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No media uploaded yet</p>
              </div>
            )}
          </div>
        </Card>

        {/* Storage Breakdown */}
        {usedStorage > 0 && (
          <Card className="p-6 bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Storage Breakdown
              </h2>
              <span className={`text-sm font-bold ${storageColor}`}>{storagePercentage.toFixed(1)}% used</span>
            </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner mb-4">
            <div className="h-full flex">
              {storageBreakdown.image > 0 && (
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{ width: `${Math.max((storageBreakdown.image / planConfig.storageMB) * 100, 1)}%` }}
                  title={`Images: ${formatStorage(storageBreakdown.image)}`}
                />
              )}
              {storageBreakdown.video > 0 && (
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 transition-all"
                  style={{ width: `${Math.max((storageBreakdown.video / planConfig.storageMB) * 100, 1)}%` }}
                  title={`Videos: ${formatStorage(storageBreakdown.video)}`}
                />
              )}
              {storageBreakdown.pdf > 0 && (
                <div 
                  className="bg-gradient-to-r from-red-500 to-red-600 transition-all"
                  style={{ width: `${Math.max((storageBreakdown.pdf / planConfig.storageMB) * 100, 1)}%` }}
                  title={`PDFs: ${formatStorage(storageBreakdown.pdf)}`}
                />
              )}
              {storageBreakdown.gif > 0 && (
                <div 
                  className="bg-gradient-to-r from-pink-500 to-pink-600 transition-all"
                  style={{ width: `${Math.max((storageBreakdown.gif / planConfig.storageMB) * 100, 1)}%` }}
                  title={`GIFs: ${formatStorage(storageBreakdown.gif)}`}
                />
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-slate-600">Images: {formatStorage(storageBreakdown.image)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-slate-600">Videos: {formatStorage(storageBreakdown.video)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-600">PDFs: {formatStorage(storageBreakdown.pdf)}</span>
            </div>
          </div>
        </Card>
        )}
      </div>

      {/* Top Section: Screen Preview & Insights Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Screen Preview - Smaller, at top */}
        {screens.length > 0 && (() => {
          const lastScreen = screens[screens.length - 1];
          const firstMedia = lastScreen.playlist[0] ? allMedia.find(m => m.id === lastScreen.playlist[0].mediaId) : null;
          
          return (
            <div className="lg:col-span-2">
              <Card className="p-0 bg-white border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer" onClick={() => navigate(`/screens/${lastScreen.id}`)}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50/50 to-transparent">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-indigo-600" />
                    Last Screen Preview
                  </h2>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/screens');
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    View All
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Screen Preview - Smaller */}
                <div className="relative h-48 bg-slate-100 overflow-hidden group">
                  {firstMedia ? (
                    <>
                      {(firstMedia.type === MediaType.VIDEO || firstMedia.type === 'video') ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <FileVideo className="w-12 h-12 text-white/50" />
                        </div>
                      ) : (firstMedia.type === MediaType.PDF || firstMedia.type === 'pdf') ? (
                        <div className="w-full h-full bg-red-50 flex items-center justify-center">
                          <FileText className="w-12 h-12 text-red-400" />
                        </div>
                      ) : (
                        <img 
                          src={normalizeMediaUrl(firstMedia.url)} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          alt={lastScreen.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.error-fallback')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'error-fallback flex items-center justify-center h-full text-slate-400';
                              fallback.innerHTML = '<div class="text-center"><svg class="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p class="text-xs text-slate-500">Image failed to load</p></div>';
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <div className="text-center">
                        <Monitor className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-slate-500">No media in playlist</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Screen Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base mb-0.5">{lastScreen.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-white/80">
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {lastScreen.screenCode}
                          </span>
                          <span className="flex items-center gap-1">
                            <PlayCircle className="w-3 h-3" />
                            {lastScreen.playlist.length} items
                          </span>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
                
                {/* Screen Details */}
                <div className="p-4 bg-gradient-to-br from-white to-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <div className={`w-2 h-2 rounded-full ${lastScreen.lastPing && (Date.now() - lastScreen.lastPing < 60000) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        <span>{lastScreen.lastPing && (Date.now() - lastScreen.lastPing < 60000) ? 'Active' : 'Offline'}</span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/screens/${lastScreen.id}`);
                      }}
                      className="w-full sm:w-auto text-xs"
                    >
                      <Settings className="w-3 h-3 mr-1.5" />
                      Edit Screen
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}

        {/* Insights & Recommendations - Floating beside */}
        <div className="lg:col-span-1">
          <Card className="p-4 md:p-6 bg-gradient-to-br from-indigo-50 via-purple-50/30 to-pink-50/30 border border-indigo-200 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                <h2 className="text-base md:text-lg font-bold text-slate-900">Insights</h2>
              </div>
              <button
                onClick={() => setIsInsightsExpanded(!isInsightsExpanded)}
                className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                title={isInsightsExpanded ? "Hide" : "Show"}
              >
                {isInsightsExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-600" />
                )}
              </button>
            </div>
            {isInsightsExpanded && (
              <div className="space-y-3">
                {storagePercentage > 80 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900 text-xs">Storage Warning</p>
                      <p className="text-xs text-amber-700 mt-0.5">Using {storagePercentage.toFixed(0)}% of storage</p>
                    </div>
                  </div>
                )}
                {screens.length === 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 text-xs">Get Started</p>
                      <p className="text-xs text-blue-700 mt-0.5">Create your first screen</p>
                    </div>
                  </div>
                )}
                {mediaCount === 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                    <Upload className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-indigo-900 text-xs">Upload Content</p>
                      <p className="text-xs text-indigo-700 mt-0.5">Add media files</p>
                    </div>
                  </div>
                )}
                {schedules.length === 0 && screens.length > 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <Calendar className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-purple-900 text-xs">Schedule Content</p>
                      <p className="text-xs text-purple-700 mt-0.5">Control when content displays</p>
                    </div>
                  </div>
                )}
                {user.plan === PlanType.FREE && screens.length >= planConfig.maxScreens && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <Crown className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900 text-xs">Upgrade Available</p>
                      <p className="text-xs text-amber-700 mt-0.5">Screen limit reached</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhanced Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              <span>Quick Actions</span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/media')}
                className="group relative bg-gradient-to-br from-white via-blue-50/50 to-white p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all duration-300 flex items-center gap-4 text-left overflow-hidden transform hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-blue-500/10 transition-all duration-300"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-blue-500/25">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="relative flex-1">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-700 transition-colors">Upload Media</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Add images, videos, or PDFs to your library</p>
                </div>
                <ChevronRight className="relative w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </button>

              <button 
                onClick={() => navigate('/screens')}
                className="group relative bg-gradient-to-br from-white via-indigo-50/50 to-white p-6 rounded-2xl border border-indigo-200 shadow-lg hover:shadow-xl hover:border-indigo-400 transition-all duration-300 flex items-center gap-4 text-left overflow-hidden transform hover:scale-[1.02]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:to-indigo-500/10 transition-all duration-300"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-indigo-500/25">
                  <Plus className="w-7 h-7" />
                </div>
                <div className="relative flex-1">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-700 transition-colors">Create Screen</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Setup a new display for your content</p>
                </div>
                <ChevronRight className="relative w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Recent Media & Stats */}
        <div className="space-y-6">
          {/* Recent Media */}
          {recentMedia.length > 0 && (
            <Card className="p-6 bg-white border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Image className="w-5 h-5 text-indigo-600" />
                  Recent Media
                </h2>
                <button
                  onClick={() => navigate('/media')}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {recentMedia.map((item) => {
                  const getIcon = () => {
                    if (item.type === MediaType.VIDEO || item.type === 'video') return <FileVideo className="w-4 h-4 text-purple-600" />;
                    if (item.type === MediaType.PDF || item.type === 'pdf') return <FileText className="w-4 h-4 text-red-600" />;
                    return <Image className="w-4 h-4 text-blue-600" />;
                  };
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/media/${item.id}`)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {getIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate text-sm">{item.name}</h3>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* System Status */}
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50/50 border border-indigo-200">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-indigo-600" />
              System Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Screens</span>
                <span className="text-sm font-semibold text-slate-900">
                  {screens.length} Total
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Storage</span>
                <span className={`text-sm font-semibold ${storageColor}`}>
                  {storagePercentage.toFixed(0)}% Used
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Schedules</span>
                <span className="text-sm font-semibold text-slate-900">{schedules.length} Active</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;