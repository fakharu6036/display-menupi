
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StorageService } from '../services/storage';
import { PhysicalTV, Screen, UserRole } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Html5Qrcode } from 'html5-qrcode';
import { getApiBase } from '../services/config';
import { 
  Tv, Plus, Wifi, Clock, RefreshCcw, AlertCircle, Scan, Search, Filter, 
  CheckCircle2, X, CheckSquare, Square, MoreVertical, Activity, 
  TrendingUp, Zap, Unlink, Link2, Eye, EyeOff, Download, Upload, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type FilterType = 'all' | 'online' | 'offline' | 'assigned' | 'unassigned';
type SortType = 'name' | 'status' | 'lastSeen' | 'screen';

const PhysicalTVs: React.FC = () => {
  const navigate = useNavigate();
  const [tvs, setTvs] = useState<PhysicalTV[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('lastSeen');
  const [selectedTVs, setSelectedTVs] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const [user, setUser] = useState(StorageService.getUser());
  const hasLoadedRef = useRef(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingTVId, setDeletingTVId] = useState<string | null>(null);
  
  // Update user when storage changes - but only if user actually changed
  useEffect(() => {
    const handleStorageChange = () => {
      const newUser = StorageService.getUser();
      setUser(prevUser => {
        // Only update if user ID changed to prevent unnecessary re-renders
        if (prevUser?.id !== newUser?.id) {
          hasLoadedRef.current = false; // Reset load flag if user changed
          return newUser;
        }
        return prevUser;
      });
    };
    window.addEventListener('menupi-storage-change', handleStorageChange);
    return () => window.removeEventListener('menupi-storage-change', handleStorageChange);
  }, []);
  
  const canEdit = StorageService.canEdit(user);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [t, s] = await Promise.all([
        StorageService.getPhysicalTVs(),
        StorageService.getScreens()
      ]);
      setTvs(t || []);
      setScreens(s || []);
      hasLoadedRef.current = true;
    } catch (err) {
      console.error("TV Load Failed", err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty deps - load function is stable

  // Initial load - only run once when user is available
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Only load once - use ref to track
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, navigate]); // Only depend on user.id, not entire user object

  // Separate effect for auto-refresh - only depends on user
  useEffect(() => {
    if (!user || !hasLoadedRef.current) return;
    
    // Fixed interval for auto-refresh
    const interval = 15000; // 15 seconds
    
    const intv = setInterval(() => {
      // Call services directly to avoid dependency on load function
      Promise.all([
        StorageService.getPhysicalTVs(),
        StorageService.getScreens()
      ]).then(([t, s]) => {
        setTvs(prev => {
          // Only update if data changed
          const newTvs = t || [];
          if (JSON.stringify(prev) !== JSON.stringify(newTvs)) {
            return newTvs;
          }
          return prev;
        });
        setScreens(prev => {
          // Only update if data changed
          const newScreens = s || [];
          if (JSON.stringify(prev) !== JSON.stringify(newScreens)) {
            return newScreens;
          }
          return prev;
        });
      }).catch(err => {
        console.error("TV Auto-refresh failed:", err);
      });
    }, interval);
    
    return () => clearInterval(intv);
  }, [user]); // Only depend on user

  // Smart filtering and sorting
  const filteredAndSortedTVs = useMemo(() => {
    let filtered = [...tvs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tv => 
        tv.name?.toLowerCase().includes(query) ||
        tv.id.toLowerCase().includes(query) ||
        tv.hardware_id?.toLowerCase().includes(query) ||
        screens.find(s => s.id === tv.assignedScreenId)?.name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filter === 'online') {
      filtered = filtered.filter(tv => tv.status === 'online');
    } else if (filter === 'offline') {
      filtered = filtered.filter(tv => tv.status === 'offline');
    } else if (filter === 'assigned') {
      filtered = filtered.filter(tv => tv.assignedScreenId);
    } else if (filter === 'unassigned') {
      filtered = filtered.filter(tv => !tv.assignedScreenId);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'status':
          return a.status === 'online' ? -1 : 1;
        case 'lastSeen':
          return b.lastSeen - a.lastSeen;
        case 'screen':
          const aScreen = screens.find(s => s.id === a.assignedScreenId)?.name || '';
          const bScreen = screens.find(s => s.id === b.assignedScreenId)?.name || '';
          return aScreen.localeCompare(bScreen);
        default:
          return 0;
      }
    });

    return filtered;
  }, [tvs, searchQuery, filter, sortBy, screens]);

  // Statistics
  const stats = useMemo(() => {
    const online = tvs.filter(tv => tv.status === 'online').length;
    const offline = tvs.filter(tv => tv.status === 'offline').length;
    const assigned = tvs.filter(tv => tv.assignedScreenId).length;
    const unassigned = tvs.filter(tv => !tv.assignedScreenId).length;
    return { total: tvs.length, online, offline, assigned, unassigned };
  }, [tvs]);

  const handleAssign = async (tvId: string, screenId: string) => {
    try {
      // If removing screen assignment, confirm first
      if (screenId === "none") {
        const tv = tvs.find(t => t.id === tvId);
        const currentScreen = tv?.assignedScreenId ? screens.find(s => s.id === tv.assignedScreenId) : null;
        
        if (currentScreen) {
          if (!confirm(`Remove screen assignment from "${currentScreen.name}"? The TV will stop displaying content.`)) {
            return;
          }
        }
      } else {
        // Check for conflicts when assigning
        const conflictingTV = tvs.find(tv => 
          tv.assignedScreenId === screenId && tv.id !== tvId && tv.status === 'online'
        );
        if (conflictingTV) {
          if (!confirm(`Screen is already assigned to ${conflictingTV.name || conflictingTV.id}. Replace assignment?`)) {
            return;
          }
        }
      }
      
      await StorageService.assignScreenToTV(tvId, screenId === "none" ? undefined : screenId);
      await load();
    } catch (err: any) {
      alert(err.message || 'Failed to assign screen');
    }
  };

  const handleBulkAssign = async (screenId: string) => {
    if (selectedTVs.size === 0 || !screenId || screenId === "none") return;
    
    setIsBulkOperating(true);
    try {
      const promises = Array.from(selectedTVs).map(tvId => 
        StorageService.assignScreenToTV(tvId, screenId)
      );
      await Promise.all(promises);
      await load();
      setSelectedTVs(new Set());
      setShowBulkActions(false);
      alert(`Successfully assigned ${selectedTVs.size} TV(s) to screen`);
    } catch (err: any) {
      alert(err.message || 'Failed to bulk assign');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkUnpair = async () => {
    if (selectedTVs.size === 0) return;
    if (!confirm(`Unpair ${selectedTVs.size} TV(s)?`)) return;
    
    setIsBulkOperating(true);
    try {
      const promises = Array.from(selectedTVs).map(tvId => 
        StorageService.assignScreenToTV(tvId, undefined)
      );
      await Promise.all(promises);
      await load();
      setSelectedTVs(new Set());
      setShowBulkActions(false);
    } catch (err: any) {
      alert(err.message || 'Failed to unpair TVs');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const toggleSelectTV = (tvId: string) => {
    const next = new Set(selectedTVs);
    if (next.has(tvId)) {
      next.delete(tvId);
    } else {
      next.add(tvId);
    }
    setSelectedTVs(next);
    setShowBulkActions(next.size > 0);
  };

  const selectAll = () => {
    if (selectedTVs.size === filteredAndSortedTVs.length) {
      setSelectedTVs(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedTVs(new Set(filteredAndSortedTVs.map(tv => tv.id)));
      setShowBulkActions(true);
    }
  };

  const startQRScanner = (screenId: string) => {
    setSelectedScreenId(screenId);
    setIsScanning(true);
    setScanError(null);
    
    const startScan = async () => {
      try {
        const scannerId = "tv-qr-reader";
        const qrCodeScanner = new Html5Qrcode(scannerId);
        qrCodeScannerRef.current = qrCodeScanner;

        await qrCodeScanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            handleQRCodeDetected(decodedText, screenId);
          },
          () => {
            // Ignore scanning errors
          }
        );
      } catch (err: any) {
        console.error("Scanner error:", err);
        setScanError(err.message || "Failed to start camera");
        setIsScanning(false);
      }
    };

    setTimeout(startScan, 100);
  };

  const handleQRCodeDetected = async (qrText: string, screenId: string) => {
    try {
      if (!qrText.startsWith('MENUPI:')) {
        setScanError('Invalid QR code format. Please scan a TV pairing code.');
        return;
      }

      const deviceId = qrText.replace('MENUPI:', '').trim();
      if (!deviceId) {
        setScanError('Invalid device ID in QR code.');
        return;
      }

      stopQRScanner();

      // Check if device already exists and is assigned
      const existingTV = tvs.find(tv => tv.id === deviceId || tv.hardware_id === deviceId);
      if (existingTV && existingTV.assignedScreenId && existingTV.assignedScreenId !== screenId) {
        const screenName = screens.find(s => s.id === existingTV.assignedScreenId)?.name || 'another screen';
        if (!confirm(`This TV is already assigned to ${screenName}. Reassign to selected screen?`)) {
          return;
        }
      }

      await StorageService.assignScreenToTV(deviceId, screenId);
      await load();
      
      alert(`TV paired successfully! Device is now connected to the selected screen.`);
    } catch (err: any) {
      console.error("QR pairing error:", err);
      setScanError(err.message || 'Failed to pair device');
    }
  };

  const stopQRScanner = async () => {
    if (qrCodeScannerRef.current) {
      try {
        await qrCodeScannerRef.current.stop();
        await qrCodeScannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      qrCodeScannerRef.current = null;
    }
    setIsScanning(false);
    setSelectedScreenId(null);
    setScanError(null);
  };

  const getTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 1000 / 60);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getConnectionQuality = (tv: PhysicalTV): 'excellent' | 'good' | 'poor' => {
    if (tv.status === 'offline') return 'poor';
    const minutesSince = Math.floor((Date.now() - tv.lastSeen) / 1000 / 60);
    if (minutesSince < 1) return 'excellent';
    if (minutesSince < 5) return 'good';
    return 'poor';
  };

  const handleDeleteTV = async (tvId: string, tvName: string) => {
    if (!confirm(`Are you sure you want to remove "${tvName || tvId}" from management? The device will still run but will no longer appear in /tvs.`)) {
      return;
    }
    
    setDeletingTVId(tvId);
    try {
      await StorageService.removeAndroidTV(tvId);
      await load();
      alert('Android TV device removed from management. Device still runs but is no longer controlled by this account.');
    } catch (err: any) {
      alert(err.message || 'Failed to remove Android TV device');
    } finally {
      setDeletingTVId(null);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#1b1b1f] tracking-tight">Android TV Devices</h1>
          <p className="text-[#44474e] font-medium mt-1">Manually add and manage your Android TV displays. Only manually added Android TVs are shown here.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="tonal" onClick={() => load()} className="rounded-xl" disabled={loading}>
             <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
           </Button>
           {canEdit && (
             <Button onClick={() => setShowAddModal(true)} className="rounded-xl">
               <Plus className="w-4 h-4 mr-2" /> Add Android TV
             </Button>
           )}
        </div>
      </div>

      {/* Statistics Cards */}
      {!loading && tvs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 bg-white border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-[#777680] uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-[#1b1b1f] mt-1">{stats.total}</p>
              </div>
              <Tv className="w-8 h-8 text-[#3f51b5] opacity-20" />
            </div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Online</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{stats.online}</p>
              </div>
              <Wifi className="w-8 h-8 text-emerald-600 opacity-30" />
            </div>
          </Card>
          <Card className="p-4 bg-slate-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Offline</p>
                <p className="text-2xl font-black text-slate-600 mt-1">{stats.offline}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-slate-400 opacity-30" />
            </div>
          </Card>
          <Card className="p-4 bg-indigo-50 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Assigned</p>
                <p className="text-2xl font-black text-indigo-700 mt-1">{stats.assigned}</p>
              </div>
              <Link2 className="w-8 h-8 text-indigo-600 opacity-30" />
            </div>
          </Card>
          <Card className="p-4 bg-amber-50 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Unassigned</p>
                <p className="text-2xl font-black text-amber-700 mt-1">{stats.unassigned}</p>
              </div>
              <Unlink className="w-8 h-8 text-amber-600 opacity-30" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      {!loading && tvs.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#777680] pointer-events-none" />
            <Input
              placeholder="Search by name, ID, or screen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-4 py-3 bg-white border border-[#e4e1ec] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#e0e0ff]"
            >
              <option value="all">All TVs</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="px-4 py-3 bg-white border border-[#e4e1ec] rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#e0e0ff]"
            >
              <option value="lastSeen">Last Seen</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="screen">Screen</option>
            </select>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && selectedTVs.size > 0 && (
        <Card className="p-4 bg-[#3f51b5] text-white border-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold">{selectedTVs.size} TV(s) selected</span>
              <button
                onClick={selectAll}
                className="text-white/80 hover:text-white text-sm font-bold"
              >
                {selectedTVs.size === filteredAndSortedTVs.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex gap-2">
              {canEdit && screens.length > 0 && (
                <select
                  onChange={(e) => handleBulkAssign(e.target.value)}
                  disabled={isBulkOperating}
                  className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  defaultValue=""
                >
                  <option value="" disabled>Assign to Screen...</option>
                  {screens.map(s => (
                    <option key={s.id} value={s.id} className="text-[#1b1b1f]">{s.name}</option>
                  ))}
                </select>
              )}
              {canEdit && (
                <Button
                  variant="tonal"
                  onClick={handleBulkUnpair}
                  disabled={isBulkOperating}
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  <Unlink className="w-4 h-4 mr-2" /> Unpair
                </Button>
              )}
              <Button
                variant="tonal"
                onClick={() => {
                  setSelectedTVs(new Set());
                  setShowBulkActions(false);
                }}
                className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
           <RefreshCcw className="w-12 h-12 text-[#3f51b5] animate-spin" />
           <p className="font-bold text-[#777680]">Connecting to network...</p>
        </div>
      ) : tvs.length === 0 ? (
        <Card className="py-32 text-center bg-[#f3f3f7] border-2 border-dashed border-[#e4e1ec]">
           <Tv className="w-16 h-16 text-[#c4c6d0] mx-auto mb-4" />
           <p className="text-[#1b1b1f] font-black text-xl">No Android TV devices added</p>
           <p className="text-[#777680] mt-2">Manually add Android TV devices to manage them here.</p>
           {canEdit && (
             <Button onClick={() => setShowAddModal(true)} className="mt-8 rounded-xl px-10">
               <Plus className="w-4 h-4 mr-2" /> Add Android TV Device
             </Button>
           )}
        </Card>
      ) : filteredAndSortedTVs.length === 0 ? (
        <Card className="py-32 text-center bg-[#f3f3f7] border-2 border-dashed border-[#e4e1ec]">
           <Filter className="w-16 h-16 text-[#c4c6d0] mx-auto mb-4" />
           <p className="text-[#1b1b1f] font-black text-xl">No TVs match your filters</p>
           <Button variant="tonal" onClick={() => {
             setSearchQuery('');
             setFilter('all');
           }} className="mt-8 rounded-xl">Clear Filters</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedTVs.map((tv) => {
            const isOffline = tv.status === 'offline';
            const timeSince = getTimeAgo(tv.lastSeen);
            const connectionQuality = getConnectionQuality(tv);
            const assignedScreen = screens.find(s => s.id === tv.assignedScreenId);
            const isSelected = selectedTVs.has(tv.id);
            
            return (
              <Card 
                key={tv.id} 
                className={`p-0 overflow-hidden flex flex-col border-2 transition-all cursor-pointer ${
                  isSelected ? 'border-[#3f51b5] ring-2 ring-[#3f51b5]/20' : 
                  isOffline ? 'border-[#e4e1ec] opacity-70' : 
                  'border-transparent shadow-md shadow-indigo-500/5 hover:shadow-lg hover:shadow-indigo-500/10'
                }`}
                onClick={() => canEdit && toggleSelectTV(tv.id)}
              >
                <div className="p-6 space-y-6">
                  {/* Header with Selection */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectTV(tv.id);
                          }}
                          className="shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#3f51b5]" />
                          ) : (
                            <Square className="w-5 h-5 text-[#c4c6d0]" />
                          )}
                        </button>
                      )}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isOffline ? 'bg-slate-100 text-slate-400' : 
                        connectionQuality === 'excellent' ? 'bg-emerald-50 text-emerald-600' :
                        connectionQuality === 'good' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        <Tv className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-[#1b1b1f] truncate">{tv.name || 'Signage Node'}</h3>
                        <p className="text-[10px] font-black text-[#777680] uppercase tracking-widest mt-1 truncate">ID: {tv.id.substring(0, 12)}...</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTV(tv.id, tv.name || 'TV');
                            }}
                            disabled={deletingTVId === tv.id}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove this Android TV device"
                          >
                            {deletingTVId === tv.id ? (
                              <RefreshCcw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {isOffline ? (
                          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase">{timeSince}</span>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-white shadow-lg ${
                            connectionQuality === 'excellent' ? 'bg-emerald-500 shadow-emerald-500/20' :
                            connectionQuality === 'good' ? 'bg-amber-500 shadow-amber-500/20' :
                            'bg-red-500 shadow-red-500/20'
                          }`}>
                            <Wifi className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase">Live</span>
                          </div>
                        )}
                      </div>
                      {connectionQuality !== 'excellent' && !isOffline && (
                        <div className="flex items-center gap-1">
                          <Activity className={`w-3 h-3 ${
                            connectionQuality === 'good' ? 'text-amber-500' : 'text-red-500'
                          }`} />
                          <span className="text-[8px] font-black text-[#777680] uppercase">
                            {connectionQuality === 'good' ? 'Fair' : 'Weak'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assigned Screen Info */}
                  {assignedScreen && (
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Assigned Screen</p>
                          <p className="text-sm font-bold text-indigo-900 mt-1">{assignedScreen.name}</p>
                        </div>
                        {canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssign(tv.id, "none");
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove screen assignment"
                          >
                            <Unlink className="w-4 h-4" />
                          </button>
                        )}
                        {!canEdit && <Link2 className="w-5 h-5 text-indigo-600" />}
                      </div>
                    </div>
                  )}

                  {/* Offline Recovery */}
                  {isOffline && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
                       <AlertCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                       <div>
                          <p className="text-xs font-bold text-slate-700">Offline Recovery</p>
                          <p className="text-[10px] text-slate-500 leading-tight mt-1">Check internet connection or restart the TV browser.</p>
                       </div>
                    </div>
                  )}

                  {/* Profile Mapping */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#777680] uppercase tracking-widest">Profile Mapping</label>
                    <div className="flex gap-2">
                      <select 
                        disabled={!canEdit}
                        value={tv.assignedScreenId || "none"}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleAssign(tv.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-[#f3f3f7] border border-[#e4e1ec] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#e0e0ff] disabled:opacity-50 appearance-none cursor-pointer"
                      >
                         <option value="none">-- No Screen (Unassign) --</option>
                         {screens.map(s => (
                           <option key={s.id} value={s.id}>{s.name}</option>
                         ))}
                      </select>
                      {canEdit && screens.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startQRScanner(tv.assignedScreenId || screens[0].id);
                          }}
                          className="px-4 py-3 bg-[#3f51b5] text-white rounded-xl hover:bg-[#3f51b5]/90 transition-all"
                          title="Scan QR code to pair"
                        >
                          <Scan className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className={`p-3 flex items-center justify-between ${
                  isOffline ? 'bg-slate-200 text-slate-600' : 
                  connectionQuality === 'excellent' ? 'bg-emerald-500 text-white' :
                  connectionQuality === 'good' ? 'bg-amber-500 text-white' :
                  'bg-indigo-600 text-white'
                }`}>
                   <span className="text-[9px] font-black uppercase tracking-widest px-2">
                     {isOffline ? 'Waiting for pulse...' : 
                      assignedScreen ? `Broadcasting: ${assignedScreen.name}` : 
                      'Ready to Pair'}
                   </span>
                   {!isOffline && (
                     <div className="flex items-center gap-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                       <span className="text-[8px] font-black uppercase">{timeSince}</span>
                     </div>
                   )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* QR Scanner Modal */}
      <Modal isOpen={isScanning} onClose={stopQRScanner} title="Scan TV QR Code">
        <div className="space-y-4">
          <div className="relative bg-black rounded-2xl overflow-hidden" style={{ minHeight: '400px' }}>
            <div id="tv-qr-reader" className="w-full h-full" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
              <div className="w-full max-w-sm aspect-square border-4 border-[#3f51b5] rounded-3xl relative flex flex-col items-center justify-center overflow-hidden">
                <div className="w-full h-2 bg-[#3f51b5] absolute animate-pulse shadow-[0_0_20px_#3f51b5]" style={{ top: '50%', transform: 'translateY(-50%)' }} />
                <p className="text-white text-xs font-black uppercase tracking-widest mt-auto pb-8 drop-shadow-lg">Align QR Code</p>
              </div>
              {scanError && (
                <div className="mt-4 px-4 py-2 bg-red-500/90 text-white rounded-xl text-sm font-bold">
                  {scanError}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="tonal" onClick={stopQRScanner} className="flex-1 rounded-xl">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Add Android TV Modal */}
      <Modal isOpen={showAddModal} onClose={() => {
        setShowAddModal(false);
        setNewDeviceId('');
        setNewDeviceName('');
      }} title="Add Android TV Device">
        <div className="space-y-6">
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-sm text-indigo-900 font-bold">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Only Android TV devices can be added here. Make sure your device is running Android TV OS.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-[#777680] uppercase tracking-widest mb-2 block">
                Device ID *
              </label>
              <Input
                placeholder="Enter device ID (e.g., tv_abc123xyz)"
                value={newDeviceId}
                onChange={(e) => setNewDeviceId(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-[#777680] mt-2">
                You can find the device ID by opening tv.menupi.com on your Android TV and checking the device information.
              </p>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-[#777680] uppercase tracking-widest mb-2 block">
                Device Name (Optional)
              </label>
              <Input
                placeholder="Enter a friendly name (e.g., Main Display)"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="tonal"
              onClick={() => {
                setShowAddModal(false);
                setNewDeviceId('');
                setNewDeviceName('');
              }}
              className="flex-1 rounded-xl"
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!newDeviceId.trim()) {
                  alert('Please enter a device ID');
                  return;
                }
                
                setIsAdding(true);
                try {
                  await StorageService.manuallyAddAndroidTV(newDeviceId.trim(), newDeviceName.trim() || undefined);
                  await load();
                  setShowAddModal(false);
                  setNewDeviceId('');
                  setNewDeviceName('');
                  alert('Android TV device added successfully!');
                } catch (err: any) {
                  alert(err.message || 'Failed to add Android TV device');
                } finally {
                  setIsAdding(false);
                }
              }}
              className="flex-1 rounded-xl"
              disabled={isAdding || !newDeviceId.trim()}
            >
              {isAdding ? (
                <>
                  <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Add Device
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PhysicalTVs;
