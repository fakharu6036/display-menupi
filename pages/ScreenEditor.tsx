
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { getTvPlayerUrl } from '../services/config';
import { Screen, MediaItem, PlaylistItem, MediaType } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { 
    ArrowLeft, 
    Plus, 
    Trash2, 
    Play, 
    Pause, 
    Tv, 
    Monitor,
    LayoutTemplate,
    Search,
    ChevronUp,
    ChevronDown,
    Repeat,
    Timer,
    CheckCircle2,
    ChevronDown as ChevronDownIcon,
    FileText,
    Image as ImageIcon,
    FileVideo,
    ExternalLink,
    Copy,
    Check
} from 'lucide-react';

const ScreenEditor: React.FC = () => {
  const { screenId } = useParams<{ screenId: string }>();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchMedia, setSearchMedia] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Preview State
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const previewTimeoutRef = useRef<number | null>(null);

  const loadData = async () => {
    if (screenId) {
      const s = await StorageService.getScreen(screenId);
      if (s) setScreen(s);
      else navigate('/screens');
    }
    const m = await StorageService.getMedia();
    setAllMedia(m);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('menupi-storage-change', loadData);
    return () => window.removeEventListener('menupi-storage-change', loadData);
  }, [screenId]);

  useEffect(() => {
    if (!screen || screen.playlist.length === 0 || !isPlaying || screen.isPaused) return;
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);

    const currentItem = screen.playlist[previewIndex];
    if (!currentItem) {
      setPreviewIndex(0);
      return;
    }

    const playbackConfig = currentItem.playbackConfig || { mode: 'loop', duration: currentItem.duration || 10 };
    const duration = playbackConfig.mode === 'duration' ? (playbackConfig.duration || currentItem.duration || 10) : currentItem.duration || 10;

    previewTimeoutRef.current = window.setTimeout(() => {
      if (playbackConfig.mode === 'once' && previewIndex === screen.playlist.length - 1) {
        // If last item and play once, stop
        setIsPlaying(false);
        return;
      }
      setPreviewIndex((prev) => (prev + 1) % screen.playlist.length);
    }, duration * 1000);

    return () => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, [previewIndex, isPlaying, screen?.playlist, screen?.isPaused]);

  const saveScreen = async (updatedScreen: Screen) => {
    await StorageService.saveScreen(updatedScreen);
    setScreen(updatedScreen);
  };

  const handleAddMedia = async (media: MediaItem) => {
    if (!screen) return;
    const newItem: PlaylistItem = {
      id: Math.random().toString(36).substr(2, 9),
      mediaId: media.id,
      duration: 10,
      order: screen.playlist.length,
      playbackConfig: {
        mode: 'loop',
        duration: 10
      }
    };
    const updatedScreen = { ...screen, playlist: [...screen.playlist, newItem] };
    await saveScreen(updatedScreen);
    setIsAddModalOpen(false);
  };

  const handleUpdateItem = async (index: number, updates: Partial<PlaylistItem>) => {
    if (!screen) return;
    const newPlaylist = [...screen.playlist];
    newPlaylist[index] = { ...newPlaylist[index], ...updates };
    await saveScreen({ ...screen, playlist: newPlaylist });
  };

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    if (!screen) return;
    const newPlaylist = [...screen.playlist];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPlaylist.length) return;
    [newPlaylist[index], newPlaylist[targetIndex]] = [newPlaylist[targetIndex], newPlaylist[index]];
    const finalPlaylist = newPlaylist.map((item, idx) => ({ ...item, order: idx }));
    await saveScreen({ ...screen, playlist: finalPlaylist });
  };

  const handleRemoveItem = async (index: number) => {
    if (!screen) return;
    if (!confirm('Remove this item from the broadcast loop?')) return;
    const newPlaylist = [...screen.playlist];
    newPlaylist.splice(index, 1);
    await saveScreen({ ...screen, playlist: newPlaylist });
    if (previewIndex >= newPlaylist.length) setPreviewIndex(0);
  };

  if (!screen) return null;

  const currentPreviewItem = screen.playlist[previewIndex];
  const currentPreviewMedia = currentPreviewItem ? allMedia.find(m => m.id === currentPreviewItem.mediaId) : null;

  return (
    <div className="flex flex-col space-y-6 md:space-y-8 animate-fade w-full">
      {/* Studio Header */}
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/screens')}
            className="w-12 h-12 bg-white border border-[#e4e1ec] rounded-2xl flex items-center justify-center text-[#44474e] hover:bg-[#f3f3f7] hover:border-[#3f51b5]/30 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-[#1b1b1f] tracking-tight">{screen.name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${screen.isPaused ? 'bg-[#f3f3f7] text-[#777680] border-[#e4e1ec]' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                 {!screen.isPaused && <div className="w-1 h-1 bg-emerald-600 rounded-full animate-pulse" />} 
                 {screen.isPaused ? 'Paused' : 'Broadcasting'}
              </span>
            </div>
            <p className="text-[10px] font-black text-[#777680] uppercase tracking-[0.2em] mt-1.5">Pin: <span className="text-[#3f51b5]">{screen.screenCode}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Button onClick={() => setIsAddModalOpen(true)} className="rounded-2xl shadow-lg shadow-[#3f51b5]/10">
             <Plus className="w-4 h-4 mr-2" strokeWidth={3} /> Add Menu
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full">
        {/* Sequencer */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="flex items-center justify-between px-3">
             <h3 className="text-sm font-black text-[#1b1b1f] flex items-center gap-3 uppercase tracking-widest">
               <LayoutTemplate className="w-5 h-5 text-[#3f51b5]" /> Active Broadcast Loop
             </h3>
             <span className="text-[10px] font-black text-[#777680] uppercase tracking-[0.2em] bg-[#f3f3f7] px-3 py-1 rounded-full">{screen.playlist.length} Items</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar pb-10 px-1">
            {screen.playlist.length === 0 ? (
               <div className="py-24 text-center bg-[#f3f3f7] rounded-[32px] border-2 border-dashed border-[#e4e1ec]">
                  <Monitor className="w-12 h-12 text-[#e4e1ec] mx-auto mb-4" />
                  <p className="text-[#44474e] font-bold">Sequence is empty</p>
               </div>
            ) : (
              screen.playlist.map((item, idx) => {
                const m = allMedia.find(am => am.id === item.mediaId);
                if (!m) return null;
                const isCurrent = idx === previewIndex;
                return (
                  <div 
                    key={item.id}
                    className={`group flex items-start gap-4 p-5 rounded-[28px] border transition-all duration-500 ${isCurrent ? 'bg-[#e0e0ff]/30 border-[#3f51b5] ring-2 ring-[#3f51b5]/10' : 'bg-white border-[#e4e1ec] hover:border-[#3f51b5]/40'}`}
                  >
                    <div className="flex flex-col gap-2 pt-1 shrink-0">
                      <button onClick={() => handleMoveItem(idx, 'up')} disabled={idx === 0} className="p-1.5 hover:bg-[#3f51b5] hover:text-white rounded-xl text-[#777680] disabled:opacity-0 transition-all"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={() => handleMoveItem(idx, 'down')} disabled={idx === screen.playlist.length - 1} className="p-1.5 hover:bg-[#3f51b5] hover:text-white rounded-xl text-[#777680] disabled:opacity-0 transition-all"><ChevronDown className="w-4 h-4" /></button>
                    </div>

                    <div className="w-28 aspect-video rounded-2xl bg-[#1b1b1f] overflow-hidden shrink-0 border border-[#e4e1ec] relative">
                       {m.type === MediaType.IMAGE || m.type === MediaType.GIF ? (
                         <img src={m.thumbnail_url || m.url} alt={m.name} className="w-full h-full object-cover" />
                       ) : m.type === MediaType.VIDEO ? (
                         <div className="relative w-full h-full">
                           {m.thumbnail_url ? (
                             <>
                               <img src={m.thumbnail_url} alt={m.name} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                 <Play className="w-6 h-6 text-white/80" fill="currentColor" />
                               </div>
                             </>
                           ) : (
                             <>
                               <video src={m.url} className="w-full h-full object-cover opacity-70" muted preload="metadata" />
                               <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                 <Play className="w-6 h-6 text-white/90" fill="currentColor" />
                               </div>
                             </>
                           )}
                         </div>
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center bg-[#2a2a2f]">
                           <FileText className="w-8 h-8 text-white/60 mb-2" />
                           <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">PDF</span>
                         </div>
                       )}
                       {isCurrent && <div className="absolute top-2 left-2 bg-emerald-500 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />}
                       <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-black text-white">
                         #{idx + 1}
                       </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full pt-1">
                       <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <p className="font-black text-[#1b1b1f] truncate leading-none text-sm">{m.name}</p>
                            <p className="text-[9px] font-black text-[#777680] uppercase tracking-[0.2em] mt-2">{m.type} • {m.size}</p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveItem(idx); }}
                            className="p-2 text-[#777680] hover:text-white hover:bg-[#ba1a1a] rounded-xl transition-all shadow-sm shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                       
                       <div className="flex items-center gap-3 mt-4 flex-wrap">
                          {/* Playback Mode Dropdown */}
                          <div className="relative">
                             <select
                               value={item.playbackConfig?.mode || 'loop'}
                               onChange={(e) => {
                                 const mode = e.target.value as 'loop' | 'once' | 'duration';
                                 handleUpdateItem(idx, {
                                   playbackConfig: {
                                     mode,
                                     duration: mode === 'duration' ? (item.duration || 60) : item.duration
                                   }
                                 });
                               }}
                               className="appearance-none bg-[#f3f3f7] border border-[#e4e1ec] rounded-2xl px-4 py-2 pr-8 text-xs font-black text-[#1b1b1f] cursor-pointer hover:border-[#3f51b5] transition-all focus:outline-none focus:ring-2 focus:ring-[#3f51b5]/20"
                             >
                               <option value="loop">Play Loop</option>
                               <option value="once">Play Once</option>
                               <option value="duration">Play Time</option>
                             </select>
                             <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777680] pointer-events-none" />
                          </div>

                          {/* Duration Input (shown when mode is 'duration' or 'loop') */}
                          {(item.playbackConfig?.mode === 'duration' || item.playbackConfig?.mode === 'loop' || !item.playbackConfig) && (
                            <div className="relative flex items-center gap-2 bg-[#f3f3f7] px-3 py-2 rounded-2xl border border-[#e4e1ec]">
                               <Timer className="w-3.5 h-3.5 text-[#3f51b5] shrink-0" />
                               {item.playbackConfig?.mode === 'duration' ? (
                                 <>
                                   <select
                                     value={item.duration || 60}
                                     onChange={(e) => {
                                       const duration = parseInt(e.target.value);
                                       handleUpdateItem(idx, {
                                         duration,
                                         playbackConfig: {
                                           mode: 'duration',
                                           duration
                                         }
                                       });
                                     }}
                                     className="appearance-none bg-transparent text-xs font-black outline-none text-[#1b1b1f] cursor-pointer pr-6"
                                   >
                                     <option value="30">30 Sec</option>
                                     <option value="60">1 Min</option>
                                     <option value="120">2 Min</option>
                                     <option value="300">5 Min</option>
                                     <option value="600">10 Min</option>
                                     <option value="1800">30 Min</option>
                                     <option value="3600">1 Hour</option>
                                   </select>
                                   <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#777680] pointer-events-none" />
                                 </>
                               ) : (
                                 <>
                                   <input 
                                     type="number" 
                                     min={1}
                                     value={item.duration} 
                                     onChange={(e) => handleUpdateItem(idx, { 
                                       duration: Math.max(1, parseInt(e.target.value) || 0),
                                       playbackConfig: {
                                         mode: item.playbackConfig?.mode || 'loop',
                                         duration: Math.max(1, parseInt(e.target.value) || 0)
                                       }
                                     })}
                                     className="w-12 bg-transparent text-xs font-black outline-none text-[#1b1b1f]"
                                   />
                                   <span className="text-[9px] font-black text-[#777680] uppercase shrink-0">Sec</span>
                                 </>
                               )}
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Virtual Screen Preview */}
        <div className="lg:col-span-5 space-y-6">
           <div className="flex items-center justify-between px-3">
             <h3 className="text-sm font-black text-[#1b1b1f] flex items-center gap-3 uppercase tracking-widest">
               <Tv className="w-5 h-5 text-[#3f51b5]" /> Virtual Display
             </h3>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Real-time</span>
             </div>
           </div>
           
           <div className="sticky top-24">
             <div 
               className="bg-[#1b1b1f] rounded-[40px] overflow-hidden shadow-2xl border-[6px] border-[#f3f3f7] flex items-center justify-center relative group"
               style={{
                 aspectRatio: screen.orientation === 'portrait' ? '9/16' : '16/9',
                 width: '100%',
                 maxHeight: '70vh'
               }}
             >
                {currentPreviewMedia ? (
                   <div key={currentPreviewItem?.id} className="w-full h-full animate-in fade-in duration-700">
                     {currentPreviewMedia.type === MediaType.VIDEO ? (
                       <video src={currentPreviewMedia.url} autoPlay muted loop className="w-full h-full object-contain" />
                     ) : currentPreviewMedia.type === MediaType.IMAGE || currentPreviewMedia.type === MediaType.GIF ? (
                       <img src={currentPreviewMedia.url} className="w-full h-full object-contain" alt={currentPreviewMedia.name} />
                     ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center bg-[#2a2a2f]">
                         <FileText className="w-16 h-16 text-white/60 mb-4" />
                         <p className="text-sm font-black text-white/40 uppercase tracking-widest">{currentPreviewMedia.name}</p>
                         <p className="text-xs font-medium text-white/30 mt-2">PDF Document</p>
                       </div>
                     )}
                   </div>
                ) : (
                   <div className="text-center opacity-20">
                      <Monitor className="w-12 h-12 text-white mx-auto mb-4" />
                      <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">No Feed</p>
                   </div>
                )}
                
                <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                   <div className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 flex items-center justify-between">
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-14 h-14 bg-white text-[#1b1b1f] rounded-2xl flex items-center justify-center shadow-lg transition-all hover:bg-[#e0e0ff]"
                      >
                        {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current translate-x-0.5" />}
                      </button>
                      <div className="text-right pr-4">
                         <p className="text-white text-sm font-black">Virtual Stream</p>
                         <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Synced to cloud</p>
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="mt-8 p-8 bg-[#3f51b5] rounded-[32px] text-white relative overflow-hidden shadow-xl shadow-[#3f51b5]/20">
                <div className="relative z-10 space-y-4">
                   <div className="flex items-start gap-5">
                      <div className="bg-white/10 p-4 rounded-2xl border border-white/10 shrink-0">
                         <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                         <h4 className="font-black text-lg tracking-tight mb-1">Live Deployment</h4>
                         <p className="text-xs font-medium text-white/70 leading-relaxed">
                            Any changes made to this loop are instantly pushed to physical TV <span className="font-black text-white">{screen.screenCode}</span>.
                         </p>
                      </div>
                   </div>
                   
                   {/* Public Player Link */}
                   <div className="mt-6 pt-6 border-t border-white/10">
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-3">Public Player Link</p>
                      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                         <div className="flex-1 min-w-0">
                            <a 
                               href={getTvPlayerUrl(screen.screenCode)}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="text-sm font-bold text-white break-all hover:text-white/80 transition-colors flex items-center gap-2"
                            >
                               {getTvPlayerUrl(screen.screenCode)}
                               <ExternalLink className="w-4 h-4 shrink-0" />
                            </a>
                         </div>
                         <button
                            onClick={async () => {
                               const link = getTvPlayerUrl(screen.screenCode);
                               await navigator.clipboard.writeText(link);
                               setLinkCopied(true);
                               setTimeout(() => setLinkCopied(false), 2000);
                            }}
                            className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl border border-white/20 transition-all shrink-0"
                            title="Copy link"
                         >
                            {linkCopied ? (
                               <Check className="w-4 h-4 text-white" />
                            ) : (
                               <Copy className="w-4 h-4 text-white" />
                            )}
                         </button>
                      </div>
                      <p className="text-[10px] font-medium text-white/50 mt-2 leading-relaxed">
                         Open this link on your TV display to view the live broadcast.
                      </p>
                   </div>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
             </div>
           </div>
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Import Library Media">
         <div className="space-y-6">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777680]" />
               <input 
                 type="text" 
                 placeholder="Search assets..." 
                 value={searchMedia}
                 onChange={(e) => setSearchMedia(e.target.value)}
                 className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#e4e1ec] bg-[#f3f3f7] text-sm font-bold focus:bg-white transition-all outline-none"
               />
            </div>
            <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
               {allMedia.filter(m => m.name.toLowerCase().includes(searchMedia.toLowerCase())).map(m => (
                 <div 
                   key={m.id}
                   onClick={() => handleAddMedia(m)}
                   className="group relative aspect-video bg-[#1b1b1f] rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-[#3f51b5] transition-all shadow-sm"
                 >
                    {m.type === MediaType.IMAGE || m.type === MediaType.GIF ? (
                      <img src={m.thumbnail_url || m.url} alt={m.name} className="w-full h-full object-cover" />
                    ) : m.type === MediaType.VIDEO ? (
                      <div className="relative w-full h-full">
                        {m.thumbnail_url ? (
                          <img src={m.thumbnail_url} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <video src={m.url} className="w-full h-full object-cover opacity-60" muted />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="w-8 h-8 text-white/80" fill="currentColor" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#2a2a2f]">
                        <FileText className="w-10 h-10 text-white/60 mb-2" />
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">PDF</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                       <Plus className="w-8 h-8 text-white" strokeWidth={3} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                       <p className="text-[10px] font-black text-white truncate uppercase tracking-widest">{m.name}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default ScreenEditor;
