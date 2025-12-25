
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { getApiBase, getTvPlayerPath, getApiHeaders } from '../services/config';
import { getDeviceId } from '../services/deviceFingerprint';
import { MediaItem, Screen, MediaType, PlanType } from '../types';
import { 
  Wifi, RefreshCcw, LogOut, Tv, AlertCircle, Maximize2, Menu, Info, X, Key, RotateCcw
} from 'lucide-react';

const PublicPlayer: React.FC = () => {
  const { screenCode } = useParams<{ screenCode: string }>();
  const navigate = useNavigate();
  
  const [playlist, setPlaylist] = useState<{ media: MediaItem, duration: number, key: string }[]>([]);
  const [screenInfo, setScreenInfo] = useState<Screen | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualScreenCode, setManualScreenCode] = useState('');
  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString());
  const [deviceId, setDeviceId] = useState<string>('');

  const heartbeatRef = useRef<number | null>(null);

  // Get device_id on mount (stable fingerprint-based)
  useEffect(() => {
    const initializeDevice = async () => {
      try {
        const id = await getDeviceId();
        setDeviceId(id);
      } catch (err) {
        console.error('Failed to get device ID:', err);
        // Fallback to random ID if fingerprinting fails
        const fallbackId = `tv_${StorageService.generateCode().toLowerCase()}`;
        localStorage.setItem('menupi_device_id', fallbackId);
        setDeviceId(fallbackId);
      }
    };
    
    initializeDevice();
  }, []);

  const sync = useCallback(async () => {
    if (!screenCode) return;
    try {
      const API_BASE = getApiBase();
      
      // Get screen data from public endpoint
      const res = await fetch(`${API_BASE}/api/screens/public/${screenCode}`, {
        headers: getApiHeaders()
      });
      if (!res.ok) {
        if (res.status === 404) {
          setError("Screen not found. Please check the screen code.");
        } else {
          setError("Failed to load screen data.");
        }
        return;
      }

      const data = await res.json();
      
      // Map to Screen format
      const profile: Screen = {
        id: data.id,
        name: data.name,
        screenCode: data.screenCode,
        status: data.lastPing && (Date.now() - data.lastPing < 60000) ? 'live' : 'offline',
        orientation: data.orientation || 'landscape',
        aspectRatio: data.aspectRatio || '16:9',
        playlist: data.playlist || [],
        isPaused: false
      };

      setScreenInfo(profile);
      setLastSync(new Date().toLocaleTimeString());
      
      // Save screen code locally
      localStorage.setItem('menupi_screen_code', screenCode);
      
      // Update Heartbeat for Dashboard (use device_id if available)
      if (deviceId) {
        await fetch(`${API_BASE}/api/tvs/heartbeat`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({ deviceId })
        });
      }

      // Use media from the response
      const items = profile.playlist.map((item, idx) => {
        const m = data.media?.find((am: any) => am.id === item.mediaId);
        if (!m) return null;
        return { 
          media: {
            id: m.id,
            name: m.name,
            type: m.type,
            url: m.url,
            thumbnail_url: m.thumbnail_url || m.url,
            size_mb: m.size_mb || 0,
            duration: m.duration || 10,
            createdAt: m.createdAt || Date.now(),
            normalized_format: m.normalized_format || 'jpg'
          }, 
          duration: item.duration || 10, 
          key: `${m.id}-${idx}` 
        };
      }).filter(Boolean) as any[];
      
      setPlaylist(items);
      setError(null);
    } catch (err) { 
      console.warn("Sync failed:", err);
      setError("Connection error. Retrying...");
    }
  }, [screenCode, deviceId]);

  // Priority check: Dashboard assignment > Manual screen code
  useEffect(() => {
    if (!deviceId || !screenCode) return;
    
    // Check for dashboard assignment first (Priority 1)
    const checkDashboardAssignment = async () => {
      try {
        const API_BASE = getApiBase();
        const res = await fetch(`${API_BASE}/api/tvs/public/${deviceId}`, {
          headers: getApiHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          if (data.paired && data.tv && data.tv.assignedScreenCode) {
            // Dashboard assignment exists - use it (overrides manual entry)
            const assignedCode = data.tv.assignedScreenCode;
            if (assignedCode !== screenCode) {
              localStorage.setItem('menupi_screen_code', assignedCode);
              navigate(getTvPlayerPath(assignedCode), { replace: true });
              return;
            }
          }
        }
      } catch (err) {
        // Continue with current screen code
      }
    };
    
    // Check every 30 seconds for dashboard assignment changes
    checkDashboardAssignment();
    const interval = setInterval(checkDashboardAssignment, 30000);
    return () => clearInterval(interval);
  }, [deviceId, screenCode, navigate]);

  // Handle manual screen code entry
  const handleManualScreenCode = async () => {
    if (!manualScreenCode.trim() || !deviceId) return;
    
    try {
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/api/tvs/assign-screen-code`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ 
          deviceId, 
          screenCode: manualScreenCode.trim().toUpperCase() 
        })
      });
      
      if (!res.ok) {
        let error;
        try {
          error = await res.json();
        } catch {
          error = { error: 'Network error', message: 'Failed to connect to server.' };
        }
        
        if (res.status === 404) {
          setError(error.message || `Screen code "${manualScreenCode.trim().toUpperCase()}" not found.`);
        } else {
          setError(error.message || error.error || 'Failed to assign screen code');
        }
        return;
      }
      
      // Save screen code locally
      localStorage.setItem('menupi_screen_code', manualScreenCode.trim().toUpperCase());
      
      // Navigate to player
      navigate(getTvPlayerPath(manualScreenCode.trim().toUpperCase()));
      setShowManualEntry(false);
      setManualScreenCode('');
    } catch (err) {
      setError('Failed to assign screen code');
    }
  };

  // Reset/Change TV code
  const handleResetTVCode = () => {
    if (!confirm('Reset TV code? This will unpair the device and return to pairing mode.')) return;
    
    // Generate new device_id
    const newDeviceId = `tv_${StorageService.generateCode().toLowerCase()}`;
    localStorage.setItem('menupi_device_id', newDeviceId);
    localStorage.removeItem('menupi_screen_code');
    setDeviceId(newDeviceId);
    
    // Navigate back to pairing
    navigate(getTvPlayerPath());
  };

  useEffect(() => {
    sync();
    heartbeatRef.current = window.setInterval(sync, 15000); 
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [sync]);

  useEffect(() => {
    if (playlist.length <= 1) return;
    const item = playlist[currentIndex];
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }, (item?.duration || 10) * 1000);
    return () => clearTimeout(timer);
  }, [currentIndex, playlist]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const current = playlist[currentIndex];

  if (error) return (
    <div 
      className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-center p-6 md:p-8 lg:p-12"
      style={{
        aspectRatio: '16/9',
        minHeight: '100vh',
        minWidth: '100vw'
      }}
    >
      <AlertCircle className="w-16 h-16 md:w-20 md:h-20 text-slate-700 mb-6 md:mb-8" />
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-2 uppercase tracking-tighter">Offline Mode</h2>
      <p className="text-slate-500 mb-6 md:mb-8 text-sm md:text-base">{error}</p>
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <button onClick={() => window.location.reload()} className="bg-white text-black px-6 md:px-8 py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base">Retry Sync</button>
        <button onClick={() => navigate(getTvPlayerPath())} className="bg-slate-800 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base">Unpair TV</button>
      </div>
    </div>
  );

  // Determine display mode based on screen orientation
  const isPortrait = screenInfo?.orientation === 'portrait';
  const displayMode = screenInfo?.displayMode || 'contain';

  return (
    <div 
      className={`fixed inset-0 bg-black flex items-center justify-center overflow-hidden ${isPortrait ? 'portrait-mode' : 'landscape-mode'}`}
      onClick={() => setShowControls(true)}
      style={{
        aspectRatio: isPortrait ? '9/16' : '16/9',
        width: '100vw',
        height: '100vh'
      }}
    >
        {current ? (
          <div 
            key={current.key} 
            className="w-full h-full animate-in fade-in duration-700 flex items-center justify-center"
            style={{
              aspectRatio: isPortrait ? '9/16' : '16/9'
            }}
          >
            {current.media.type === MediaType.VIDEO || current.media.type === 'video' ? (
                <video 
                  src={current.media.url} 
                  autoPlay 
                  muted 
                  playsInline 
                  loop 
                  className={`w-full h-full ${displayMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                />
            ) : current.media.type === MediaType.IMAGE || current.media.type === MediaType.GIF || current.media.type === 'image' || current.media.type === 'gif' ? (
                <img 
                  src={current.media.url} 
                  className={`w-full h-full ${displayMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                  alt={current.media.name || "signage"} 
                />
            ) : current.media.type === MediaType.PDF || current.media.type === 'pdf' ? (
                <iframe 
                  src={current.media.url} 
                  className="w-full h-full border-0" 
                  title={current.media.name || "PDF Document"}
                  style={{
                    aspectRatio: isPortrait ? '9/16' : '16/9'
                  }}
                />
            ) : (
                <img 
                  src={current.media.url} 
                  className={`w-full h-full ${displayMode === 'cover' ? 'object-cover' : 'object-contain'}`}
                  alt={current.media.name || "signage"} 
                />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-white/60">
             <Tv className="w-16 h-16 animate-pulse" />
             <span className="text-xs font-black uppercase tracking-[0.5em]">Fetching Loop...</span>
          </div>
        )}

        {/* TV Control Layer (Limited Access) */}
        {showControls && (
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 flex flex-col items-center justify-center p-4 md:p-6 lg:p-8 xl:p-12"
            style={{
              aspectRatio: isPortrait ? '9/16' : '16/9'
            }}
            onClick={(e) => e.stopPropagation()}
          >
             <div className="w-full max-w-[95vw] md:max-w-2xl bg-slate-900 border border-white/10 rounded-[24px] md:rounded-[32px] lg:rounded-[40px] p-4 md:p-6 lg:p-8 xl:p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <button onClick={(e) => { e.stopPropagation(); setShowControls(false); }} className="absolute top-4 md:top-6 lg:top-8 right-4 md:right-6 lg:right-8 text-white/40 hover:text-white z-10">
                  <X className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                </button>
                
                <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8 lg:mb-12">
                   <div className="p-3 md:p-4 lg:p-5 bg-indigo-600 rounded-2xl md:rounded-3xl"><Tv className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white" /></div>
                   <div>
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight">{screenInfo?.name || 'Local Player'}</h3>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-xs mt-1">ID: {screenCode} • Sync: {lastSync}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:gap-6">
                   <button onClick={() => window.location.reload()} className="flex flex-col items-center gap-2 md:gap-3 lg:gap-4 p-4 md:p-6 lg:p-8 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl md:rounded-3xl transition-all">
                      <RefreshCcw className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-indigo-400" />
                      <span className="text-xs md:text-sm font-black text-white uppercase tracking-widest">Reload Feed</span>
                   </button>
                   <button onClick={toggleFullscreen} className="flex flex-col items-center gap-2 md:gap-3 lg:gap-4 p-4 md:p-6 lg:p-8 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl md:rounded-3xl transition-all">
                      <Maximize2 className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-emerald-400" />
                      <span className="text-xs md:text-sm font-black text-white uppercase tracking-widest">Toggle Fullscreen</span>
                   </button>
                   <button onClick={() => setShowManualEntry(true)} className="flex flex-col items-center gap-2 md:gap-3 lg:gap-4 p-4 md:p-6 lg:p-8 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl md:rounded-3xl transition-all">
                      <Key className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-yellow-400" />
                      <span className="text-xs md:text-sm font-black text-white uppercase tracking-widest">Enter Screen Code</span>
                   </button>
                   <button onClick={handleResetTVCode} className="flex flex-col items-center gap-2 md:gap-3 lg:gap-4 p-4 md:p-6 lg:p-8 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl md:rounded-3xl transition-all">
                      <RotateCcw className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-orange-400" />
                      <span className="text-xs md:text-sm font-black text-white uppercase tracking-widest">Reset TV Code</span>
                   </button>
                   <div className="col-span-2 p-4 md:p-5 lg:p-6 bg-slate-800/50 rounded-2xl md:rounded-3xl border border-white/5 flex items-start gap-3 md:gap-4">
                      <Info className="w-5 h-5 md:w-6 md:h-6 text-indigo-400 mt-0.5 md:mt-1 shrink-0" />
                      <div>
                        <p className="text-xs md:text-sm font-bold text-white">Security Notice</p>
                        <p className="text-[10px] md:text-xs text-slate-400 leading-relaxed mt-1">Player settings are managed from the Dashboard. TV-side editing is disabled to prevent tampering.</p>
                      </div>
                   </div>
                </div>
                
                {showManualEntry && (
                  <div className="mt-4 md:mt-6 p-4 md:p-6 bg-slate-800/70 rounded-2xl border border-white/10">
                    <p className="text-xs md:text-sm font-bold text-white mb-3">Enter Screen Code</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualScreenCode}
                        onChange={(e) => setManualScreenCode(e.target.value.toUpperCase())}
                        placeholder="SCR-XXXXX"
                        className="flex-1 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleManualScreenCode()}
                      />
                      <button
                        onClick={handleManualScreenCode}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => { setShowManualEntry(false); setManualScreenCode(''); }}
                        className="px-4 py-2 bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    {error && (
                      <p className="text-xs text-red-400 mt-2">{error}</p>
                    )}
                  </div>
                )}
             </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          body { 
            background: black !important; 
            cursor: none; 
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          html {
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          .portrait-mode {
            aspect-ratio: 9/16;
          }
          .landscape-mode {
            aspect-ratio: 16/9;
          }
        ` }} />
    </div>
  );
};

export default PublicPlayer;
