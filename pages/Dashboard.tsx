
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StorageService } from '../services/storage';
import { 
  Plus, 
  Monitor, 
  ImageIcon, 
  Wifi, 
  HardDrive, 
  ChevronRight,
  Tv,
  ExternalLink,
  MonitorPlay,
  Smartphone,
  Play,
  Clock,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Screen, ScreenStatus, UserRole, MediaItem, MediaType, PhysicalTV, Schedule } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [physicalTVs, setPhysicalTVs] = useState<PhysicalTV[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [user, setUser] = useState(StorageService.getUser());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const u = StorageService.getUser();
    if (!u) {
      navigate('/login');
      return;
    }
    setUser(u);
    setLoading(true);
    
    try {
      const [s, m, tvs, sch] = await Promise.all([
        StorageService.getScreens(), 
        StorageService.getMedia(),
        StorageService.getPhysicalTVs().catch(() => []),
        StorageService.getSchedules().catch(() => [])
      ]);
      setScreens(s || []);
      setAllMedia(m || []);
      setPhysicalTVs(tvs || []);
      setSchedules(sch || []);
    } catch (e: any) {
      console.error("Failed to load dashboard data:", e);
      // If session expired, redirect to login
      if (e.message?.includes('Session expired') || e.message?.includes('401')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
    window.addEventListener('menupi-storage-change', load);
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30000);
    
    return () => {
      window.removeEventListener('menupi-storage-change', load);
      clearInterval(interval);
    };
  }, [load]);

  if (!user) return null;

  const liveScreens = screens.filter(s => s.status === ScreenStatus.LIVE);
  const onlineTVs = physicalTVs.filter(tv => tv.status === 'online');
  const activeSchedules = schedules.filter(s => s.isActive);
  const planConfig = StorageService.getCurrentPlanConfig();
  const storageUsed = allMedia.reduce((acc, m) => acc + (m.size_mb || 0), 0);
  
  // Media type breakdown
  const videoCount = allMedia.filter(m => m.type === MediaType.VIDEO || m.type === 'video').length;
  const imageCount = allMedia.filter(m => m.type === MediaType.IMAGE || m.type === MediaType.GIF || m.type === 'image' || m.type === 'gif').length;
  const pdfCount = allMedia.filter(m => m.type === MediaType.PDF || m.type === 'pdf').length;
  
  // Total playlist items across all screens
  const totalPlaylistItems = screens.reduce((acc, s) => acc + s.playlist.length, 0);

  return (
    <div className="space-y-12 animate-fade w-full">
      <div className="px-2 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-[#1b1b1f] tracking-tight">
            Welcome, {user.name}
          </h1>
          <p className="text-[#777680] font-bold uppercase tracking-widest text-xs mt-2">
            {user.plan} Subscription
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-[#3f51b5]/20 border-t-[#3f51b5] rounded-full animate-spin" />
          <p className="font-bold text-[#777680]">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-[#3f51b5] p-8 flex flex-col justify-between h-52 group cursor-pointer border-none shadow-xl hover:scale-[1.02] transition-all" onClick={() => navigate('/screens')}>
              <div className="bg-white/20 p-4 rounded-3xl w-fit"><Plus className="w-8 h-8 text-white" strokeWidth={3} /></div>
              <p className="text-xl font-black text-white">Create Screen</p>
            </Card>

            <Card className="bg-white p-8 flex flex-col justify-between h-52 group cursor-pointer hover:bg-[#f3f3f7] transition-all" onClick={() => navigate('/screens')}>
              <div className="flex justify-between items-start">
                 <div className="bg-[#e0e0ff] p-4 rounded-3xl text-[#3f51b5]"><Monitor className="w-8 h-8" /></div>
                 <div className="flex items-center gap-2">
                   <Wifi className={`w-5 h-5 ${liveScreens.length > 0 ? 'text-emerald-500 animate-pulse' : 'text-[#777680]'}`} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#777680]">Sync</span>
                 </div>
              </div>
              <div>
                <p className="text-5xl font-black text-[#1b1b1f]">{liveScreens.length}<span className="text-xl text-[#777680] ml-2 font-bold">/ {screens.length}</span></p>
                <p className="text-xs font-black uppercase tracking-widest text-[#777680] mt-2">Live Displays</p>
              </div>
            </Card>

            <Card className="bg-white p-8 flex flex-col justify-between h-52 group cursor-pointer hover:bg-[#f3f3f7] transition-all" onClick={() => navigate('/tvs')}>
              <div className="flex justify-between items-start">
                 <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600"><Tv className="w-8 h-8" /></div>
                 <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${onlineTVs.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-[#777680]'}`} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#777680]">Online</span>
                 </div>
              </div>
              <div>
                <p className="text-5xl font-black text-[#1b1b1f]">{onlineTVs.length}<span className="text-xl text-[#777680] ml-2 font-bold">/ {physicalTVs.length}</span></p>
                <p className="text-xs font-black uppercase tracking-widest text-[#777680] mt-2">Hardware Nodes</p>
              </div>
            </Card>

            <Card className="bg-white p-8 flex flex-col justify-between h-52 group cursor-pointer hover:bg-[#f3f3f7] transition-all" onClick={() => navigate('/media')}>
              <div className="flex justify-between items-start">
                 <div className="bg-[#e1e2f6] p-4 rounded-3xl text-[#191a2c]"><ImageIcon className="w-8 h-8" /></div>
                 <ChevronRight className="w-6 h-6 text-[#777680] group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <p className="text-5xl font-black text-[#1b1b1f]">{allMedia.length}</p>
                <p className="text-xs font-black uppercase tracking-widest text-[#777680] mt-2">Media Assets</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white p-6 flex flex-col justify-between h-40 group cursor-pointer hover:bg-[#f3f3f7] transition-all" onClick={() => navigate('/schedules')}>
              <div className="flex justify-between items-start">
                 <div className="bg-purple-50 p-3 rounded-2xl text-purple-600"><Clock className="w-6 h-6" /></div>
                 <span className="text-[9px] font-black text-[#777680] uppercase tracking-widest">{activeSchedules.length} Active</span>
              </div>
              <div>
                <p className="text-3xl font-black text-[#1b1b1f]">{schedules.length}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#777680] mt-1">Schedules</p>
              </div>
            </Card>

            <Card className="bg-white p-6 flex flex-col justify-between h-40 group cursor-pointer hover:bg-[#f3f3f7] transition-all" onClick={() => navigate('/media')}>
              <div className="flex justify-between items-start">
                 <div className="bg-blue-50 p-3 rounded-2xl text-blue-600"><Play className="w-6 h-6" /></div>
                 <span className="text-[9px] font-black text-[#777680] uppercase tracking-widest">Total Items</span>
              </div>
              <div>
                <p className="text-3xl font-black text-[#1b1b1f]">{totalPlaylistItems}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#777680] mt-1">Playlist Items</p>
              </div>
            </Card>

            <Card className="bg-white p-6 flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                 <div className="bg-orange-50 p-3 rounded-2xl text-orange-600"><TrendingUp className="w-6 h-6" /></div>
                 <span className="text-[9px] font-black text-[#777680] uppercase tracking-widest">Breakdown</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#777680]">Videos:</span>
                  <span className="font-black text-[#1b1b1f]">{videoCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#777680]">Images:</span>
                  <span className="font-black text-[#1b1b1f]">{imageCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#777680]">PDFs:</span>
                  <span className="font-black text-[#1b1b1f]">{pdfCount}</span>
                </div>
              </div>
            </Card>

            <Card className="bg-[#1b1b1f] p-6 text-white flex flex-col justify-between h-40 border-none">
              <div className="flex justify-between items-start">
                 <div className="bg-white/10 p-3 rounded-2xl text-[#e0e0ff]"><HardDrive className="w-6 h-6" /></div>
                 <span className="text-[9px] font-black text-[#e0e0ff] uppercase tracking-widest">Storage</span>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-2xl font-black">{storageUsed.toFixed(1)} MB</p>
                  <p className="text-[9px] font-black opacity-40">OF {planConfig.storageMB} MB</p>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#3f51b5] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (storageUsed / planConfig.storageMB) * 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Broadcasts */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-[#1b1b1f] px-2 uppercase tracking-widest">Active Broadcasts</h2>
                <Button variant="tonal" onClick={() => navigate('/screens')} className="rounded-xl text-xs">View All</Button>
              </div>
              {liveScreens.length === 0 ? (
                <Card className="py-20 bg-[#f3f3f7] border-2 border-dashed border-[#e4e1ec] text-center flex flex-col items-center gap-4">
                   <Tv className="w-12 h-12 text-[#c4c6d0]" />
                   <p className="text-[#1b1b1f] font-black text-lg">No screens currently broadcasting</p>
                   <Button onClick={() => navigate('/screens')} className="rounded-2xl">Pair hardware now</Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {liveScreens.slice(0, 4).map((screen) => {
                    const media = allMedia.find(m => m.id === screen.playlist[0]?.mediaId);
                    const assignedTV = physicalTVs.find(tv => tv.assignedScreenId === screen.id);
                    return (
                      <Card 
                        key={screen.id} 
                        className="p-0 overflow-hidden border-[#e4e1ec] hover:border-[#3f51b5]/30 transition-all flex group cursor-pointer shadow-sm"
                        onClick={() => navigate(`/screens/${screen.id}`)}
                      >
                        <div className={`relative bg-black shrink-0 ${screen.orientation === 'portrait' ? 'w-24 aspect-[9/16]' : 'w-48 aspect-video'}`}>
                          {media ? (
                            media.type === MediaType.VIDEO ? (
                              <video src={media.url} muted className="w-full h-full object-cover opacity-60" />
                            ) : (
                              <img src={media.url} className="w-full h-full object-cover opacity-60" />
                            )
                          ) : (
                            <Monitor className="w-8 h-8 text-white/20 m-auto" />
                          )}
                          <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        </div>
                        <div className="p-6 flex flex-col justify-between flex-1 min-w-0">
                          <div>
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <h3 className="font-black text-[#1b1b1f] truncate leading-tight uppercase tracking-tight">{screen.name}</h3>
                              {screen.orientation === 'portrait' ? <Smartphone className="w-4 h-4 text-[#777680]" /> : <MonitorPlay className="w-4 h-4 text-[#777680]" />}
                            </div>
                            <p className="text-[10px] font-black text-[#777680] uppercase tracking-widest truncate">Currently Showing: {media?.name || 'Empty Loop'}</p>
                            {assignedTV && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${assignedTV.status === 'online' ? 'bg-emerald-500' : 'bg-[#777680]'}`} />
                                <span className="text-[9px] font-black text-[#777680] uppercase">{assignedTV.status === 'online' ? 'TV Online' : 'TV Offline'}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-4">
                              <span className="text-[10px] font-black text-[#3f51b5] uppercase tracking-widest">{screen.playlist.length} Items</span>
                              <ExternalLink className="w-4 h-4 text-[#777680]" />
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions & Status */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1b1b1f] px-2 uppercase tracking-widest">Quick Actions</h2>
              
              <div className="space-y-3">
                <Button onClick={() => navigate('/screens', { state: { openCreate: true }})} className="w-full rounded-xl justify-start h-14">
                  <Plus className="w-5 h-5 mr-3" />
                  Create New Screen
                </Button>
                <Button variant="tonal" onClick={() => navigate('/media')} className="w-full rounded-xl justify-start h-14">
                  <ImageIcon className="w-5 h-5 mr-3" />
                  Upload Media
                </Button>
                <Button variant="tonal" onClick={() => navigate('/tvs')} className="w-full rounded-xl justify-start h-14">
                  <Tv className="w-5 h-5 mr-3" />
                  Manage TVs
                </Button>
                <Button variant="tonal" onClick={() => navigate('/schedules')} className="w-full rounded-xl justify-start h-14">
                  <Clock className="w-5 h-5 mr-3" />
                  View Schedules
                </Button>
              </div>

              {/* System Status */}
              <Card className="p-6 space-y-4">
                <h3 className="text-sm font-black text-[#1b1b1f] uppercase tracking-widest">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-[#1b1b1f]">Screens</span>
                    </div>
                    <span className="text-xs font-black text-[#777680]">{screens.length} Total</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {onlineTVs.length > 0 ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      )}
                      <span className="text-xs font-bold text-[#1b1b1f]">Hardware</span>
                    </div>
                    <span className="text-xs font-black text-[#777680]">{onlineTVs.length}/{physicalTVs.length} Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[#3f51b5]" />
                      <span className="text-xs font-bold text-[#1b1b1f]">Broadcasts</span>
                    </div>
                    <span className="text-xs font-black text-[#777680]">{liveScreens.length} Active</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
