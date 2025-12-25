
import React, { useState, useEffect, useRef } from 'react';
import { StorageService, StagedPlaylistItem } from '../services/storage';
import { Screen, ScreenStatus, MediaItem, MediaType, Schedule } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Tv, Plus, Monitor, Upload, X, FileText, Calendar, QrCode, RefreshCw, 
  CheckCircle2, Copy, Check, Image as ImageIcon, Search, ChevronUp, ChevronDown, 
  Play, Pause, MonitorPlay, Smartphone, Timer, Trash2, ArrowRight, ArrowLeft, Clock, Scan, Sparkles, History, Zap
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getApiBase } from '../services/config';

const ScreenPreview = ({ screen, media }: { screen: Screen, media: MediaItem[] }) => {
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    if (screen.playlist.length <= 1 || screen.isPaused) return;
    const current = screen.playlist[index];
    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % screen.playlist.length);
    }, (current?.duration || 10) * 1000);
    return () => clearTimeout(timer);
  }, [index, screen.playlist, screen.isPaused]);

  const currentItem = screen.playlist[index];
  const currentMedia = media.find(m => m.id === currentItem?.mediaId);

  return (
    <div className={`relative w-full overflow-hidden bg-[#1b1b1f] flex items-center justify-center border-b border-[#e4e1ec] ${screen.orientation === 'portrait' ? 'aspect-[9/16]' : 'aspect-video'}`}>
      {currentMedia ? (
        currentMedia.type === MediaType.VIDEO ? (
          <video src={currentMedia.url} className="w-full h-full object-cover opacity-80" muted autoPlay loop />
        ) : (
          <img src={currentMedia.url} alt={currentMedia.name} className="w-full h-full object-cover opacity-80" />
        )
      ) : (
        <div className="flex flex-col items-center gap-3 opacity-20">
          <Monitor className="w-10 h-10 text-white" />
          <p className="text-[10px] font-bold text-white uppercase tracking-widest">No Content</p>
        </div>
      )}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${screen.status === ScreenStatus.LIVE ? 'bg-emerald-500 text-white' : 'bg-[#44474e] text-white/60'}`}>
          {screen.status}
        </span>
      </div>
    </div>
  );
};

interface StagedItem {
  id: string; 
  type: 'library' | 'upload';
  mediaId?: string;
  file?: File;
  name: string;
  duration: number;
  previewUrl?: string; 
  playMode: 'duration' | 'repeat';
  repeatCount: number;
}

const Screens: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchLibrary, setSearchLibrary] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  
  // Creation State
  const [name, setName] = useState('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [stagedPlaylist, setStagedPlaylist] = useState<StagedItem[]>([]);
  
  // Automation state
  const [automationMode, setAutomationMode] = useState<'none' | 'existing' | 'quick'>('none');
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [quickStartTime, setQuickStartTime] = useState('09:00');
  const [quickEndTime, setQuickEndTime] = useState('22:00');
  const [quickDays, setQuickDays] = useState<number[]>([1,2,3,4,5]);

  const [createdScreen, setCreatedScreen] = useState<Screen | null>(null);

  // QR Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [s, m, sch] = await Promise.all([
        StorageService.getScreens(), 
        StorageService.getMedia(),
        StorageService.getSchedules()
      ]);
      setScreens(s || []);
      setAllMedia(m || []);
      setAllSchedules(sch || []);
    } catch (e: any) {
      console.error("Failed to load screens data:", e);
      if (e.message?.includes('Session expired') || e.message?.includes('401')) {
        navigate('/login');
      }
      setScreens([]);
      setAllMedia([]);
      setAllSchedules([]);
    }
  };

  useEffect(() => {
    load();
    if ((location.state as any)?.openCreate) setIsModalOpen(true);
    const draft = localStorage.getItem('menupi_screen_draft');
    if (draft) setHasDraft(true);
  }, [location.state, navigate]);

  useEffect(() => {
    if (isModalOpen && !isSuccess && (name || stagedPlaylist.length > 0)) {
      const draftData = {
        name,
        orientation,
        stagedPlaylist: stagedPlaylist.map(item => ({ ...item, file: undefined })),
        automationMode,
        selectedScheduleId,
        quickStartTime,
        quickEndTime,
        quickDays,
        currentStep
      };
      localStorage.setItem('menupi_screen_draft', JSON.stringify(draftData));
    }
  }, [name, orientation, stagedPlaylist, automationMode, selectedScheduleId, quickStartTime, quickEndTime, quickDays, currentStep, isModalOpen, isSuccess]);

  const resumeDraft = () => {
    const draftStr = localStorage.getItem('menupi_screen_draft');
    if (draftStr) {
      const draft = JSON.parse(draftStr) as any;
      setName(draft.name || '');
      setOrientation(draft.orientation || 'landscape');
      const restoredPlaylist = (draft.stagedPlaylist || []).map((item: any) => ({
        ...item,
        file: undefined 
      })) as StagedItem[];
      setStagedPlaylist(restoredPlaylist);
      setAutomationMode(draft.automationMode || 'none');
      setSelectedScheduleId(draft.selectedScheduleId || null);
      setQuickStartTime(draft.quickStartTime || '09:00');
      setQuickEndTime(draft.quickEndTime || '22:00');
      setQuickDays(draft.quickDays || [1,2,3,4,5]);
      setCurrentStep(draft.currentStep || 1);
    }
    setHasDraft(false);
  };

  const clearDraft = () => {
    localStorage.removeItem('menupi_screen_draft');
    setHasDraft(false);
  };

  const handleCreate = async () => {
    const items: StagedPlaylistItem[] = stagedPlaylist.map(item => ({
      type: item.type,
      mediaId: item.mediaId,
      file: (item.file && item.file instanceof File) ? item.file : undefined,
      duration: item.duration
    }));

    let scheduleData: { startTime: string, endTime?: string, days: number[] } | undefined = undefined;

    if (automationMode === 'quick') {
      scheduleData = {
        startTime: quickStartTime,
        endTime: quickEndTime,
        days: quickDays
      };
    } else if (automationMode === 'existing' && selectedScheduleId) {
      const existing = allSchedules.find(s => s.id === selectedScheduleId);
      if (existing) {
        scheduleData = {
          startTime: existing.startTime,
          endTime: existing.endTime,
          days: existing.days
        };
      }
    }

    const screen = await StorageService.createScreenComplete({ 
      name, 
      orientation, 
      stagedPlaylist: items,
      schedule: scheduleData
    });
    
    setCreatedScreen(screen);
    setIsSuccess(true);
    clearDraft();
    load();
  };

  const startScanner = async () => {
    if (!createdScreen) {
      alert("Please create a screen first before scanning.");
      return;
    }

    setIsScanning(true);
    setScanError(null);
    
    try {
      const scannerId = "qr-reader";
      const qrCodeScanner = new Html5Qrcode(scannerId);
      qrCodeScannerRef.current = qrCodeScanner;

      await qrCodeScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // QR Code detected
          handleQRCodeDetected(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (just means no QR code visible yet)
        }
      );
    } catch (err: any) {
      console.error("Scanner error:", err);
      setScanError(err.message || "Failed to start camera");
      setIsScanning(false);
    }
  };

  const handleQRCodeDetected = async (qrText: string) => {
    try {
      // Parse QR code format: MENUPI:deviceId
      if (!qrText.startsWith('MENUPI:')) {
        setScanError('Invalid QR code format. Please scan a TV pairing code.');
        return;
      }

      const deviceId = qrText.replace('MENUPI:', '').trim();
      if (!deviceId) {
        setScanError('Invalid device ID in QR code.');
        return;
      }

      // Stop scanner
      stopScanner();

      // Pair the device with the current screen
      const API_BASE = getApiBase();
      const res = await fetch(`${API_BASE}/api/tvs/${deviceId}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('menupi_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          screenId: createdScreen.id 
        })
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to pair device' }));
        setScanError(error.error || 'Failed to pair device');
        return;
      }

      // Success - reload screens and close modal
      await load();
      setIsModalOpen(false);
      reset();
      alert(`TV paired successfully! Device ${deviceId.substring(0, 8)} is now connected to ${createdScreen.name}`);
    } catch (err: any) {
      console.error("QR pairing error:", err);
      setScanError(err.message || 'Failed to pair device');
    }
  };

  const stopScanner = async () => {
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
    setScanError(null);
  };

  const reset = () => {
    stopScanner();
    setIsSuccess(false); setCurrentStep(1); setName(''); setOrientation('landscape'); 
    setStagedPlaylist([]); setSelectedScheduleId(null); setCreatedScreen(null); 
    setSearchLibrary(''); setAutomationMode('none');
  };

  const addToStaged = (m: MediaItem) => {
    const newItem: StagedItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'library',
      mediaId: m.id,
      name: m.name,
      duration: 10,
      previewUrl: m.url,
      playMode: 'duration',
      repeatCount: 1
    };
    setStagedPlaylist(prev => [...prev, newItem]);
  };

  const handleDirectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file: File) => {
      const previewUrl = URL.createObjectURL(file);
      const newItem: StagedItem = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'upload',
        file: file,
        name: file.name,
        duration: 10,
        previewUrl,
        playMode: 'duration',
        repeatCount: 1
      };
      setStagedPlaylist(prev => [...prev, newItem]);
    });
  };

  const removeFromStaged = (id: string) => {
    setStagedPlaylist(prev => prev.filter(p => p.id !== id));
  };

  const moveStaged = (index: number, direction: 'up' | 'down') => {
    const next = [...stagedPlaylist];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setStagedPlaylist(next);
  };

  const filteredLibrary = allMedia.filter(m => m.name.toLowerCase().includes(searchLibrary.toLowerCase()));

  const daysLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const Stepper = () => (
    <div className="flex items-center justify-between px-6 py-4 mb-4 border-b border-[#f3f3f7]">
       {[1, 2, 3].map(step => (
         <div key={step} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${currentStep === step ? 'bg-[#3f51b5] text-white' : currentStep > step ? 'bg-emerald-500 text-white' : 'bg-[#f3f3f7] text-[#777680]'}`}>
               {currentStep > step ? <Check className="w-4 h-4" /> : step}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:inline ${currentStep === step ? 'text-[#3f51b5]' : 'text-[#777680]'}`}>
               {step === 1 ? 'Basics' : step === 2 ? 'Content' : 'Automation'}
            </span>
            {step < 3 && <div className="w-8 h-px bg-[#e4e1ec] mx-2 hidden sm:block" />}
         </div>
       ))}
    </div>
  );

  return (
    <div className="space-y-8 animate-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#1b1b1f] tracking-tight">Your Displays</h1>
          <p className="text-[#44474e] font-medium mt-1">Cloud-synced TV network.</p>
        </div>
        <Button onClick={() => { reset(); setIsModalOpen(true); }} className="rounded-[16px]">
          <Plus className="w-4 h-4 mr-2" /> New Display
        </Button>
      </div>

      {hasDraft && !isModalOpen && (
        <div className="bg-[#e0e0ff] p-4 rounded-2xl flex items-center justify-between border border-[#3f51b5]/20 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-[#3f51b5]" />
              <p className="text-sm font-bold text-[#00006e]">Resume unfinished registration?</p>
           </div>
           <div className="flex gap-2">
              <button onClick={clearDraft} className="px-3 py-1 text-xs font-black text-[#3f51b5] uppercase rounded-lg">Discard</button>
              <button onClick={() => { setIsModalOpen(true); resumeDraft(); }} className="px-4 py-1.5 bg-[#3f51b5] text-white text-xs font-black uppercase rounded-xl">Resume</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {screens.length === 0 ? (
          <Card className="col-span-full py-32 text-center bg-[#f3f3f7] border-2 border-dashed border-[#e4e1ec]">
             <Tv className="w-16 h-16 text-[#e4e1ec] mx-auto mb-4" />
             <p className="text-[#44474e] font-bold text-xl">No active displays</p>
             <Button onClick={() => setIsModalOpen(true)} className="mt-8 rounded-[12px] px-10 h-14">Link TV Now</Button>
          </Card>
        ) : (
          screens.map((screen) => (
            <div 
              key={screen.id} 
              className="bg-white rounded-[16px] border border-[#e4e1ec] hover:border-[#3f51b5]/30 transition-all group overflow-hidden shadow-sm flex flex-col cursor-pointer"
              onClick={() => navigate(`/screens/${screen.id}`)}
            >
              <ScreenPreview screen={screen} media={allMedia} />
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-black text-[#1b1b1f] text-lg truncate leading-tight">{screen.name}</h3>
                    <p className="text-[10px] font-black text-[#777680] uppercase tracking-widest mt-1.5">
                      CODE: {screen.screenCode} • {screen.playlist.length} ASSETS
                    </p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); StorageService.saveScreen({...screen, isPaused: !screen.isPaused}); load(); }}
                    className={`w-12 h-12 rounded-[12px] flex items-center justify-center transition-all ${screen.isPaused ? 'bg-[#3f51b5] text-white' : 'bg-[#f3f3f7] text-[#777680] hover:bg-[#e0e0ff]'}`}
                  >
                    {screen.isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); reset(); }} title={isSuccess ? "Ready to Pair" : "Setup Wizard"}>
        <div className="max-h-[85vh] overflow-y-auto no-scrollbar -mx-6 px-6">
           {!isSuccess ? (
             <div className="pb-6">
                <Stepper />

                {/* STEP 1: BASICS */}
                {currentStep === 1 && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-4">
                      <h3 className="text-xl font-black text-[#1b1b1f] tracking-tight">Display Name</h3>
                      <Input label="How should we label this TV?" placeholder="e.g. Menu Board East" value={name} onChange={e => setName(e.target.value)} autoFocus />
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-xl font-black text-[#1b1b1f] tracking-tight">TV Orientation</h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div 
                             onClick={() => setOrientation('landscape')}
                             className={`p-6 rounded-[28px] border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 ${orientation === 'landscape' ? 'bg-[#e0e0ff]/40 border-[#3f51b5] ring-4 ring-[#3f51b5]/5' : 'bg-[#f3f3f7] border-[#e4e1ec]'}`}
                          >
                             <div className={`p-4 rounded-2xl ${orientation === 'landscape' ? 'bg-[#3f51b5] text-white' : 'bg-white text-[#777680]'}`}><MonitorPlay className="w-8 h-8" /></div>
                             <p className="font-black text-xs uppercase tracking-widest text-[#1b1b1f]">Landscape</p>
                          </div>
                          <div 
                             onClick={() => setOrientation('portrait')}
                             className={`p-6 rounded-[28px] border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 ${orientation === 'portrait' ? 'bg-[#e0e0ff]/40 border-[#3f51b5] ring-4 ring-[#3f51b5]/5' : 'bg-[#f3f3f7] border-[#e4e1ec]'}`}
                          >
                             <div className={`p-4 rounded-2xl ${orientation === 'portrait' ? 'bg-[#3f51b5] text-white' : 'bg-white text-[#777680]'}`}><Smartphone className="w-8 h-8" /></div>
                             <p className="font-black text-xs uppercase tracking-widest text-[#1b1b1f]">Portrait</p>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: CONTENT LOOP */}
                {currentStep === 2 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-4">
                      <h3 className="text-xl font-black text-[#1b1b1f] tracking-tight">Media Sequence</h3>
                      <p className="text-xs text-[#777680] font-medium">Select assets from library or upload new ones.</p>
                      
                      <div className="bg-[#f3f3f7] p-6 rounded-[32px] space-y-6 border border-[#e4e1ec]">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777680]" />
                            <input type="text" placeholder="Filter library..." value={searchLibrary} onChange={e => setSearchLibrary(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white rounded-xl text-xs font-bold border border-transparent focus:border-[#3f51b5]/30 outline-none" />
                         </div>
                         <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            <div className="w-20 h-20 bg-white rounded-2xl flex-shrink-0 border-2 border-dashed border-[#e4e1ec] flex flex-col items-center justify-center relative cursor-pointer hover:border-[#3f51b5]">
                               <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleDirectUpload} />
                               <Upload className="w-6 h-6 text-[#3f51b5]" />
                            </div>
                            {filteredLibrary.map(m => (
                               <div key={m.id} onClick={() => addToStaged(m)} className="w-20 h-20 bg-[#1b1b1f] rounded-2xl flex-shrink-0 border-2 border-transparent hover:border-[#3f51b5] relative group cursor-pointer overflow-hidden transition-all shadow-sm">
                                  {m.type === MediaType.IMAGE ? <img src={m.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Play className="w-6 h-6 text-white/40" /></div>}
                                  <div className="absolute inset-0 bg-[#3f51b5]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-[1px] transition-opacity"><Plus className="w-6 h-6 text-white" strokeWidth={3} /></div>
                               </div>
                            ))}
                         </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-[#777680] uppercase tracking-widest">Active Broadcasting Loop ({stagedPlaylist.length})</p>
                       <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
                          {stagedPlaylist.length === 0 ? (
                            <div className="py-16 bg-[#f3f3f7] rounded-[32px] border-2 border-dashed border-[#e4e1ec] text-center flex flex-col items-center gap-4">
                               <ImageIcon className="w-12 h-12 text-[#c4c6d0]" />
                               <p className="text-xs font-black text-[#777680] uppercase tracking-widest">Sequence is empty</p>
                            </div>
                          ) : (
                            stagedPlaylist.map((item, idx) => (
                              <div key={item.id} className="flex items-center gap-4 p-4 bg-white border border-[#e4e1ec] rounded-[24px] shadow-sm animate-in slide-in-from-left-4">
                                 <div className="flex flex-col gap-1.5 shrink-0">
                                    <button onClick={() => moveStaged(idx, 'up')} disabled={idx === 0} className="text-[#777680] disabled:opacity-0 hover:text-[#3f51b5]"><ChevronUp className="w-4 h-4" /></button>
                                    <button onClick={() => moveStaged(idx, 'down')} disabled={idx === stagedPlaylist.length - 1} className="text-[#777680] disabled:opacity-0 hover:text-[#3f51b5]"><ChevronDown className="w-4 h-4" /></button>
                                 </div>
                                 <div className="w-20 aspect-video bg-[#1b1b1f] rounded-xl overflow-hidden shrink-0 border border-[#e4e1ec]">
                                    {item.previewUrl ? <img src={item.previewUrl} className="w-full h-full object-cover" /> : <FileText className="w-full h-full p-2 text-white/20" />}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-[#1b1b1f] truncate leading-tight uppercase tracking-tight">{item.name}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                       <div className="flex items-center gap-1.5 bg-[#f3f3f7] px-2.5 py-1.5 rounded-lg border border-[#e4e1ec]">
                                          <Timer className="w-3.5 h-3.5 text-[#3f51b5]" />
                                          <input 
                                            type="number" 
                                            min={1} 
                                            value={item.duration} 
                                            onChange={e => setStagedPlaylist(prev => prev.map(p => p.id === item.id ? {...p, duration: parseInt(e.target.value) || 1} : p))} 
                                            className="w-10 bg-transparent text-[11px] font-black outline-none text-[#1b1b1f]" 
                                          />
                                          <span className="text-[9px] font-black text-[#777680] uppercase">Sec</span>
                                       </div>
                                    </div>
                                 </div>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); removeFromStaged(item.id); }} 
                                   className="w-10 h-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shrink-0"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: AUTOMATION */}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-4">
                       <h3 className="text-xl font-black text-[#1b1b1f] tracking-tight">Active Automation</h3>
                       <p className="text-xs text-[#44474e] font-medium leading-relaxed">Choose an automation schedule or set a quick rule instantly.</p>
                    </div>

                    <div className="flex bg-[#f3f3f7] p-1.5 rounded-2xl gap-1">
                       <button 
                         onClick={() => setAutomationMode('none')}
                         className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${automationMode === 'none' ? 'bg-white text-[#3f51b5] shadow-sm' : 'text-[#777680] hover:bg-white/50'}`}
                       >
                         No Schedule
                       </button>
                       <button 
                         onClick={() => setAutomationMode('quick')}
                         className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${automationMode === 'quick' ? 'bg-[#3f51b5] text-white shadow-sm' : 'text-[#777680] hover:bg-white/50'}`}
                       >
                         <Zap className="w-3 h-3" /> Quick Rule
                       </button>
                       <button 
                         onClick={() => setAutomationMode('existing')}
                         className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${automationMode === 'existing' ? 'bg-[#3f51b5] text-white shadow-sm' : 'text-[#777680] hover:bg-white/50'}`}
                       >
                         Use Existing
                       </button>
                    </div>

                    {automationMode === 'quick' && (
                       <div className="p-8 bg-[#e0e0ff]/30 rounded-[32px] border border-[#3f51b5]/10 space-y-8 animate-in slide-in-from-top-4">
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#3f51b5] uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> From</label>
                                <input type="time" value={quickStartTime} onChange={e => setQuickStartTime(e.target.value)} className="w-full bg-white px-5 py-4 rounded-2xl border border-[#e4e1ec] font-bold text-lg focus:border-[#3f51b5] outline-none" />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-[#3f51b5] uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> To</label>
                                <input type="time" value={quickEndTime} onChange={e => setQuickEndTime(e.target.value)} className="w-full bg-white px-5 py-4 rounded-2xl border border-[#e4e1ec] font-bold text-lg focus:border-[#3f51b5] outline-none" />
                             </div>
                          </div>

                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-[#3f51b5] uppercase tracking-widest">Select Active Days</p>
                             <div className="flex justify-between gap-1">
                                {daysLabels.map((day, idx) => {
                                   const isSelected = quickDays.includes(idx);
                                   return (
                                      <button 
                                        key={idx}
                                        onClick={() => setQuickDays(prev => isSelected ? prev.filter(d => d !== idx) : [...prev, idx])}
                                        className={`w-10 h-10 rounded-full text-xs font-black transition-all border ${isSelected ? 'bg-[#3f51b5] text-white border-[#3f51b5] scale-110 shadow-md' : 'bg-white text-[#777680] border-[#e4e1ec]'}`}
                                      >
                                         {day}
                                      </button>
                                   );
                                })}
                             </div>
                          </div>

                          <div className="p-5 bg-white/60 rounded-2xl border border-white flex items-start gap-4">
                             <CheckCircle2 className="w-6 h-6 text-emerald-500 mt-0.5" />
                             <p className="text-xs font-medium text-[#191a2c] leading-relaxed">
                                This rule will be created instantly upon registration.
                             </p>
                          </div>
                       </div>
                    )}

                    {automationMode === 'existing' && (
                       <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                          {allSchedules.length === 0 ? (
                            <div className="p-16 bg-[#f3f3f7] rounded-[40px] border-2 border-dashed border-[#e4e1ec] text-center flex flex-col items-center gap-4">
                               <Clock className="w-12 h-12 text-[#c4c6d0]" />
                               <p className="text-[10px] font-black text-[#777680] uppercase tracking-widest">No existing schedules</p>
                               <Button variant="tonal" size="sm" className="rounded-xl mt-4" onClick={() => setAutomationMode('quick')}>Set Quick Rule Instead</Button>
                            </div>
                          ) : (
                            allSchedules.map(sch => (
                              <div 
                                key={sch.id} 
                                onClick={() => setSelectedScheduleId(selectedScheduleId === sch.id ? null : sch.id)}
                                className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all flex items-center justify-between ${selectedScheduleId === sch.id ? 'bg-[#e0e0ff]/40 border-[#3f51b5] ring-4 ring-[#3f51b5]/5' : 'bg-[#f3f3f7] border-[#e4e1ec]'}`}
                              >
                                 <div className="flex items-center gap-5">
                                    <div className={`p-4 rounded-2xl ${selectedScheduleId === sch.id ? 'bg-[#3f51b5] text-white' : 'bg-white text-[#3f51b5]'}`}><Clock className="w-6 h-6" /></div>
                                    <div className="text-left">
                                       <p className={`font-black text-lg ${selectedScheduleId === sch.id ? 'text-[#3f51b5]' : 'text-[#1b1b1f]'}`}>{sch.startTime} — {sch.endTime}</p>
                                       <p className="text-[10px] font-bold text-[#777680] mt-1 uppercase tracking-widest">Active {sch.days.length} Days / Wk</p>
                                    </div>
                                 </div>
                                 {selectedScheduleId === sch.id && <div className="bg-[#3f51b5] text-white p-1.5 rounded-full"><Check className="w-5 h-5" strokeWidth={3} /></div>}
                              </div>
                            ))
                          )}
                       </div>
                    )}

                    {automationMode === 'none' && (
                       <div className="py-20 text-center bg-[#f3f3f7] rounded-[48px] border-2 border-dashed border-[#e4e1ec]">
                          <Monitor className="w-16 h-16 text-[#e4e1ec] mx-auto mb-6" />
                          <p className="text-sm font-bold text-[#777680]">Screen will broadcast 24/7 without interruption.</p>
                       </div>
                    )}
                  </div>
                )}

                {/* NAVIGATION */}
                <div className="mt-12 flex items-center gap-4">
                   {currentStep > 1 && (
                     <Button variant="tonal" onClick={() => setCurrentStep(prev => prev - 1)} className="rounded-[24px] h-14 w-20 flex-shrink-0">
                        <ArrowLeft className="w-6 h-6" />
                     </Button>
                   )}
                   <Button 
                     onClick={currentStep < 3 ? () => setCurrentStep(prev => prev + 1) : handleCreate} 
                     className={`rounded-[24px] flex-1 h-16 font-black uppercase tracking-[0.2em] shadow-xl transition-all ${currentStep === 3 ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'shadow-[#3f51b5]/20'}`}
                     disabled={currentStep === 1 && !name}
                   >
                      {currentStep < 3 ? 'Continue' : 'Register TV'} <ArrowRight className="w-5 h-5 ml-3" />
                   </Button>
                </div>
             </div>
           ) : (
             <div className="space-y-6 md:space-y-12 animate-in zoom-in-95 duration-500 pb-6 md:pb-12 pt-4 md:pt-6">
                <div className="text-center space-y-3 md:space-y-4">
                   <div className="bg-emerald-50 w-20 h-20 md:w-28 md:h-28 rounded-[32px] md:rounded-[48px] flex items-center justify-center mx-auto border-4 border-emerald-100 shadow-inner mb-4 md:mb-6">
                     <CheckCircle2 className="w-10 h-10 md:w-14 md:h-14 text-emerald-500" />
                   </div>
                   <h3 className="text-2xl md:text-4xl font-black text-[#1b1b1f] tracking-tight leading-none px-2">Registration Finalized</h3>
                   <p className="text-[#44474e] font-medium text-sm md:text-lg px-2">Your signage profile is ready to link.</p>
                </div>

                <div className="bg-[#f3f3f7] p-4 md:p-8 lg:p-12 rounded-[32px] md:rounded-[56px] border border-[#e4e1ec] space-y-6 md:space-y-12 relative overflow-hidden">
                   {/* SCANNER OVERLAY */}
                   {isScanning && (
                     <div className="absolute inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
                        <div id="qr-reader" className="w-full h-full" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 pointer-events-none">
                           <div className="w-full max-w-[280px] sm:max-w-sm aspect-square border-4 border-[#3f51b5] rounded-[32px] md:rounded-[48px] lg:rounded-[56px] relative flex flex-col items-center justify-center overflow-hidden pointer-events-none">
                              <div className="w-full h-2 bg-[#3f51b5] absolute animate-scan shadow-[0_0_20px_#3f51b5]" />
                              <p className="text-white text-[10px] sm:text-[11px] md:text-[12px] font-black uppercase tracking-[0.6em] mt-auto pb-6 sm:pb-8 md:pb-10 drop-shadow-lg">Align QR Code</p>
                           </div>
                           {scanError && (
                             <div className="mt-4 px-4 py-2 bg-red-500/90 text-white rounded-xl text-sm font-bold">
                               {scanError}
                             </div>
                           )}
                           <Button variant="tonal" onClick={stopScanner} className="mt-6 sm:mt-8 md:mt-12 rounded-[20px] md:rounded-[28px] bg-white/10 text-white border-white/20 backdrop-blur-md px-6 sm:px-8 md:px-12 text-sm md:text-base pointer-events-auto">Cancel</Button>
                        </div>
                     </div>
                   )}

                   <div className="space-y-4 md:space-y-8 text-center">
                      <p className="text-[10px] md:text-[11px] font-black text-[#777680] uppercase tracking-[0.4em] opacity-60">Choose Link Method</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                         {/* SCANNER PATH */}
                         <button onClick={startScanner} className="p-6 md:p-8 lg:p-10 bg-white rounded-[24px] md:rounded-[32px] lg:rounded-[40px] border-2 border-[#3f51b5]/10 hover:border-[#3f51b5] transition-all group flex flex-col items-center gap-3 md:gap-5 shadow-sm hover:shadow-xl active:scale-95">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#e0e0ff] text-[#3f51b5] rounded-[24px] md:rounded-[32px] flex items-center justify-center group-hover:scale-110 transition-transform">
                               <Scan className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                            <span className="text-xs md:text-sm font-black text-[#1b1b1f] uppercase tracking-widest">Scan TV QR</span>
                         </button>

                         {/* MANUAL PATH */}
                         <div className="p-6 md:p-8 lg:p-10 bg-white rounded-[24px] md:rounded-[32px] lg:rounded-[40px] border border-[#e4e1ec] flex flex-col items-center gap-3 md:gap-5 shadow-sm">
                            <div className="text-3xl md:text-4xl lg:text-5xl font-mono font-black text-[#3f51b5] tracking-widest bg-[#f3f3f7] px-4 md:px-6 lg:px-8 py-4 md:py-5 lg:py-6 rounded-[24px] md:rounded-[32px] w-full border border-white break-all">
                               {createdScreen?.screenCode}
                            </div>
                            <span className="text-[10px] md:text-xs font-black text-[#777680] uppercase tracking-widest">Manual Pin</span>
                         </div>
                      </div>
                   </div>

                   <div className="pt-6 md:pt-10 border-t border-[#e4e1ec] flex flex-col items-center gap-4 md:gap-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 text-left bg-white p-4 md:p-6 lg:p-8 rounded-[24px] md:rounded-[32px] lg:rounded-[36px] border border-[#e4e1ec] shadow-sm w-full max-w-md">
                         <div className="p-3 md:p-4 bg-emerald-50 text-emerald-600 rounded-[20px] md:rounded-[24px] shrink-0">
                            <Tv className="w-6 h-6 md:w-8 md:h-8" />
                         </div>
                         <div className="space-y-1 flex-1 min-w-0">
                            <p className="text-[10px] md:text-xs font-black text-[#1b1b1f] uppercase tracking-widest">How to connect:</p>
                            <p className="text-[10px] md:text-[11px] font-medium text-[#777680] leading-relaxed">Navigate to <span className="text-[#3f51b5] font-black break-all">menupi.com/tv</span> on your display and scan the code or enter the pin.</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <Button variant="tonal" onClick={() => { setIsModalOpen(false); reset(); }} className="rounded-[20px] md:rounded-[28px] h-12 md:h-14 lg:h-16 font-black uppercase tracking-[0.2em] flex-1 text-sm md:text-base">Dashboard</Button>
                  <Button onClick={() => { setIsModalOpen(false); reset(); navigate(`/screens/${createdScreen?.id}`); }} className="rounded-[20px] md:rounded-[28px] h-12 md:h-14 lg:h-16 font-black uppercase tracking-[0.2em] flex-1 text-sm md:text-base">Configure Loop</Button>
                </div>
             </div>
           )}
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 10%; }
          100% { top: 90%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite alternate;
        }
      `}} />
    </div>
  );
};

export default Screens;
