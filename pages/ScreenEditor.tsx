import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { Screen, MediaItem, PlaylistItem, MediaType, AspectRatio, PlaybackConfig, DisplayMode } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input, Select } from '../components/Input';
import { PDFViewer } from '../components/PDFViewer';
import { ArrowLeft, Plus, GripVertical, Trash2, Play, Pause, Settings, Tv, Smartphone, Minimize2, Maximize2, StretchHorizontal, AlertCircle, Timer, Repeat, Clock, FileText, SkipBack, SkipForward, Copy, Eye, EyeOff, Link as LinkIcon, Edit2, MoreVertical, X, Check, RotateCcw, Infinity } from 'lucide-react';
import { normalizeMediaUrl } from '../utils/url';

const ScreenEditor: React.FC = () => {
  const { screenId } = useParams<{ screenId: string }>();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedMediaForAdd, setSelectedMediaForAdd] = useState<MediaItem | null>(null);
  const [customDuration, setCustomDuration] = useState<number>(10);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  
  // Settings Form State
  const [editName, setEditName] = useState('');
  const [playerControls, setPlayerControls] = useState({
    fullscreen: true,
    reload: true,
    showCode: true
  });
  
  // Preview State
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const previewTimeoutRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editItemDuration, setEditItemDuration] = useState<number>(10);
  const [editItemLoop, setEditItemLoop] = useState<'once' | 'loop' | 'times'>('loop');
  const [editItemTimes, setEditItemTimes] = useState<number>(1);
  const [editItemPriority, setEditItemPriority] = useState<number>(5);

  useEffect(() => {
    const init = async () => {
        if (screenId) {
            const s = await StorageService.getScreen(screenId);
            if (s) {
                setScreen(s);
                setEditName(s.name);
                // Load player controls config if stored
                if ((s as any).playerControls) {
                    setPlayerControls((s as any).playerControls);
                }
            } else {
                navigate('/screens');
            }
        }
        const m = await StorageService.getMedia();
        setAllMedia(m);
    };
    init();
  }, [screenId, navigate]);

  // Timer countdown effect
  useEffect(() => {
    if (!screen || screen.playlist.length === 0 || !isPlaying) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    const currentItem = screen.playlist[previewIndex];
    if (!currentItem) return;

    // Reset timer when item changes
    setRemainingTime(currentItem.duration);

    // Clear existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Start countdown timer
    timerIntervalRef.current = window.setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [previewIndex, screen?.playlist, isPlaying]);

  useEffect(() => {
    if (!screen || screen.playlist.length === 0 || !isPlaying) {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      return;
    }

    // Get enabled items only (matching public player behavior)
    const enabledItems = screen.playlist.filter(item => item.playbackConfig?.enabled !== false);
    if (enabledItems.length === 0) return;

    const currentItem = screen.playlist[previewIndex];
    if (!currentItem || currentItem.playbackConfig?.enabled === false) {
        // Find first enabled item
        const firstEnabled = enabledItems[0];
        const newIndex = screen.playlist.findIndex(item => item.id === firstEnabled.id);
        setPreviewIndex(newIndex >= 0 ? newIndex : 0);
        return;
    }

    previewTimeoutRef.current = window.setTimeout(() => {
      // Find next enabled item
      const currentEnabledIndex = enabledItems.findIndex(item => item.id === currentItem.id);
      const nextEnabledIndex = (currentEnabledIndex + 1) % enabledItems.length;
      const nextItem = enabledItems[nextEnabledIndex];
      const newIndex = screen.playlist.findIndex(item => item.id === nextItem.id);
      setPreviewIndex(newIndex >= 0 ? newIndex : 0);
    }, currentItem.duration * 1000);

    return () => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, [previewIndex, isPlaying, screen?.playlist]);

  const saveScreen = async (updatedScreen: Screen) => {
    await StorageService.saveScreen(updatedScreen);
    setScreen(updatedScreen);
  };
  
  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!screen) return;
      const updated = { ...screen, name: editName, playerControls } as any;
      await saveScreen(updated);
      setIsSettingsModalOpen(false);
  };

  const handleAddMedia = async (media: MediaItem) => {
    if (!screen) return;
    
    // For images and PDFs, show duration modal
    if (media.type === MediaType.IMAGE || media.type === MediaType.PDF || media.type === MediaType.GIF) {
      setSelectedMediaForAdd(media);
      setCustomDuration(10); // Default 10 seconds
      setIsAddModalOpen(false);
      setIsDurationModalOpen(true);
      return;
    }
    
    // For videos, auto-detect duration or use default
    let duration = media.duration || 30;
    if (media.type === MediaType.VIDEO && !media.duration) {
      // Try to get duration from video element
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = normalizeMediaUrl(media.url);
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            duration = Math.ceil(video.duration) || 30;
            resolve(null);
          };
          video.onerror = reject;
          setTimeout(() => resolve(null), 2000); // Timeout after 2s
        });
      } catch (e) {
        duration = 30; // Default for videos
      }
    }
    
    const newItem: PlaylistItem = {
      id: Date.now().toString(),
      mediaId: media.id,
      duration: duration,
      order: screen.playlist.length,
      playbackConfig: { mode: 'duration', duration: duration, scheduleType: 'always', enabled: true }
    };
    const updatedScreen = { ...screen, playlist: [...screen.playlist, newItem] };
    await saveScreen(updatedScreen);
    setIsAddModalOpen(false);
  };

  const handleConfirmDuration = async () => {
    if (!screen || !selectedMediaForAdd) return;
    
    const newItem: PlaylistItem = {
      id: Date.now().toString(),
      mediaId: selectedMediaForAdd.id,
      duration: customDuration,
      order: screen.playlist.length,
      playbackConfig: { mode: 'duration', duration: customDuration, scheduleType: 'always', enabled: true }
    };
    const updatedScreen = { ...screen, playlist: [...screen.playlist, newItem] };
    await saveScreen(updatedScreen);
    setIsDurationModalOpen(false);
    setSelectedMediaForAdd(null);
  };

  const handleUpdateDuration = async (index: number, newDuration: number) => {
    if (!screen) return;
    const newPlaylist = [...screen.playlist];
    newPlaylist[index].duration = newDuration;
    if (newPlaylist[index].playbackConfig) {
      newPlaylist[index].playbackConfig.duration = newDuration;
    }
    await saveScreen({ ...screen, playlist: newPlaylist });
  };

  const handleOpenEditModal = (index: number) => {
    if (!screen) return;
    const item = screen.playlist[index];
    setEditingItemIndex(index);
    setEditItemDuration(item.duration);
    const mode = item.playbackConfig?.mode || 'duration';
    if (mode === 'times') {
      setEditItemLoop('times');
      setEditItemTimes(item.playbackConfig?.times || 1);
    } else if (item.playbackConfig?.loop === true) {
      setEditItemLoop('loop');
    } else {
      setEditItemLoop('once');
    }
    setEditItemPriority(item.playbackConfig?.priority || 5);
  };

  const handleSaveEdit = async () => {
    if (!screen || editingItemIndex === null) return;
    const newPlaylist = [...screen.playlist];
    const item = newPlaylist[editingItemIndex];
    
    item.duration = editItemDuration;
    if (!item.playbackConfig) {
      item.playbackConfig = { mode: 'duration', duration: editItemDuration, scheduleType: 'always', enabled: true };
    }
    
    item.playbackConfig.duration = editItemDuration;
    item.playbackConfig.priority = editItemPriority;
    
    if (editItemLoop === 'loop') {
      item.playbackConfig.mode = 'duration';
      item.playbackConfig.loop = true;
      delete item.playbackConfig.times;
    } else if (editItemLoop === 'once') {
      item.playbackConfig.mode = 'duration';
      item.playbackConfig.loop = false;
      delete item.playbackConfig.times;
    } else if (editItemLoop === 'times') {
      item.playbackConfig.mode = 'times';
      item.playbackConfig.times = editItemTimes;
      delete item.playbackConfig.loop;
    }
    
    await saveScreen({ ...screen, playlist: newPlaylist });
    setEditingItemIndex(null);
  };

  const handleRemoveItem = async (index: number) => {
    if (!screen) return;
    const newPlaylist = [...screen.playlist];
    newPlaylist.splice(index, 1);
    // Reorder items after removal
    newPlaylist.forEach((item, idx) => {
      item.order = idx;
    });
    await saveScreen({ ...screen, playlist: newPlaylist });
  };

  const handleToggleItemEnabled = async (index: number) => {
    if (!screen) return;
    const newPlaylist = [...screen.playlist];
    const item = newPlaylist[index];
    if (item.playbackConfig) {
      item.playbackConfig.enabled = !item.playbackConfig.enabled;
    } else {
      item.playbackConfig = { ...item.playbackConfig, enabled: false };
      item.playbackConfig.enabled = true;
    }
    await saveScreen({ ...screen, playlist: newPlaylist });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!screen || draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newPlaylist = [...screen.playlist];
    const draggedItem = newPlaylist[draggedIndex];
    
    // Remove from old position
    newPlaylist.splice(draggedIndex, 1);
    
    // Insert at new position
    newPlaylist.splice(dropIndex, 0, draggedItem);
    
    // Update order values
    newPlaylist.forEach((item, idx) => {
      item.order = idx;
    });
    
    await saveScreen({ ...screen, playlist: newPlaylist });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (!screen) return <div>Loading...</div>;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/screens')}><ArrowLeft /></button>
          <h1 className="text-2xl font-bold">{screen.name}</h1>
          <button onClick={() => setIsSettingsModalOpen(true)}><Settings /></button>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}><Plus className="mr-2" /> Add Media</Button>
      </div>

      <div className="flex gap-8 overflow-hidden h-full">
         <div className="flex-1 overflow-y-auto">
             {screen.playlist.length === 0 ? (
                 <div className="text-center py-12 text-slate-400">
                     <p>No media in playlist</p>
                     <p className="text-sm mt-2">Click "Add Media" to get started</p>
                 </div>
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {screen.playlist.map((item, idx) => {
                         const m = allMedia.find(am => am.id === item.mediaId);
                         if (!m) return null;
                         const isDragging = draggedIndex === idx;
                         const isDragOver = dragOverIndex === idx;
                         const isDisabled = item.playbackConfig?.enabled === false;
                         const loopMode = item.playbackConfig?.mode === 'times' ? 'times' : item.playbackConfig?.loop === true ? 'loop' : 'once';
                         const priority = item.playbackConfig?.priority || 5;
                         
                         return (
                             <div 
                                 key={item.id} 
                                 draggable
                                 onDragStart={() => handleDragStart(idx)}
                                 onDragOver={(e) => handleDragOver(e, idx)}
                                 onDragEnd={handleDragEnd}
                                 onDrop={(e) => handleDrop(e, idx)}
                                 className={`group relative bg-white border-2 rounded-xl overflow-hidden transition-all cursor-move ${
                                     isDragging ? 'opacity-50 scale-95' : ''
                                 } ${
                                     isDragOver ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'
                                 } ${
                                     isDisabled ? 'opacity-60' : ''
                                 }`}
                             >
                                 {/* Drag Handle */}
                                 <div className="absolute top-2 left-2 z-10 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                     <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                                 </div>
                                 
                                 {/* Media Thumbnail */}
                                 <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                     {m.type === MediaType.IMAGE || m.type === MediaType.GIF ? (
                                         <img 
                                             src={m.url} 
                                             alt={m.name} 
                                             className="w-full h-full object-cover"
                                         />
                                     ) : m.type === MediaType.VIDEO ? (
                                         <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                             <Tv className="w-12 h-12 text-white/30" />
                                             <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                                 {item.duration}s
                                             </div>
                                         </div>
                                     ) : (
                                         <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                             <FileText className="w-12 h-12 text-slate-300" />
                                             <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                                 {item.duration}s
                                             </div>
                                         </div>
                                     )}
                                     
                                     {/* Status Badges */}
                                     <div className="absolute top-2 right-2 flex gap-1.5">
                                         {isDisabled && (
                                             <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                                 Disabled
                                             </div>
                                         )}
                                         <div className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                             #{idx + 1}
                                         </div>
                                     </div>
                                 </div>
                                 
                                 {/* Media Info & Controls */}
                                 <div className="p-3 space-y-2">
                                     {/* Media Name */}
                                     <div className="flex items-start justify-between gap-2">
                                         <h4 className={`text-sm font-semibold text-slate-900 line-clamp-2 flex-1 ${
                                             isDisabled ? 'line-through text-slate-400' : ''
                                         }`}>
                                             {m.name}
                                         </h4>
                                     </div>
                                     
                                     {/* Quick Stats */}
                                     <div className="flex items-center gap-3 text-xs text-slate-500">
                                         <div className="flex items-center gap-1">
                                             <Clock className="w-3.5 h-3.5" />
                                             <span>{item.duration}s</span>
                                         </div>
                                         <div className="flex items-center gap-1">
                                             {loopMode === 'loop' ? (
                                                 <>
                                                     <Infinity className="w-3.5 h-3.5" />
                                                     <span>Loop</span>
                                                 </>
                                             ) : loopMode === 'times' ? (
                                                 <>
                                                     <Repeat className="w-3.5 h-3.5" />
                                                     <span>{item.playbackConfig?.times || 1}x</span>
                                                 </>
                                             ) : (
                                                 <>
                                                     <RotateCcw className="w-3.5 h-3.5" />
                                                     <span>Once</span>
                                                 </>
                                             )}
                                         </div>
                                         <div className="flex items-center gap-1">
                                             <AlertCircle className="w-3.5 h-3.5" />
                                             <span>P{priority}</span>
                                         </div>
                                     </div>
                                     
                                     {/* Action Buttons */}
                                     <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
                                         <button
                                             onClick={(e) => {
                                                 e.stopPropagation();
                                                 handleOpenEditModal(idx);
                                             }}
                                             className="flex-1 px-2 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                                             title="Edit settings"
                                         >
                                             <Edit2 className="w-3.5 h-3.5" />
                                             Edit
                                         </button>
                                         <button
                                             onClick={(e) => {
                                                 e.stopPropagation();
                                                 handleToggleItemEnabled(idx);
                                             }}
                                             className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                                 isDisabled 
                                                     ? 'text-green-600 hover:bg-green-50' 
                                                     : 'text-slate-500 hover:bg-slate-100'
                                             }`}
                                             title={isDisabled ? "Enable" : "Disable"}
                                         >
                                             {isDisabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                         </button>
                                         <button
                                             onClick={(e) => {
                                                 e.stopPropagation();
                                                 if (confirm(`Remove "${m.name}" from this playlist?`)) {
                                                     handleRemoveItem(idx);
                                                 }
                                             }}
                                             className="px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                             title="Remove from playlist"
                                         >
                                             <Trash2 className="w-3.5 h-3.5" />
                                         </button>
                                     </div>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             )}
         </div>
         <div className="w-[400px] bg-black p-4 rounded-xl flex flex-col">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold text-white">Live Preview</h3>
                 <div className="flex gap-2">
                     <button 
                         onClick={() => setIsPlaying(!isPlaying)}
                         className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                         title={isPlaying ? "Pause" : "Play"}
                     >
                         {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                     </button>
                     <button 
                         onClick={() => {
                             const enabledItems = screen.playlist.filter(item => item.playbackConfig?.enabled !== false);
                             const currentEnabledIndex = enabledItems.findIndex(item => item.id === screen.playlist[previewIndex].id);
                             const prevIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledItems.length - 1;
                             const prevItem = enabledItems[prevIndex];
                             const newIndex = screen.playlist.findIndex(item => item.id === prevItem.id);
                             setPreviewIndex(newIndex);
                         }}
                         className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                         title="Previous"
                     >
                         <SkipBack className="w-4 h-4" />
                     </button>
                     <button 
                         onClick={() => {
                             const enabledItems = screen.playlist.filter(item => item.playbackConfig?.enabled !== false);
                             const currentEnabledIndex = enabledItems.findIndex(item => item.id === screen.playlist[previewIndex].id);
                             const nextIndex = (currentEnabledIndex + 1) % enabledItems.length;
                             const nextItem = enabledItems[nextIndex];
                             const newIndex = screen.playlist.findIndex(item => item.id === nextItem.id);
                             setPreviewIndex(newIndex);
                         }}
                         className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                         title="Next"
                     >
                         <SkipForward className="w-4 h-4" />
                     </button>
                 </div>
             </div>
             <div 
                 className="bg-black rounded-lg overflow-hidden relative flex items-center justify-center"
                 style={{ 
                     aspectRatio: screen.aspectRatio === '21:9' ? '21/9' : screen.aspectRatio === '4:3' ? '4/3' : '16/9',
                     width: '100%',
                     maxHeight: '100%'
                 }}
             >
                 <div 
                     className="w-full h-full flex items-center justify-center"
                     style={{ 
                         aspectRatio: screen.aspectRatio === '21:9' ? '21/9' : screen.aspectRatio === '4:3' ? '4/3' : '16/9'
                     }}
                 >
                     {screen.playlist[previewIndex] && (() => {
                         const currentItem = screen.playlist[previewIndex];
                         const media = allMedia.find(m => m.id === currentItem.mediaId);
                         if (!media) return <div className="w-full h-full flex items-center justify-center text-white">No media</div>;
                         
                         // Match public player rendering exactly with fade animation
                         if (media.type === MediaType.VIDEO) {
                             return (
                                 <video 
                                     key={`video-${currentItem.id}-${previewIndex}`}
                                     src={normalizeMediaUrl(media.url)} 
                                     className="w-full h-full object-contain animate-fade-in"
                                     style={{ 
                                         maxWidth: '100%',
                                         maxHeight: '100%'
                                     }}
                                     autoPlay
                                     muted
                                     playsInline
                                     loop={false}
                                     onEnded={() => {
                                         const enabledItems = screen.playlist.filter(item => item.playbackConfig?.enabled !== false);
                                         const currentEnabledIndex = enabledItems.findIndex(item => item.id === currentItem.id);
                                         const nextIndex = (currentEnabledIndex + 1) % enabledItems.length;
                                         const nextItem = enabledItems[nextIndex];
                                         const newIndex = screen.playlist.findIndex(item => item.id === nextItem.id);
                                         setPreviewIndex(newIndex >= 0 ? newIndex : 0);
                                     }}
                                 />
                             );
                         } else if (media.type === MediaType.PDF) {
                             return (
                                 <div 
                                     key={`pdf-${currentItem.id}-${previewIndex}`} 
                                     className="w-full h-full bg-white animate-fade-in"
                                     style={{ 
                                         maxWidth: '100%',
                                         maxHeight: '100%'
                                     }}
                                 >
                                     <PDFViewer url={normalizeMediaUrl(media.url)} title={media.name} />
                                 </div>
                             );
                         } else {
                             return (
                                 <img 
                                     key={`img-${currentItem.id}-${previewIndex}`}
                                     src={normalizeMediaUrl(media.url)} 
                                     alt={media.name}
                                     className="w-full h-full object-contain animate-fade-in"
                                     style={{ 
                                         maxWidth: '100%',
                                         maxHeight: '100%'
                                     }}
                                 />
                             );
                         }
                     })()}
                 </div>
                 
                 {/* Timer and Info Overlay */}
                 {screen.playlist.length > 0 && (() => {
                     const enabledItems = screen.playlist.filter(item => item.playbackConfig?.enabled !== false);
                     const currentEnabledIndex = enabledItems.findIndex(item => item.id === screen.playlist[previewIndex]?.id);
                     const currentItem = screen.playlist[previewIndex];
                     
                     return (
                         <>
                             {/* Top Timer Bar */}
                             <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent px-4 py-2">
                                 <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-3">
                                         <div className="flex items-center gap-1.5">
                                             <Timer className="w-4 h-4 text-white/80" />
                                             <span className="text-white font-mono font-bold text-lg">
                                                 {remainingTime}s
                                             </span>
                                         </div>
                                         <div className="h-4 w-px bg-white/30"></div>
                                         <span className="text-white/70 text-xs">
                                             {currentItem?.duration}s total
                                         </span>
                                     </div>
                                     <div className="text-white/70 text-xs">
                                         {currentEnabledIndex >= 0 ? currentEnabledIndex + 1 : 0} / {enabledItems.length}
                                     </div>
                                 </div>
                                 {/* Progress Bar */}
                                 {currentItem && (
                                     <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                                         <div 
                                             className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
                                             style={{ 
                                                 width: `${((currentItem.duration - remainingTime) / currentItem.duration) * 100}%` 
                                             }}
                                         />
                                     </div>
                                 )}
                             </div>
                             
                             {/* Bottom Info Bar */}
                             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-2">
                                 <div className="flex items-center justify-between text-white/80 text-xs">
                                     <span className="truncate">
                                         {allMedia.find(m => m.id === currentItem?.mediaId)?.name || 'Unknown'}
                                     </span>
                                     <div className="flex items-center gap-2">
                                         {screen.aspectRatio && (
                                             <span className="px-2 py-0.5 bg-white/20 rounded">
                                                 {screen.aspectRatio}
                                             </span>
                                         )}
                                         {screen.orientation && (
                                             <span className="px-2 py-0.5 bg-white/20 rounded capitalize">
                                                 {screen.orientation}
                                             </span>
                                         )}
                                     </div>
                                 </div>
                             </div>
                         </>
                     );
                 })()}
             </div>
             
             {/* Public Player Link */}
             {screen && (
                 <div className="mt-4 p-3 bg-white/10 rounded-lg">
                     <div className="flex items-center gap-2 mb-2">
                         <LinkIcon className="w-4 h-4 text-white/70" />
                         <span className="text-xs text-white/70 font-medium">Public Player Link</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <input
                             type="text"
                             value={`${window.location.origin}/tv/${screen.screenCode}`}
                             readOnly
                             className="flex-1 text-xs font-mono text-white bg-white/10 px-2 py-1 rounded border border-white/20"
                             onClick={(e) => e.currentTarget.select()}
                         />
                         <button
                             onClick={() => {
                                 navigator.clipboard.writeText(`${window.location.origin}/tv/${screen.screenCode}`);
                                 alert('Link copied!');
                             }}
                             className="p-1.5 bg-white/20 hover:bg-white/30 rounded transition-colors"
                             title="Copy link"
                         >
                             <Copy className="w-3.5 h-3.5 text-white" />
                         </button>
                     </div>
                 </div>
             )}
         </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Media to Playlist">
         {allMedia.length === 0 ? (
             <div className="text-center py-8 text-slate-400">
                 <p>No media files available</p>
                 <p className="text-sm mt-2">Upload media from the Media Library first</p>
             </div>
         ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                 {allMedia.map(m => (
                     <div 
                         key={m.id} 
                         onClick={() => handleAddMedia(m)} 
                         className="group relative aspect-video bg-slate-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all border border-slate-200"
                     >
                         {m.type === MediaType.IMAGE || m.type === MediaType.GIF ? (
                             <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                         ) : m.type === MediaType.VIDEO ? (
                             <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                 <Tv className="w-8 h-8 text-white/50" />
                             </div>
                         ) : (
                             <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                 <FileText className="w-8 h-8 text-slate-400" />
                             </div>
                         )}
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                             <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                         </div>
                         <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                             <p className="text-xs text-white font-medium truncate">{m.name}</p>
                         </div>
                     </div>
                 ))}
             </div>
         )}
      </Modal>

      {/* Duration Configuration Modal */}
      <Modal isOpen={isDurationModalOpen} onClose={() => { setIsDurationModalOpen(false); setSelectedMediaForAdd(null); }} title="Set Playback Duration">
          <form onSubmit={(e) => { e.preventDefault(); handleConfirmDuration(); }} className="space-y-4">
              {selectedMediaForAdd && (
                  <div className="bg-slate-50 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-slate-700">{selectedMediaForAdd.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                          {selectedMediaForAdd.type === MediaType.IMAGE ? 'Image' : 
                           selectedMediaForAdd.type === MediaType.PDF ? 'PDF' : 'GIF'}
                      </p>
                  </div>
              )}
              <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Duration (seconds)
                  </label>
                  <Input
                      type="number"
                      min="1"
                      max="3600"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(parseInt(e.target.value) || 1)}
                      placeholder="10"
                      required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                      How long this media will display before moving to the next item (1-3600 seconds)
                  </p>
              </div>
              <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1">Add to Playlist</Button>
                  <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => { setIsDurationModalOpen(false); setSelectedMediaForAdd(null); }}
                  >
                      Cancel
                  </Button>
              </div>
          </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal isOpen={editingItemIndex !== null} onClose={() => setEditingItemIndex(null)} title="Edit Playlist Item">
          {editingItemIndex !== null && screen && (() => {
              const item = screen.playlist[editingItemIndex];
              const media = allMedia.find(m => m.id === item.mediaId);
              return (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4">
                      {media && (
                          <div className="bg-slate-50 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-3">
                                  {media.type === MediaType.IMAGE || media.type === MediaType.GIF ? (
                                      <img src={normalizeMediaUrl(media.url)} alt={media.name} className="w-16 h-16 object-cover rounded" />
                                  ) : media.type === MediaType.VIDEO ? (
                                      <div className="w-16 h-16 bg-slate-800 rounded flex items-center justify-center">
                                          <Tv className="w-8 h-8 text-white/50" />
                                      </div>
                                  ) : (
                                      <div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center">
                                          <FileText className="w-8 h-8 text-slate-400" />
                                      </div>
                                  )}
                                  <div className="flex-1">
                                      <p className="text-sm font-medium text-slate-900">{media.name}</p>
                                      <p className="text-xs text-slate-500">{media.type}</p>
                                  </div>
                              </div>
                          </div>
                      )}
                      
                      <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Duration (seconds)
                          </label>
                          <Input
                              type="number"
                              min="1"
                              max="3600"
                              value={editItemDuration}
                              onChange={(e) => setEditItemDuration(parseInt(e.target.value) || 1)}
                              required
                          />
                      </div>
                      
                      <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Playback Mode
                          </label>
                          <Select
                              value={editItemLoop}
                              onChange={(e) => setEditItemLoop(e.target.value as 'once' | 'loop' | 'times')}
                          >
                              <option value="loop">Loop Forever</option>
                              <option value="once">Play Once</option>
                              <option value="times">Play X Times</option>
                          </Select>
                          {editItemLoop === 'times' && (
                              <div className="mt-2">
                                  <label className="block text-xs text-slate-600 mb-1">Number of times</label>
                                  <Input
                                      type="number"
                                      min="1"
                                      max="100"
                                      value={editItemTimes}
                                      onChange={(e) => setEditItemTimes(parseInt(e.target.value) || 1)}
                                      required
                                  />
                              </div>
                          )}
                      </div>
                      
                      <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                              Priority (1-10)
                          </label>
                          <Input
                              type="number"
                              min="1"
                              max="10"
                              value={editItemPriority}
                              onChange={(e) => setEditItemPriority(parseInt(e.target.value) || 5)}
                              required
                          />
                          <p className="text-xs text-slate-500 mt-1">
                              Higher priority items play first when schedules overlap
                          </p>
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                          <Button type="submit" className="flex-1">Save Changes</Button>
                          <Button 
                              type="button" 
                              variant="secondary"
                              onClick={() => setEditingItemIndex(null)}
                          >
                              Cancel
                          </Button>
                      </div>
                  </form>
              );
          })()}
      </Modal>

      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Screen Settings">
          <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Screen Name</label>
                  <Input 
                      value={editName} 
                      onChange={e => setEditName(e.target.value)} 
                      placeholder="Screen Name"
                      required
                  />
              </div>
              
              {screen && (
                  <>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Pairing Code</label>
                          <div className="flex items-center gap-3">
                              <div className="flex-1 font-mono font-bold text-lg text-indigo-600 bg-white px-4 py-2 rounded-lg border border-indigo-200">
                                  {screen.screenCode}
                              </div>
                              <button
                                  type="button"
                                  onClick={() => {
                                      navigator.clipboard.writeText(screen.screenCode);
                                      alert('Pairing code copied!');
                                  }}
                                  className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                                  title="Copy code"
                              >
                                  <Copy className="w-4 h-4" />
                              </button>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                              Share this code with your TV display to connect
                          </p>
                      </div>
                      
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <label className="block text-sm font-semibold text-slate-700 mb-3">Player Controls</label>
                          <div className="space-y-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                      type="checkbox"
                                      checked={playerControls.fullscreen}
                                      onChange={(e) => setPlayerControls({ ...playerControls, fullscreen: e.target.checked })}
                                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className="text-sm text-slate-700">Allow fullscreen toggle</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                      type="checkbox"
                                      checked={playerControls.reload}
                                      onChange={(e) => setPlayerControls({ ...playerControls, reload: e.target.checked })}
                                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className="text-sm text-slate-700">Allow soft reload</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                      type="checkbox"
                                      checked={playerControls.showCode}
                                      onChange={(e) => setPlayerControls({ ...playerControls, showCode: e.target.checked })}
                                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <span className="text-sm text-slate-700">Show screen code in player</span>
                              </label>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                              Controls are hidden by default and appear on interaction
                          </p>
                      </div>
                  </>
              )}

              <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1">Save Changes</Button>
                  <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => setIsSettingsModalOpen(false)}
                  >
                      Cancel
                  </Button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default ScreenEditor;
