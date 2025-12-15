import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Screen, AspectRatio, MediaItem, Schedule, RepeatType } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input, Select } from '../components/Input';
import { ConfirmModal } from '../components/ConfirmModal';
import { showToast } from '../components/Toast';
import { 
    Monitor, Plus, Trash2, AlertTriangle, Lock, Copy, 
    QrCode, Tv, Smartphone, Maximize2, ExternalLink, Link as LinkIcon, 
    MoreHorizontal, FileText, Clock, Calendar, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { normalizeMediaUrl } from '../utils/url';

// ... (ScreenModalPlayer and ScreenCardItem components can remain mostly same, simplified for brevity here but need to ensure props match)

const ScreenCardItem: React.FC<{
  screen: Screen;
  mediaMap: Record<string, MediaItem>;
  canCreate: boolean;
  onDuplicate: (e: React.MouseEvent, id: string) => void;
  onDelete: (e: React.MouseEvent, screen: Screen) => void;
  onQr: (screen: Screen) => void;
  onPreview: (screen: Screen) => void;
  onSchedule: (screen: Screen) => void;
  navigate: (path: string) => void;
}> = ({ screen, mediaMap, canCreate, onDuplicate, onDelete, onQr, onPreview, onSchedule, navigate }) => {
    const media = screen.playlist[0] ? mediaMap[screen.playlist[0].mediaId] : null;
    const publicUrl = `${window.location.origin}/tv/${screen.screenCode}`;
    
    const handleCopyLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(publicUrl);
        showToast('Link copied to clipboard', 'success');
    };
    return (
        <Card className="flex flex-col h-full overflow-hidden border-slate-200/60 p-0 group hover:scale-[1.02] transition-all duration-300 min-w-0">
             <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 group cursor-pointer overflow-hidden flex-shrink-0" onClick={() => onPreview(screen)}>
                 {media ? (
                     <img 
                         src={normalizeMediaUrl(media.url)} 
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                         alt={screen.name}
                     />
                 ) : (
                     <div className="flex items-center justify-center h-full text-slate-400">
                         <div className="text-center">
                             <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
                             <p className="text-xs text-slate-500">No media</p>
                         </div>
                     </div>
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="bg-white/90 backdrop-blur-sm rounded-lg p-1.5 shadow-lg">
                         <ExternalLink className="w-4 h-4 text-slate-700" />
                     </div>
                 </div>
             </div>
             <div className="p-5 flex flex-col flex-1 bg-gradient-to-br from-white to-slate-50/50 min-w-0">
                 <div className="flex items-start justify-between mb-3 min-w-0">
                     <div className="flex-1 min-w-0">
                        <h3 
                            className="text-lg font-bold text-slate-900 truncate" 
                            title={screen.name}
                        >
                            {screen.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                {screen.screenCode}
                            </span>
                        </div>
                     </div>
                 </div>
                 <div className="space-y-2 mb-4">
                     <div className="text-xs text-slate-500 flex items-center gap-4">
                         <span>{screen.playlist.length} {screen.playlist.length === 1 ? 'item' : 'items'} in playlist</span>
                         <span className="flex items-center gap-1">
                             <span className="capitalize">{screen.orientation}</span>
                             <span>•</span>
                             <span>{screen.aspectRatio}</span>
                         </span>
                     </div>
                     
                     {/* Public Player Link - Always Visible */}
                     <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                         <LinkIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                         <input
                             type="text"
                             value={publicUrl}
                             readOnly
                             className="flex-1 text-xs font-mono text-slate-600 bg-transparent border-none outline-none truncate"
                             onClick={(e) => e.currentTarget.select()}
                         />
                         <button
                             onClick={handleCopyLink}
                             className="p-1 hover:bg-slate-200 rounded transition-colors flex-shrink-0"
                             title="Copy link"
                         >
                             <Copy className="w-3.5 h-3.5 text-slate-500" />
                         </button>
                     </div>
                     
                 </div>
                 <div className="mt-auto pt-4 flex gap-2 border-t border-slate-100">
                     <Button 
                         variant="secondary" 
                         className="flex-1 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700" 
                         onClick={() => navigate(`/screens/${screen.id}`)}
                     >
                         Edit
                     </Button>
                     <button 
                         onClick={(e) => { e.stopPropagation(); onQr(screen); }} 
                         className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-all duration-200"
                         title="Show QR Code"
                     >
                         <QrCode className="w-4 h-4" />
                     </button>
                     <button 
                         onClick={(e) => onDuplicate(e, screen.id)} 
                         disabled={!canCreate}
                         className={`p-2.5 rounded-lg transition-all duration-200 ${
                             canCreate 
                                 ? 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600' 
                                 : 'text-slate-300 cursor-not-allowed'
                         }`}
                         title={canCreate ? "Duplicate Screen" : "Screen limit reached - cannot duplicate"}
                     >
                         <Copy className="w-4 h-4" />
                     </button>
                     <button 
                         onClick={(e) => onDelete(e, screen)} 
                         className="p-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200"
                         title="Delete Screen"
                     >
                         <Trash2 className="w-4 h-4" />
                     </button>
                 </div>
             </div>
        </Card>
    );
};

const Screens: React.FC = () => {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [mediaMap, setMediaMap] = useState<Record<string, MediaItem>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');
  const [newScreenOrientation, setNewScreenOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [newScreenAspectRatio, setNewScreenAspectRatio] = useState<AspectRatio>('16:9');
  
  const [screenToDelete, setScreenToDelete] = useState<Screen | null>(null);
  const [qrScreen, setQrScreen] = useState<Screen | null>(null);
  const [previewScreen, setPreviewScreen] = useState<Screen | null>(null);
  const [scheduleScreen, setScheduleScreen] = useState<Screen | null>(null);
  
  const [canCreate, setCanCreate] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const loadData = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      // Force refresh to get latest ping status
      const s = await StorageService.getScreens(forceRefresh);
      setScreens(s);
      const allMedia = await StorageService.getMedia();
      const map: Record<string, MediaItem> = {};
      allMedia.forEach(m => map[m.id] = m);
      setMediaMap(map);

      const check = await StorageService.canCreateScreen();
      setCanCreate(check.allowed);
    } catch (err) {
      console.error('Failed to load screens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true); // Load data on initial mount only
  }, []);

  const handleCreateScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    
    const newScreen: Screen = {
      id: Date.now().toString(),
      screenCode: StorageService.generateCode(),
      name: newScreenName,
      orientation: newScreenOrientation,
      aspectRatio: newScreenAspectRatio,
      playlist: [],
      createdAt: Date.now()
    };
    await StorageService.saveScreen(newScreen);
    await loadData();
    setIsModalOpen(false);
    navigate(`/screens/${newScreen.id}`); // Assuming ID is updated or we use returned ID
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      
      // Check if user can create more screens
      const check = await StorageService.canCreateScreen();
      if (!check.allowed) {
          showToast(check.reason || 'Screen limit reached. Please upgrade your plan to create more screens.', 'warning');
          return;
      }
      
      try {
          await StorageService.duplicateScreen(id);
          await loadData();
          showToast('Screen duplicated successfully', 'success');
      } catch (error: any) {
          showToast(error.message || 'Failed to duplicate screen. Screen limit may have been reached.', 'error');
      }
  };

  const confirmDelete = async () => {
    if (screenToDelete) {
        await StorageService.deleteScreen(screenToDelete.id);
        const schedules = await StorageService.getSchedules();
        // Delete associated schedules
        const toDelete = schedules.filter(s => s.screenId === screenToDelete.id);
        await Promise.all(toDelete.map(s => StorageService.deleteSchedule(s.id)));
        
        await loadData();
        setScreenToDelete(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            Screens
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Manage your display configurations</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)} 
          disabled={!canCreate}
          className="shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Screen
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-slate-200/60 p-0 animate-pulse">
              <div className="aspect-video bg-slate-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="h-10 bg-slate-200 rounded"></div>
                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <div className="h-9 bg-slate-200 rounded flex-1"></div>
                  <div className="h-9 w-9 bg-slate-200 rounded"></div>
                  <div className="h-9 w-9 bg-slate-200 rounded"></div>
                  <div className="h-9 w-9 bg-slate-200 rounded"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : screens.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Monitor className="w-10 h-10 text-slate-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No screens yet</h3>
              <p className="text-slate-500 mb-4">Create your first screen to get started</p>
              <Button onClick={() => setIsModalOpen(true)} disabled={!canCreate}>
                <Plus className="w-4 h-4 mr-2" /> Create Your First Screen
              </Button>
            </div>
          </div>
        </Card>
      ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {screens.map((screen) => (
                  <ScreenCardItem
                    key={screen.id}
                    screen={screen}
                    mediaMap={mediaMap}
                    canCreate={canCreate}
                    onDuplicate={handleDuplicate}
                    onDelete={(e, s) => { e.stopPropagation(); setScreenToDelete(s); }}
                    onQr={setQrScreen}
                    onPreview={setPreviewScreen}
                    onSchedule={setScheduleScreen}
                    navigate={navigate}
                  />
                ))}
              </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => {
          setIsModalOpen(false);
          setNewScreenName('');
          setNewScreenOrientation('landscape');
          setNewScreenAspectRatio('16:9');
      }} title="Create New Screen">
         <form onSubmit={handleCreateScreen} className="space-y-5">
             <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Screen Name</label>
                 <Input 
                     value={newScreenName} 
                     onChange={e => setNewScreenName(e.target.value)} 
                     placeholder="e.g., Lobby TV, Menu Board Left" 
                     required
                 />
             </div>
             
             <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Orientation</label>
                 <div className="grid grid-cols-2 gap-3">
                     <button
                         type="button"
                         onClick={() => setNewScreenOrientation('landscape')}
                         className={`p-4 rounded-xl border-2 transition-all ${
                             newScreenOrientation === 'landscape'
                                 ? 'border-indigo-500 bg-indigo-50'
                                 : 'border-slate-200 hover:border-slate-300'
                         }`}
                     >
                         <div className="flex flex-col items-center gap-2">
                             <Tv className={`w-8 h-8 ${newScreenOrientation === 'landscape' ? 'text-indigo-600' : 'text-slate-400'}`} />
                             <span className={`text-sm font-medium ${newScreenOrientation === 'landscape' ? 'text-indigo-700' : 'text-slate-600'}`}>
                                 Landscape
                             </span>
                             <span className="text-xs text-slate-500">16:9 Standard</span>
                         </div>
                     </button>
                     <button
                         type="button"
                         onClick={() => setNewScreenOrientation('portrait')}
                         className={`p-4 rounded-xl border-2 transition-all ${
                             newScreenOrientation === 'portrait'
                                 ? 'border-indigo-500 bg-indigo-50'
                                 : 'border-slate-200 hover:border-slate-300'
                         }`}
                     >
                         <div className="flex flex-col items-center gap-2">
                             <Smartphone className={`w-8 h-8 ${newScreenOrientation === 'portrait' ? 'text-indigo-600' : 'text-slate-400'}`} />
                             <span className={`text-sm font-medium ${newScreenOrientation === 'portrait' ? 'text-indigo-700' : 'text-slate-600'}`}>
                                 Portrait
                             </span>
                             <span className="text-xs text-slate-500">9:16 Vertical</span>
                         </div>
                     </button>
                 </div>
             </div>

             <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-2">Aspect Ratio</label>
                 <Select 
                     value={newScreenAspectRatio} 
                     onChange={e => setNewScreenAspectRatio(e.target.value as AspectRatio)}
                 >
                     <option value="16:9">16:9 (Widescreen)</option>
                     <option value="4:3">4:3 (Standard)</option>
                     <option value="21:9">21:9 (Ultrawide)</option>
                 </Select>
             </div>

             {!canCreate && (
                 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                     <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                     <div className="flex-1">
                         <p className="text-sm font-semibold text-amber-900">Screen Limit Reached</p>
                         <p className="text-xs text-amber-700 mt-1">
                             Your current plan has reached its screen limit. 
                             Upgrade to create more screens.
                         </p>
                     </div>
                 </div>
             )}

             <div className="flex gap-3 pt-2">
                 <Button 
                     type="submit" 
                     disabled={!canCreate || !newScreenName.trim()}
                     className="flex-1"
                 >
                     Create Screen
                 </Button>
                 <Button 
                     type="button" 
                     variant="secondary"
                     onClick={() => {
                         setIsModalOpen(false);
                         setNewScreenName('');
                         setNewScreenOrientation('landscape');
                         setNewScreenAspectRatio('16:9');
                     }}
                 >
                     Cancel
                 </Button>
             </div>
         </form>
      </Modal>

      <Modal isOpen={!!screenToDelete} onClose={() => setScreenToDelete(null)} title="Delete Screen">
         <div className="space-y-4">
             <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                 <p className="text-sm text-red-900 font-medium mb-2">
                     Are you sure you want to delete <strong>{screenToDelete?.name}</strong>?
                 </p>
                 <p className="text-xs text-red-700">
                     This will also delete all schedules associated with this screen. This action cannot be undone.
                 </p>
             </div>
             <div className="flex gap-3">
                 <Button variant="danger" onClick={confirmDelete} className="flex-1">Delete Screen</Button>
                 <Button variant="secondary" onClick={() => setScreenToDelete(null)}>Cancel</Button>
             </div>
         </div>
      </Modal>

      {/* QR Code Modal */}
      <Modal isOpen={!!qrScreen} onClose={() => setQrScreen(null)} title="Screen Pairing Code">
         {qrScreen && (
             <div className="space-y-6 text-center">
                 <div className="bg-slate-50 rounded-2xl p-8">
                     <div className="text-6xl font-mono font-bold text-indigo-600 mb-4 tracking-wider">
                         {qrScreen.screenCode}
                     </div>
                     <p className="text-sm text-slate-600 mb-2">Enter this code on your TV display</p>
                     <p className="text-xs text-slate-500">
                         Go to <strong>/tv</strong> on your TV browser and enter this code
                     </p>
                 </div>
                 <div className="flex gap-3">
                     <Button 
                         variant="secondary" 
                         onClick={() => {
                             navigator.clipboard.writeText(qrScreen.screenCode);
                             showToast('Code copied to clipboard', 'success');
                         }}
                         className="flex-1"
                     >
                         <Copy className="w-4 h-4 mr-2" /> Copy Code
                     </Button>
                     <Button 
                         onClick={() => window.open(`/tv/${qrScreen.screenCode}`, '_blank')}
                         className="flex-1"
                     >
                         <ExternalLink className="w-4 h-4 mr-2" /> Open Player
                     </Button>
                 </div>
             </div>
         )}
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={!!previewScreen} onClose={() => setPreviewScreen(null)} title={`Preview: ${previewScreen?.name}`}>
         {previewScreen && (
             <div className="space-y-4">
                 <div className="aspect-video bg-black rounded-lg overflow-hidden">
                     {previewScreen.playlist[0] && mediaMap[previewScreen.playlist[0].mediaId] ? (
                         <img 
                             src={mediaMap[previewScreen.playlist[0].mediaId].url} 
                             alt="Preview" 
                             className="w-full h-full object-contain"
                         />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center text-white">
                             <Monitor className="w-16 h-16 opacity-50" />
                         </div>
                     )}
                 </div>
                 <p className="text-sm text-slate-600 text-center">
                     This is a preview of the first item in the playlist
                 </p>
             </div>
         )}
      </Modal>
    </div>
  );
};

export default Screens;
