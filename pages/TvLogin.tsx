
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tv, Wifi, Globe, ArrowRight, AlertCircle, RefreshCw, Smartphone, Key } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { StorageService } from '../services/storage';
import { getApiBase, getTvPlayerPath, getApiHeaders } from '../services/config';
import { getDeviceId } from '../services/deviceFingerprint';

const TvLogin: React.FC = () => {
  const navigate = useNavigate();
  const [hardwareId, setHardwareId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [manualScreenCode, setManualScreenCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Generate or retrieve device_id (stable fingerprint-based identity)
  useEffect(() => {
    const initializeDevice = async () => {
      try {
        // Get stable device ID based on device fingerprint
        const deviceId = await getDeviceId();
        setHardwareId(deviceId);
        
        // Register device on first load (with retry logic)
        const registerDevice = async (retries = 3) => {
          try {
            const API_BASE = getApiBase();
            const res = await fetch(`${API_BASE}/api/tvs/register`, {
              method: 'POST',
              headers: getApiHeaders(),
              body: JSON.stringify({ deviceId })
            });
            
            if (!res.ok && res.status !== 404) {
              throw new Error(`Registration failed: ${res.status}`);
            }
            
            // Success - device registered or already exists
            return;
          } catch (err: any) {
            // Retry if we have retries left and it's a network error
            if (retries > 0 && (err.message?.includes('fetch') || err.message?.includes('Network'))) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
              return registerDevice(retries - 1);
            }
            // Silently fail - registration is not critical for TV operation
            console.debug('Device registration failed (non-critical):', err.message);
          }
        };
        
        // Small delay to ensure server is ready
        setTimeout(() => {
          registerDevice();
        }, 500);
      } catch (err) {
        console.error('Failed to initialize device:', err);
        // Fallback to random ID if fingerprinting fails
        const fallbackId = `tv_${StorageService.generateCode().toLowerCase()}`;
        localStorage.setItem('menupi_device_id', fallbackId);
        setHardwareId(fallbackId);
      }
    };
    
    initializeDevice();
  }, []);

  // Step 2: Check for stored screen_code (Priority 2: Manual entry)
  useEffect(() => {
    if (!hardwareId) return;
    
    const storedScreenCode = localStorage.getItem('menupi_screen_code');
    if (storedScreenCode) {
      // Try to load content with stored screen code
      navigate(getTvPlayerPath(storedScreenCode));
      return;
    }
  }, [hardwareId, navigate]);

  // Step 3: Poll for dashboard assignment (Priority 1: Dashboard assignment)
  useEffect(() => {
    if (!hardwareId) return;
    
    const checkPairing = async () => {
      try {
        const API_BASE = getApiBase();
        const res = await fetch(`${API_BASE}/api/tvs/public/${hardwareId}`, {
          headers: getApiHeaders()
        });
        if (!res.ok) return;
        const data = await res.json();
        
        // Priority 1: Dashboard assignment always wins
        if (data.paired && data.tv && data.tv.assignedScreenCode) {
          // Save screen code locally
          localStorage.setItem('menupi_screen_code', data.tv.assignedScreenCode);
          // Navigate to player
          navigate(getTvPlayerPath(data.tv.assignedScreenCode));
        }
      } catch (err) {
        // Silently fail - TV not paired yet
      }
    };

    // Check immediately, then poll every 5 seconds
    checkPairing();
    const interval = setInterval(checkPairing, 5000);
    return () => clearInterval(interval);
  }, [hardwareId, navigate]);

  // Handle manual screen code entry
  const handleManualScreenCode = async () => {
    if (!manualScreenCode.trim() || !hardwareId || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const screenCode = manualScreenCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      
      // Basic validation
      if (screenCode.length < 3) {
        setError('Screen code must be at least 3 characters');
        setIsSubmitting(false);
        return;
      }
      
      const API_BASE = getApiBase();
      
      // Assign screen code to device (endpoint will verify screen exists)
      const assignRes = await fetch(`${API_BASE}/api/tvs/assign-screen-code`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ 
          deviceId: hardwareId, 
          screenCode 
        })
      });
      
      if (!assignRes.ok) {
        let errorData;
        try {
          errorData = await assignRes.json();
        } catch {
          errorData = { 
            error: 'Network error', 
            message: 'Failed to connect to server. Please check your internet connection.' 
          };
        }
        
        // Provide specific error messages
        if (assignRes.status === 404) {
          setError(errorData.message || `Screen code "${screenCode}" not found. Please check the code and try again.`);
        } else if (assignRes.status === 400) {
          setError(errorData.message || errorData.error || 'Invalid request. Please check the screen code format.');
        } else {
          setError(errorData.message || errorData.error || 'Failed to assign screen code. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }
      
      const result = await assignRes.json();
      
      // Save screen code locally
      localStorage.setItem('menupi_screen_code', result.screenCode || screenCode);
      
      // Navigate to player
      navigate(getTvPlayerPath(result.screenCode || screenCode));
    } catch (err: any) {
      console.error("Manual screen code assignment failed:", err);
      
      // Network errors
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Cannot connect to server. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Failed to assign screen code. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  // QR code value - encode device_id for dashboard pairing
  // Dashboard will scan this and pair the device
  const qrValue = hardwareId ? `MENUPI:${hardwareId}` : '';

  return (
    <div 
      className="h-screen w-full bg-[#0a0a0c] flex flex-col items-center justify-center text-center overflow-hidden"
      style={{
        aspectRatio: '16/9',
        minHeight: '100vh',
        minWidth: '100vw'
      }}
    >
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[40%] h-[40%] bg-[#3f51b5]/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-[#3f51b5]/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-4 md:py-6 animate-fade">
        <div className="flex flex-col items-center gap-2 md:gap-3 mb-3 md:mb-4">
           <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-[#3f51b5] rounded-[16px] md:rounded-[20px] lg:rounded-[24px] flex items-center justify-center shadow-[0_30px_60px_rgba(63,81,181,0.4)] border border-white/10">
              <Tv className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" strokeWidth={2.5} />
           </div>
           <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase">Connect Node</h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/40 font-medium tracking-tight">Waiting for dashboard pairing...</p>
           </div>
        </div>

        {/* Combined Pairing Card - Centered & Compact */}
        <div className="w-full max-w-lg mx-auto flex items-center justify-center">
           <div className="bg-white/5 backdrop-blur-md p-4 md:p-5 lg:p-6 rounded-[24px] md:rounded-[28px] lg:rounded-[32px] border border-white/10 space-y-4 md:space-y-5 w-full">
              {/* QR Code Section */}
              <div className="flex flex-col items-center gap-2 md:gap-3">
                 <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.5em]">Scan QR Code</p>
                 <div className="bg-white p-3 md:p-3.5 rounded-[16px] md:rounded-[20px] shadow-[0_0_100px_rgba(63,81,181,0.15)] border-2 border-[#3f51b5]/10 w-full max-w-[180px] md:max-w-[200px]">
                    <div className="w-full aspect-square bg-white rounded-[12px] md:rounded-[16px] flex items-center justify-center p-1.5 md:p-2 border border-slate-100">
                       {qrValue ? (
                         <QRCodeSVG 
                           value={qrValue}
                           size={undefined}
                           level="H"
                           includeMargin={true}
                           className="w-full h-full"
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                           <div className="w-10 h-10 md:w-12 md:h-12 border-3 border-[#3f51b5]/20 border-t-[#3f51b5] rounded-full animate-spin" />
                         </div>
                       )}
                    </div>
                 </div>
                 <p className="text-[9px] md:text-[10px] font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-1.5">
                    <Smartphone className="w-3 h-3 opacity-40" />
                    Scan with Dashboard
                 </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                 <div className="flex-1 h-px bg-white/10" />
                 <p className="text-[7px] md:text-[8px] font-black text-white/30 uppercase tracking-[0.5em]">OR</p>
                 <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Pairing Code Section */}
              <div className="flex flex-col items-center gap-2 md:gap-3">
                 <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.5em]">Pairing Code</p>
                 <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-mono font-black text-[#3f51b5] tracking-widest bg-white rounded-[16px] md:rounded-[20px] py-3 md:py-3.5 lg:py-4 px-3 md:px-4 shadow-2xl w-full">
                    {hardwareId || '...'}
                 </div>
                 <p className="text-[10px] md:text-xs text-white/60 font-medium leading-relaxed text-center max-w-sm mx-auto">
                    Enter this code manually in the <span className="text-white font-black">TVs Tab</span> of your dashboard.
                 </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                 <div className="flex-1 h-px bg-white/10" />
                 <p className="text-[7px] md:text-[8px] font-black text-white/30 uppercase tracking-[0.5em]">OR</p>
                 <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Manual Screen Code Entry */}
              <div className="flex flex-col items-center gap-2 md:gap-3">
                 <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.5em] flex items-center gap-1.5">
                    <Key className="w-3 h-3 opacity-60" />
                    Enter Screen Code
                 </p>
                 <div className="flex gap-2 w-full">
                    <input
                       type="text"
                       value={manualScreenCode}
                       onChange={(e) => {
                         setManualScreenCode(e.target.value.toUpperCase());
                         setError(null);
                       }}
                       onKeyPress={(e) => {
                         if (e.key === 'Enter' && !isSubmitting) {
                           handleManualScreenCode();
                         }
                       }}
                       placeholder="SCR-XXXXX"
                       className="flex-1 px-3 md:px-4 py-2.5 md:py-3 bg-white/10 border border-white/20 rounded-[12px] md:rounded-[16px] text-white text-sm md:text-base font-mono font-bold placeholder-white/30 focus:outline-none focus:border-[#3f51b5] focus:ring-2 focus:ring-[#3f51b5]/20 transition-all"
                       disabled={isSubmitting}
                    />
                    <button
                       onClick={handleManualScreenCode}
                       disabled={!manualScreenCode.trim() || isSubmitting}
                       className="px-4 md:px-5 py-2.5 md:py-3 bg-[#3f51b5] hover:bg-[#3f51b5]/90 disabled:bg-white/10 disabled:cursor-not-allowed text-white rounded-[12px] md:rounded-[16px] font-black text-xs md:text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
                    >
                       {isSubmitting ? (
                          <>
                             <RefreshCw className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                             <span className="hidden sm:inline">Connecting...</span>
                          </>
                       ) : (
                          <>
                             <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
                             <span className="hidden sm:inline">Play</span>
                          </>
                       )}
                    </button>
                 </div>
                 {error && (
                    <div className="flex items-center gap-2 text-red-400 text-[10px] md:text-xs w-full">
                       <AlertCircle className="w-3 h-3 shrink-0" />
                       <span>{error}</span>
                    </div>
                 )}
                 <p className="text-[9px] md:text-[10px] text-white/50 font-medium text-center max-w-sm mx-auto">
                    Type your screen code to start playing immediately.
                 </p>
              </div>

              {/* Status Indicators */}
              <div className="flex flex-row items-center justify-center gap-2 md:gap-3 pt-1 md:pt-2">
                 <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 bg-white/5 rounded-full border border-white/10">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
                    <span className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-[0.3em]">Ready</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 bg-white/5 rounded-full border border-white/10">
                    <Wifi className="w-2.5 h-2.5 md:w-3 md:h-3 text-white/40" />
                    <span className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">v2.7 Cloud</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="pt-2 md:pt-3 flex flex-col items-center gap-1.5 md:gap-2 mt-auto">
           <div className="flex items-center gap-2 md:gap-3 text-white/20">
              <div className="h-px w-8 md:w-12 bg-white/10" />
              <p className="text-[7px] md:text-[8px] font-black uppercase tracking-[0.5em]">Instruction</p>
              <div className="h-px w-8 md:w-12 bg-white/10" />
           </div>
           <p className="text-[9px] md:text-[10px] text-white/40 font-bold">Pair this TV at <span className="text-white">app.menupi.com/tvs</span></p>
        </div>
      </div>

      <div className="absolute bottom-4 md:bottom-6 lg:bottom-8 xl:bottom-12 opacity-5 grayscale brightness-200">
        <img 
          src="https://www.menupi.com/src/menupi-logo-black.svg" 
          alt="MENUPI" 
          className="h-5 md:h-6 lg:h-8" 
        />
      </div>
    </div>
  );
};

export default TvLogin;
