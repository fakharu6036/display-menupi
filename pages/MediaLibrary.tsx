
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { MediaItem, MediaType, PlanType, Screen, PlaybackConfig } from '../types';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { 
  Upload, 
  Trash2, 
  ImageIcon, 
  FileVideo, 
  FileText, 
  Check, 
  AlertCircle, 
  Plus, 
  Search, 
  MoreVertical,
  X,
  HardDrive
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MediaLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const planConfig = StorageService.getCurrentPlanConfig();
  const usedStorage = media.reduce((acc, m) => acc + (m.size_mb || 0), 0);

  const loadData = async () => {
    try {
      const [m, s] = await Promise.all([
        StorageService.getMedia(),
        StorageService.getScreens()
      ]);
      setMedia(m || []);
      setScreens(s || []);
    } catch (e: any) {
      console.error("Failed to load media data:", e);
      if (e.message?.includes('Session expired') || e.message?.includes('401')) {
        navigate('/login');
      }
      setMedia([]);
      setScreens([]);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('menupi-storage-change', loadData);
    return () => window.removeEventListener('menupi-storage-change', loadData);
  }, [navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadProgress(10);
    
    try {
      await StorageService.uploadMedia(file);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadProgress(0);
      }, 500);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
      setUploadProgress(0);
    }
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    if (next.size === 0) setIsSelectionMode(false);
    else setIsSelectionMode(true);
  };

  const handleBatchDelete = async () => {
    if (window.confirm(`Delete ${selectedIds.size} items?`)) {
      await StorageService.deleteMediaBatch(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const filteredMedia = media.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-fade w-full">
      {isSelectionMode && (
        <div className="fixed top-16 md:top-20 left-0 right-0 z-50 bg-[#3f51b5] text-white p-4 flex items-center justify-between shadow-lg animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <button onClick={() => { setSelectedIds(new Set()); setIsSelectionMode(false); }} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg">{selectedIds.size} Selected</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleBatchDelete} className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-all">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1b1b1f] tracking-tight">Media Library</h1>
          <p className="text-[#44474e] mt-1 font-medium flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> {usedStorage.toFixed(1)} MB of {planConfig.storageMB} MB used
          </p>
        </div>
        <div className="hidden md:flex gap-3">
           <Button variant="tonal" onClick={() => setIsSelectionMode(!isSelectionMode)}>
             {isSelectionMode ? 'Cancel Selection' : 'Select Items'}
           </Button>
           <Button onClick={() => setIsUploadModalOpen(true)}>
             <Plus className="w-4 h-4 mr-2" /> Upload Asset
           </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#777680]" />
        <input 
          type="text" 
          placeholder="Search by filename..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#e4e1ec] focus:ring-2 focus:ring-[#e0e0ff] outline-none bg-white font-medium text-[#1b1b1f] shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredMedia.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-[#f3f3f7] rounded-2xl border-2 border-dashed border-[#e4e1ec]">
             <ImageIcon className="w-16 h-16 text-[#e4e1ec] mx-auto mb-4" />
             <p className="text-[#44474e] font-bold text-xl">Your library is empty</p>
             <p className="text-[#777680] text-sm mt-1">Upload images or videos to start building your menu.</p>
             <Button onClick={() => setIsUploadModalOpen(true)} className="mt-6 rounded-2xl px-8">Upload First File</Button>
          </div>
        ) : (
          filteredMedia.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div 
                key={item.id}
                className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm cursor-pointer ${isSelected ? 'border-[#3f51b5] ring-2 ring-[#3f51b5]/20' : 'border-[#e4e1ec] hover:border-[#3f51b5]/40 hover:shadow-md'}`}
                onClick={() => isSelectionMode ? toggleSelect(item.id) : navigate(`/media/${item.id}`)}
              >
                <div className="aspect-[4/3] bg-[#1b1b1f] relative overflow-hidden flex items-center justify-center">
                  {item.type === MediaType.IMAGE || item.type === MediaType.GIF ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : item.type === MediaType.VIDEO ? (
                    <>
                      <video src={item.url} className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/20">
                          <FileVideo className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                       <FileText className="w-12 h-12 text-[#e4e1ec]" />
                       <span className="text-[10px] font-bold text-white uppercase tracking-widest">PDF DOC</span>
                    </div>
                  )}
                  <div className={`absolute top-4 left-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#3f51b5] border-[#3f51b5] scale-100' : isSelectionMode ? 'bg-white/80 border-[#3f51b5]/30' : 'opacity-0 scale-90 group-hover:opacity-100'}`}>
                    {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#1b1b1f] truncate text-sm">{item.name}</p>
                    <p className="text-[10px] font-bold text-[#777680] uppercase tracking-widest mt-1">{item.size_mb?.toFixed(1) || '0'} MB • {item.type}</p>
                  </div>
                  <button className="p-2 text-[#777680] hover:bg-[#f3f3f7] rounded-xl transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button 
        onClick={() => setIsUploadModalOpen(true)}
        className="md:hidden fixed bottom-24 right-6 w-16 h-16 bg-[#3f51b5] text-white rounded-2xl shadow-xl flex items-center justify-center active:scale-95 transition-all z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Add Asset">
        <div className="space-y-6">
          <div className="border-2 border-dashed border-[#e4e1ec] rounded-2xl p-10 text-center relative hover:bg-[#f3f3f7] transition-colors group cursor-pointer">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={handleFileUpload}
            />
            <div className="space-y-4">
              <div className="bg-[#e0e0ff] text-[#3f51b5] w-14 h-14 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1b1b1f]">Tap to upload</p>
                <p className="text-sm text-[#777680] mt-1 font-medium">MP4, JPG, PNG or PDF (Max 50MB)</p>
              </div>
            </div>
          </div>
          {uploadProgress > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-[#44474e] uppercase tracking-widest">
                <span>Uploading Asset...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-[#f3f3f7] rounded-full overflow-hidden">
                <div className="h-full bg-[#3f51b5] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
          {error && (
            <div className="bg-[#ba1a1a]/10 text-[#ba1a1a] p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MediaLibrary;
