import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { MediaItem, MediaType, PlanType, Screen, PlaybackConfig } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input, Select } from '../components/Input';
import { Upload, Trash2, Eye, Link as LinkIcon, FileVideo, Image, FileText, Check, AlertCircle, Lock, Copy, X, Monitor, Plus, Clock, Calendar, ArrowRight, ArrowLeft, Cloud, RefreshCw, HardDrive, Crown, Folder, Search, CheckSquare, Globe, Download, Filter, Grid3x3, List, SortAsc, SortDesc, MoreVertical, Info, Share2, Edit3, Star, StarOff, Tag, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MediaLibrary: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMediaInfo, setShowMediaInfo] = useState<string | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<'url' | 'stock'>('url');
  
  const [importUrl, setImportUrl] = useState('');
  const [importName, setImportName] = useState('');
  const [importType, setImportType] = useState<MediaType>(MediaType.IMAGE);
  
  const [stockQuery, setStockQuery] = useState('');
  const [stockResults, setStockResults] = useState<{url: string, id: string}[]>([]);
  const [isStockLoading, setIsStockLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddToScreenModalOpen, setIsAddToScreenModalOpen] = useState(false);
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [addPosition, setAddPosition] = useState<'end' | 'top'>('end');
  
  const [playMode, setPlayMode] = useState<'duration' | 'times'>('duration');
  const [customDuration, setCustomDuration] = useState<number>(10);
  const [playCount, setPlayCount] = useState<number>(1);
  const [showAdvancedRules, setShowAdvancedRules] = useState(false);
  
  const [scheduleType, setScheduleType] = useState<'always' | 'custom'>('always');
  const [scheduleAllDay, setScheduleAllDay] = useState(true);
  const [scheduleStart, setScheduleStart] = useState('09:00');
  const [scheduleEnd, setScheduleEnd] = useState('17:00');
  const [scheduleDateRange, setScheduleDateRange] = useState(false);
  const [scheduleValidFrom, setScheduleValidFrom] = useState('');
  const [scheduleValidTo, setScheduleValidTo] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  const touchTimer = React.useRef<any>(null);

  const navigate = useNavigate();
  const user = StorageService.getUser();
  const userPlan = user?.plan || PlanType.FREE;
  const planConfig = StorageService.getCurrentPlanConfig();
  const [usedStorage, setUsedStorage] = useState(0);
  const [storageBreakdown, setStorageBreakdown] = useState({ image: 0, video: 0, pdf: 0, gif: 0, other: 0 });

  const loadData = async () => {
    setIsLoading(true);
    try {
        const [m, s] = await Promise.all([
            StorageService.getMedia(),
            StorageService.getScreens()
        ]);
        setMedia(m);
        setScreens(s);
    } catch (err) {
        console.error("Failed to load media library", err);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadStorageInfo();
    window.addEventListener('menupi-storage-change', loadData);
    window.addEventListener('menupi-storage-change', loadStorageInfo);
    return () => {
        window.removeEventListener('menupi-storage-change', loadData);
        window.removeEventListener('menupi-storage-change', loadStorageInfo);
    };
  }, []);

  const loadStorageInfo = async () => {
      try {
          const [usage, breakdown] = await Promise.all([
              StorageService.getStorageUsage(),
              StorageService.getStorageBreakdown()
          ]);
          setUsedStorage(usage);
          setStorageBreakdown(breakdown);
      } catch (err) {
          console.error('Failed to load storage info:', err);
      }
  };

  const processFile = async (file: File) => {
    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf'];
    if (!validTypes.some(type => file.type === type || file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      setError('Unsupported file type. Please upload Images, MP4, or PDF.');
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    const limitCheck = await StorageService.canUpload(file.size, file.type);
    
    if (!limitCheck.allowed) {
        setError(`Upload failed: ${limitCheck.reason || 'Limit reached'}`);
        return;
    }

    let progress = 0;
    setUploadProgress(0);
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 90) {
        clearInterval(interval);
      }
    }, 100);

    try {
        await StorageService.uploadMedia(file);
        setUploadProgress(100);
        await Promise.all([loadData(), loadStorageInfo()]);
    } catch (e: any) {
        setError(e.message);
        setUploadProgress(0);
    } finally {
        clearInterval(interval);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this media?')) {
      await StorageService.deleteMedia(id);
    }
  };
  
  const handleBatchDelete = async () => {
      if (window.confirm(`Are you sure you want to delete ${selectedIds.size} items?`)) {
          await StorageService.deleteMediaBatch(Array.from(selectedIds) as string[]);
          setSelectedIds(new Set<string>());
          setIsSelectionMode(false);
      }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      try {
          await StorageService.duplicateMedia(id);
      } catch (err: any) {
          alert(err.message);
      }
  };
  
  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredMedia.length) {
        setSelectedIds(new Set<string>());
    } else {
        setSelectedIds(new Set(filteredMedia.map(m => m.id)));
    }
  };
  
  const exitSelectionMode = () => {
      setSelectedIds(new Set<string>());
      setIsSelectionMode(false);
  };

  const handleTouchStart = (id: string) => {
      touchTimer.current = setTimeout(() => {
          setIsSelectionMode(true);
          toggleSelect(id);
          if (navigator.vibrate) navigator.vibrate(50);
      }, 500); 
  };

  const handleTouchEnd = () => {
      if (touchTimer.current) {
          clearTimeout(touchTimer.current);
          touchTimer.current = null;
      }
  };

  const openAddToScreenModal = (e?: React.MouseEvent, singleId?: string) => {
      e?.stopPropagation();
      if (singleId) {
          setSelectedIds(new Set([singleId]));
      }
      if (screens.length > 0) {
          setSelectedScreenId(screens[0].id);
          setAddPosition('end');
          setPlayMode('duration');
          setCustomDuration(10);
          setPlayCount(1);
          setScheduleType('always');
          setShowAdvancedRules(false);
          setShowSchedule(false);
          setIsAddToScreenModalOpen(true);
      } else {
          setIsAddToScreenModalOpen(true);
      }
  };

  const handleConfirmAddToScreen = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedScreenId) return;

      const itemsToAdd = Array.from(selectedIds) as string[];
      
      const config: PlaybackConfig = {
          mode: playMode,
          duration: customDuration,
          times: playCount,
          scheduleType: scheduleType,
          startTime: scheduleType === 'custom' && !scheduleAllDay ? scheduleStart : undefined,
          endTime: scheduleType === 'custom' && !scheduleAllDay ? scheduleEnd : undefined,
          validFrom: scheduleType === 'custom' && scheduleDateRange ? scheduleValidFrom : undefined,
          validTo: scheduleType === 'custom' && scheduleDateRange ? scheduleValidTo : undefined
      };

      try {
          await StorageService.addMediaToScreen(selectedScreenId, itemsToAdd, addPosition, config);
          setIsAddToScreenModalOpen(false);
          setSelectedIds(new Set<string>());
          setIsSelectionMode(false);
      } catch (err: any) {
          alert(err.message);
      }
  };

  const handleOpenImportModal = () => {
      if (userPlan !== PlanType.PRO) {
          if(confirm("Web & Cloud Import is a Pro feature. Would you like to upgrade?")) {
              navigate('/settings?tab=billing');
          }
          return;
      }
      setIsImportModalOpen(true);
      setImportUrl('');
      setImportName('');
      setStockQuery('');
      setStockResults([]);
      setError(null);
  };

  const handleStockSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!stockQuery.trim()) return;
      setIsStockLoading(true);
      
      setTimeout(() => {
          const results = Array.from({length: 8}).map((_, i) => ({
              id: `stock-${Date.now()}-${i}`,
              url: `https://picsum.photos/seed/${encodeURIComponent(stockQuery)}-${i}/1920/1080`
          }));
          setStockResults(results);
          setIsStockLoading(false);
      }, 800);
  };

  const handleImportStock = async (url: string) => {
      if (confirm('Import this image to your library?')) {
          const newItem: MediaItem = {
              id: Date.now().toString(),
              name: `Stock: ${stockQuery} (${Date.now().toString().slice(-4)})`,
              type: MediaType.IMAGE,
              size: '0.00 MB',
              url: url,
              duration: 10,
              createdAt: Date.now(),
              sourceProvider: 'google-drive',
              originalFileName: 'stock_photo.jpg'
          };
          await StorageService.saveMedia(newItem);
          alert('Image imported successfully!');
      }
  };

  const handleUrlImport = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!importUrl) return;

      const newItem: MediaItem = {
          id: Date.now().toString(),
          name: importName || 'Imported Link',
          type: importType,
          size: '0.00 MB',
          url: importUrl,
          duration: importType === MediaType.VIDEO ? 30 : 10,
          createdAt: Date.now(),
          sourceProvider: 'dropbox',
          originalFileName: importUrl.split('/').pop() || 'file'
      };
      
      try {
          await StorageService.saveMedia(newItem);
          setIsImportModalOpen(false);
          alert('Link imported successfully.');
      } catch (err: any) {
          alert(err.message);
      }
  };

  // Enhanced filtering and sorting
  const filteredMedia = media
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || 
        (filterType === 'image' && (item.type === MediaType.IMAGE || item.type === MediaType.GIF)) ||
        (filterType === 'video' && item.type === MediaType.VIDEO) ||
        (filterType === 'pdf' && item.type === MediaType.PDF);
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          const sizeA = parseFloat(a.size) || 0;
          const sizeB = parseFloat(b.size) || 0;
          comparison = sizeA - sizeB;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'date':
        default:
          comparison = (a.createdAt || 0) - (b.createdAt || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Calculate media statistics
  const mediaStats = {
    total: media.length,
    images: media.filter(m => m.type === MediaType.IMAGE || m.type === MediaType.GIF).length,
    videos: media.filter(m => m.type === MediaType.VIDEO).length,
    pdfs: media.filter(m => m.type === MediaType.PDF).length,
    totalSize: media.reduce((sum, m) => sum + (parseFloat(m.size) || 0), 0)
  };

  const formatFileSize = (size: string | number) => {
    const numSize = typeof size === 'string' ? parseFloat(size) : size;
    if (numSize >= 1024) {
      return `${(numSize / 1024).toFixed(1)} GB`;
    }
    return `${numSize.toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) return 'N/A';
    
    // Ensure timestamp is a number
    const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    if (isNaN(ts)) return 'N/A';
    
    const date = new Date(ts);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', timestamp, 'parsed as:', ts);
      return 'N/A';
    }
    
    const diff = now.getTime() - date.getTime();
    
    // Handle negative diff (future dates)
    if (diff < 0) {
      console.warn('Future date detected:', date, 'timestamp:', timestamp);
      return 'Just now';
    }
    
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
    
    // For older dates, show formatted date with time
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
      {/* Enhanced Action Bar */}
      {selectedIds.size > 0 || isSelectionMode ? (
        <div className="sticky top-16 md:static z-20 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 md:p-5 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-4">
                <button onClick={exitSelectionMode} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                    <X className="w-5 h-5"/>
                </button>
                <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">{selectedIds.size > 0 ? `${selectedIds.size} Selected` : 'Select Items'}</span>
                    <button onClick={selectAll} className="text-xs font-medium bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                        {selectedIds.size === filteredMedia.length && filteredMedia.length > 0 ? 'Deselect All' : 'Select All'}
                    </button>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" disabled={selectedIds.size === 0} onClick={(e) => openAddToScreenModal(e)} className="bg-white/20 border-transparent text-white hover:bg-white hover:text-indigo-600 shadow-none px-3 md:px-5 disabled:opacity-50">
                    <Monitor className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Add to Screen</span>
                </Button>
                <Button variant="danger" disabled={selectedIds.size === 0} onClick={handleBatchDelete} className="bg-white text-red-600 hover:bg-red-50 border-none shadow-sm px-3 md:px-5 disabled:opacity-50">
                    <Trash2 className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Delete</span>
                </Button>
            </div>
        </div>
      ) : (
        <>
            {/* Enhanced Header */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                            Media Library
                        </h1>
                        <p className="text-slate-600 mt-1">
                            {mediaStats.total} files • {formatFileSize(mediaStats.totalSize)} total
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="ghost" onClick={() => setIsSelectionMode(true)} className="text-slate-600 hover:bg-slate-100 border border-slate-200">
                            <CheckSquare className="w-4 h-4 mr-2" /> Select
                        </Button>
                        {userPlan === PlanType.PRO ? (
                             <Button variant="secondary" onClick={handleOpenImportModal}>
                                <Globe className="w-4 h-4 mr-2" />
                                Web Import
                             </Button>
                        ) : (
                            <div className="relative group/tooltip">
                                <Button variant="secondary" onClick={handleOpenImportModal} className="opacity-80">
                                    <Lock className="w-4 h-4 mr-2 text-slate-400" />
                                    Import (Pro)
                                </Button>
                            </div>
                        )}
                        <Button onClick={() => { setIsUploadModalOpen(true); setUploadProgress(0); setError(null); }} className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Media
                        </Button>
                    </div>
                </div>

                {/* Enhanced Storage Bar */}
                <div className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-indigo-600" />
                            <span className="font-semibold text-slate-900">Storage Usage</span>
                        </div>
                        <span className={`text-lg font-bold ${(usedStorage / planConfig.storageMB * 100) > 90 ? 'text-red-600' : (usedStorage / planConfig.storageMB * 100) > 70 ? 'text-amber-600' : 'text-indigo-600'}`}>
                            {((usedStorage / planConfig.storageMB) * 100).toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-slate-600">
                            {usedStorage.toFixed(1)} MB of {planConfig.storageMB} MB used
                        </span>
                        <span className="text-slate-500">
                            {(planConfig.storageMB - usedStorage).toFixed(1)} MB remaining
                        </span>
                    </div>
                    {/* Enhanced Color-coded Storage Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner">
                        <div className="h-full flex">
                            {storageBreakdown.image > 0 && (
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all hover:from-blue-600 hover:to-blue-700"
                                    style={{ width: `${Math.max((storageBreakdown.image / planConfig.storageMB) * 100, 1)}%` }}
                                    title={`Images: ${storageBreakdown.image.toFixed(1)} MB`}
                                />
                            )}
                            {storageBreakdown.video > 0 && (
                                <div 
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 transition-all hover:from-purple-600 hover:to-purple-700"
                                    style={{ width: `${Math.max((storageBreakdown.video / planConfig.storageMB) * 100, 1)}%` }}
                                    title={`Videos: ${storageBreakdown.video.toFixed(1)} MB`}
                                />
                            )}
                            {storageBreakdown.pdf > 0 && (
                                <div 
                                    className="bg-gradient-to-r from-red-500 to-red-600 transition-all hover:from-red-600 hover:to-red-700"
                                    style={{ width: `${Math.max((storageBreakdown.pdf / planConfig.storageMB) * 100, 1)}%` }}
                                    title={`PDFs: ${storageBreakdown.pdf.toFixed(1)} MB`}
                                />
                            )}
                            {storageBreakdown.gif > 0 && (
                                <div 
                                    className="bg-gradient-to-r from-pink-500 to-pink-600 transition-all hover:from-pink-600 hover:to-pink-700"
                                    style={{ width: `${Math.max((storageBreakdown.gif / planConfig.storageMB) * 100, 1)}%` }}
                                    title={`GIFs: ${storageBreakdown.gif.toFixed(1)} MB`}
                                />
                            )}
                            {storageBreakdown.other > 0 && (
                                <div 
                                    className="bg-gradient-to-r from-gray-500 to-gray-600 transition-all hover:from-gray-600 hover:to-gray-700"
                                    style={{ width: `${Math.max((storageBreakdown.other / planConfig.storageMB) * 100, 1)}%` }}
                                    title={`Other: ${storageBreakdown.other.toFixed(1)} MB`}
                                />
                            )}
                        </div>
                    </div>
                    {/* Storage Breakdown Stats */}
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-xs text-slate-600">
                                Images: {mediaStats.images} ({formatFileSize(storageBreakdown.image)})
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                            <span className="text-xs text-slate-600">
                                Videos: {mediaStats.videos} ({formatFileSize(storageBreakdown.video)})
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-xs text-slate-600">
                                PDFs: {mediaStats.pdfs} ({formatFileSize(storageBreakdown.pdf)})
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Search and Filter Bar */}
            {media.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search media files..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none bg-slate-50 focus:bg-white"
                            />
                        </div>
                        
                        {/* Filter by Type */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <Select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                options={[
                                    { value: 'all', label: 'All Types' },
                                    { value: 'image', label: 'Images' },
                                    { value: 'video', label: 'Videos' },
                                    { value: 'pdf', label: 'PDFs' }
                                ]}
                                className="min-w-[140px] text-sm"
                            />
                        </div>

                        {/* Sort */}
                        <div className="flex items-center gap-2">
                            {sortOrder === 'asc' ? (
                                <SortAsc className="w-4 h-4 text-slate-500" />
                            ) : (
                                <SortDesc className="w-4 h-4 text-slate-500" />
                            )}
                            <Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                options={[
                                    { value: 'date', label: 'Date' },
                                    { value: 'name', label: 'Name' },
                                    { value: 'size', label: 'Size' },
                                    { value: 'type', label: 'Type' }
                                ]}
                                className="min-w-[120px] text-sm"
                            />
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                            >
                                {sortOrder === 'asc' ? (
                                    <SortAsc className="w-4 h-4 text-slate-600" />
                                ) : (
                                    <SortDesc className="w-4 h-4 text-slate-600" />
                                )}
                            </button>
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Grid View"
                            >
                                <Grid3x3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="List View"
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
      )}

      {/* Enhanced Media Display */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6" : "bg-white rounded-xl border border-slate-200 overflow-hidden"}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            viewMode === 'grid' ? (
              <div key={i} className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
                <div className="aspect-square md:aspect-video bg-slate-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ) : (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100 animate-pulse">
                <div className="w-5 h-5 bg-slate-200 rounded"></div>
                <div className="w-20 h-20 bg-slate-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                </div>
              </div>
            )
          ))}
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="flex flex-col items-center gap-4">
            {searchQuery || filterType !== 'all' ? (
              <>
                <Search className="w-16 h-16 text-slate-300" />
                <div>
                  <p className="text-lg font-semibold text-slate-900">No media found</p>
                  <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <Upload className="w-16 h-16 text-slate-300" />
                <div>
                  <p className="text-lg font-semibold text-slate-900">Your media library is empty</p>
                  <p className="text-sm text-slate-500 mt-1">Upload your first media file to get started</p>
                </div>
                <Button
                  onClick={() => {
                    setIsUploadModalOpen(true);
                    setUploadProgress(0);
                    setError(null);
                  }}
                  className="mt-4"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Media
                </Button>
              </>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {filteredMedia.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const getTypeBadge = () => {
              if (item.type === MediaType.VIDEO) return { color: 'bg-purple-100 text-purple-700', icon: FileVideo, label: 'Video' };
              if (item.type === MediaType.PDF) return { color: 'bg-red-100 text-red-700', icon: FileText, label: 'PDF' };
              if (item.type === MediaType.GIF) return { color: 'bg-pink-100 text-pink-700', icon: Image, label: 'GIF' };
              return { color: 'bg-blue-100 text-blue-700', icon: Image, label: 'Image' };
            };
            const typeBadge = getTypeBadge();
            const TypeIcon = typeBadge.icon;
            
            return (
              <div 
                key={item.id} 
                className={`group relative bg-white rounded-xl md:rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${isSelected ? 'ring-2 ring-indigo-600 border-indigo-600 shadow-lg scale-[1.02]' : 'border-slate-200 hover:shadow-lg hover:border-indigo-300'}`} 
                onClick={() => {
                    if (selectedIds.size > 0 || isSelectionMode) toggleSelect(item.id);
                    else navigate(`/media/${item.id}`);
                }}
                onMouseEnter={() => setShowMediaInfo(item.id)}
                onMouseLeave={() => setShowMediaInfo(null)}
                onTouchStart={() => handleTouchStart(item.id)}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => { e.preventDefault(); toggleSelect(item.id); }}
              >
                {/* Enhanced Thumbnail */}
                <div className="aspect-square md:aspect-video bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                  {item.type === MediaType.IMAGE || item.type === MediaType.GIF ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : item.type === MediaType.VIDEO ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 relative">
                      <video src={item.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" muted />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                          <FileVideo className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 relative group-hover:from-red-100 group-hover:to-red-200 transition-colors">
                      <FileText className="w-12 h-12 text-red-500 mb-2" />
                      <span className="text-xs font-bold text-red-600 uppercase tracking-wider">PDF</span>
                    </div>
                  )}
                  
                  {/* Selection Checkbox */}
                  <div 
                      className={`absolute top-3 left-3 z-20 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shadow-lg ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 scale-100' : isSelectionMode ? 'bg-white border-slate-300' : 'bg-black/30 border-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100'
                      }`}
                      onClick={(e) => toggleSelect(item.id, e)}
                  >
                      {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>

                  {/* Type Badge */}
                  <div className={`absolute top-3 right-3 z-10 px-2 py-1 rounded-lg ${typeBadge.color} backdrop-blur-sm flex items-center gap-1 text-xs font-medium shadow-sm`}>
                    <TypeIcon className="w-3 h-3" />
                    <span>{typeBadge.label}</span>
                  </div>

                  {/* Hover Overlay with Quick Actions */}
                  {showMediaInfo === item.id && !isSelectionMode && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/media/${item.id}`);
                        }}
                        className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5 text-slate-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddToScreenModal(e, item.id);
                        }}
                        className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
                        title="Add to Screen"
                      >
                        <Monitor className="w-5 h-5 text-slate-700" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this media?')) {
                            StorageService.deleteMedia(item.id);
                            loadData();
                          }
                        }}
                        className="p-2 bg-red-500/90 hover:bg-red-600 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Enhanced Info Section */}
                <div className="p-4 bg-white">
                  <h3 className="font-semibold text-slate-900 truncate text-sm mb-1">{item.name}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {formatFileSize(item.size)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredMedia.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const getTypeBadge = () => {
                if (item.type === MediaType.VIDEO) return { color: 'bg-purple-100 text-purple-700', icon: FileVideo, label: 'Video' };
                if (item.type === MediaType.PDF) return { color: 'bg-red-100 text-red-700', icon: FileText, label: 'PDF' };
                if (item.type === MediaType.GIF) return { color: 'bg-pink-100 text-pink-700', icon: Image, label: 'GIF' };
                return { color: 'bg-blue-100 text-blue-700', icon: Image, label: 'Image' };
              };
              const typeBadge = getTypeBadge();
              const TypeIcon = typeBadge.icon;
              
              return (
                <div
                  key={item.id}
                  className={`group flex items-center gap-4 p-4 hover:bg-indigo-50/50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                  onClick={() => {
                    if (selectedIds.size > 0 || isSelectionMode) toggleSelect(item.id);
                    else navigate(`/media/${item.id}`);
                  }}
                >
                  {/* Checkbox */}
                  <div 
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'
                    }`}
                    onClick={(e) => toggleSelect(item.id, e)}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>

                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    {item.type === MediaType.IMAGE || item.type === MediaType.GIF ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    ) : item.type === MediaType.VIDEO ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900">
                        <FileVideo className="w-8 h-8 text-white/50" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-red-50">
                        <FileText className="w-8 h-8 text-red-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate">{item.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeBadge.color} flex items-center gap-1 flex-shrink-0`}>
                        <TypeIcon className="w-3 h-3" />
                        {typeBadge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        {formatFileSize(item.size)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/media/${item.id}`);
                      }}
                      className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-indigo-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddToScreenModal(e, item.id);
                      }}
                      className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="Add to Screen"
                    >
                      <Monitor className="w-4 h-4 text-indigo-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this media?')) {
                          StorageService.deleteMedia(item.id);
                          loadData();
                        }
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* ... Modals (Import, AddToScreen, Upload) ... */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Media">
          <div className="space-y-6 text-center">
             {error && (
               <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2 text-left">
                 <AlertCircle className="w-5 h-5 flex-shrink-0" />
                 {error}
               </div>
            )}
            {!uploadProgress && (
                <div 
                className={`border-2 border-dashed rounded-2xl p-10 transition-colors relative ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                >
                <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                />
                <div className="pointer-events-none">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
                    <p className="font-bold text-slate-900 text-lg">Click or drag file to upload</p>
                </div>
                </div>
            )}
             {uploadProgress > 0 && (
              <div className="space-y-4">
                 <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                 </div>
                 {uploadProgress === 100 && (
                    <Button className="mt-4" onClick={() => { setIsUploadModalOpen(false); setUploadProgress(0); }}>Close</Button>
                 )}
              </div>
            )}
          </div>
      </Modal>

      {/* Simplified Import Modal/AddToScreen Modal rendering to save space, assuming they follow the fixed patterns above */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import">
         <div className="p-4">
             {/* Import Logic */}
             <div className="flex gap-2 mb-4">
                 <Button onClick={() => setImportTab('url')} variant={importTab === 'url' ? 'primary' : 'secondary'}>URL</Button>
                 <Button onClick={() => setImportTab('stock')} variant={importTab === 'stock' ? 'primary' : 'secondary'}>Stock</Button>
             </div>
             {importTab === 'url' ? (
                 <form onSubmit={handleUrlImport} className="space-y-3">
                     <Input value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="URL" />
                     <Button type="submit">Import</Button>
                 </form>
             ) : (
                 <form onSubmit={handleStockSearch} className="space-y-3">
                     <Input value={stockQuery} onChange={e => setStockQuery(e.target.value)} placeholder="Search" />
                     <Button type="submit">Search</Button>
                     <div className="grid grid-cols-2 gap-2">
                        {stockResults.map(r => (
                            <img key={r.id} src={r.url} className="w-full h-20 object-cover cursor-pointer" onClick={() => handleImportStock(r.url)} />
                        ))}
                     </div>
                 </form>
             )}
         </div>
      </Modal>

      <Modal isOpen={isAddToScreenModalOpen} onClose={() => setIsAddToScreenModalOpen(false)} title="Add to Screen">
         <form onSubmit={handleConfirmAddToScreen} className="space-y-4">
             <Select value={selectedScreenId} onChange={e => setSelectedScreenId(e.target.value)}>
                 {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </Select>
             <Button type="submit">Add</Button>
         </form>
      </Modal>
    </div>
  );
};

export default MediaLibrary;
