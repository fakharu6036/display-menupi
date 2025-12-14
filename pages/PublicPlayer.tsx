import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MediaItem, Screen, MediaType } from '../types';
import { Maximize, Minimize, RefreshCw, QrCode } from 'lucide-react';
import { PDFViewer } from '../components/PDFViewer';

interface PlayerConfig {
    branding: boolean;
    controls: {
        fullscreen: boolean;
        reload: boolean;
        showCode: boolean;
    };
}

const PublicPlayer: React.FC = () => {
    const { screenCode } = useParams<{ screenCode: string }>(); 
    const [playlist, setPlaylist] = useState<{ media: MediaItem, duration: number, key: string }[]>([]);
    const [screen, setScreen] = useState<Screen | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [config, setConfig] = useState<PlayerConfig>({ branding: false, controls: { fullscreen: true, reload: true, showCode: true } });
    const [plan, setPlan] = useState<string>('free');
    const [lastVersion, setLastVersion] = useState<number | null>(null); // Track screen version
    
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const inactivityTimeoutRef = useRef<number | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    // Auto-hide controls after inactivity
    const resetControlsTimeout = useCallback(() => {
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        setShowControls(true);
        controlsTimeoutRef.current = window.setTimeout(() => {
            setShowControls(false);
        }, 4000); // Hide after 4 seconds
    }, []);

    // Fullscreen handling
    const enterFullscreen = useCallback(async () => {
        if (!containerRef.current) return;
        
        try {
            if (containerRef.current.requestFullscreen) {
                await containerRef.current.requestFullscreen();
            } else if ((containerRef.current as any).webkitRequestFullscreen) {
                await (containerRef.current as any).webkitRequestFullscreen();
            } else if ((containerRef.current as any).mozRequestFullScreen) {
                await (containerRef.current as any).mozRequestFullScreen();
            } else if ((containerRef.current as any).msRequestFullscreen) {
                await (containerRef.current as any).msRequestFullscreen();
            }
        } catch (err) {
            console.log('Fullscreen not available:', err);
        }
    }, []);

    const exitFullscreen = useCallback(async () => {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                await (document as any).webkitExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
                await (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
                await (document as any).msExitFullscreen();
            }
        } catch (err) {
            console.log('Exit fullscreen error:', err);
        }
    }, []);

    // Check fullscreen state
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );
            setIsFullscreen(isFs);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    // Auto-attempt fullscreen on load and apply fullscreen-like styling
    useEffect(() => {
        // Apply fullscreen-like styling immediately
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.width = '100vw';
        document.body.style.height = '100vh';
        
        const attemptFullscreen = async () => {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for page load
            await enterFullscreen();
        };
        attemptFullscreen();
        
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.margin = '';
            document.body.style.padding = '';
            document.body.style.width = '';
            document.body.style.height = '';
        };
    }, [enterFullscreen]);

    // Safe keyboard handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent navigation shortcuts
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.ctrlKey && e.key === 'R')) {
                e.preventDefault();
                return;
            }

            // ESC exits fullscreen but doesn't navigate
            if (e.key === 'Escape' && isFullscreen) {
                e.preventDefault();
                exitFullscreen();
                return;
            }

            // Show controls on any key press
            resetControlsTimeout();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen, exitFullscreen, resetControlsTimeout]);

    // Mouse/touch interaction
    useEffect(() => {
        const handleInteraction = () => {
            resetControlsTimeout();
        };

        const handleMouseMove = () => {
            resetControlsTimeout();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchstart', handleInteraction);
        window.addEventListener('click', handleInteraction);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('click', handleInteraction);
        };
    }, [resetControlsTimeout]);

    // Prevent right-click context menu
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    // Handle visibility change (tab switch, minimize)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Pause when hidden
                if (videoRef.current) {
                    videoRef.current.pause();
                }
            } else {
                // Resume when visible
                if (videoRef.current) {
                    videoRef.current.play().catch(() => {});
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Ensure video plays and loops when currentIndex changes
    useEffect(() => {
        if (playlist.length === 0) return;
        const item = playlist[currentIndex];
        if (videoRef.current && item && item.media.type === MediaType.VIDEO) {
            // Reload video to ensure it starts fresh
            videoRef.current.load();
            // Play the video
            videoRef.current.play().catch((err) => {
                console.warn('Video play failed:', err);
            });
        }
    }, [currentIndex, playlist]);

    const refreshPlaylist = async (forceRefresh = false) => {
        if (!screenCode) return;
        try {
            const res = await fetch(`${API_URL}/public/screen/${screenCode.toUpperCase()}`);
            
            if (!res.ok) {
                if (res.status === 404) {
                    setError("Screen not found");
                } else if (res.status === 403) {
                    setError("Screen access denied");
                } else {
                    setError("Failed to load screen");
                }
                return;
            }
            
            const data = await res.json();
            
            // Check if screen is archived or disabled
            if (data.status === 'archived' || data.status === 'disabled') {
                setScreen({
                    id: String(data.id),
                    screenCode: data.screenCode,
                    name: data.name,
                    orientation: 'landscape',
                    aspectRatio: '16:9',
                    displayMode: 'playlist',
                    playlist: [],
                    createdAt: Date.now(),
                    lastPing: null,
                    status: data.status,
                    message: data.message
                });
                setPlan(data.plan || 'free');
                setConfig(data.config || { branding: false, controls: { fullscreen: true, reload: true, showCode: true } });
                setPlaylist([]);
                return;
            }
            
            // Check version - only update if changed or forced
            const currentVersion = data.updatedAt || data.createdAt;
            if (!forceRefresh && lastVersion !== null && currentVersion === lastVersion) {
                // No changes, skip update
                return;
            }
            
            // Check if screen is suspended or expired
            if (data.accountStatus === 'suspended' || data.accountStatus === 'expired') {
                setError("Screen is currently unavailable");
                return;
            }
            
            // Set plan and config from backend
            setPlan(data.plan || 'free');
            setConfig(data.config || { branding: false, controls: { fullscreen: true, reload: true, showCode: true } });
            
            setScreen({
                id: String(data.id), // Ensure ID is a string
                screenCode: data.screenCode,
                name: data.name,
                orientation: data.orientation,
                aspectRatio: data.aspectRatio,
                displayMode: data.displayMode,
                playlist: data.playlist,
                createdAt: data.createdAt,
                lastPing: data.lastPing
            });
            
            // Debug: Log screen data
            console.log('Screen loaded:', {
                id: data.id,
                screenCode: data.screenCode,
                lastPing: data.lastPing,
                lastPingDate: data.lastPing ? new Date(data.lastPing).toISOString() : 'null'
            });
            
            // Update version timestamp
            setLastVersion(currentVersion);
            
            // Map playlist items with media (only enabled items)
            const items = data.playlist
                .filter((pItem: any) => pItem.playbackConfig?.enabled !== false)
                .map((pItem: any, idx: number) => {
                    const m = data.media.find((am: any) => am.id === pItem.mediaId);
                    if (!m) return null;
                    return { 
                        media: m, 
                        duration: pItem.duration, 
                        key: `${pItem.id}-${idx}`,
                        playbackConfig: pItem.playbackConfig || { mode: 'duration', duration: pItem.duration }
                    };
                })
                .filter(Boolean) as any[];
            setPlaylist(items);
            
            // If no enabled items, show idle state
            if (items.length === 0) {
                setError("No content available");
                return;
            }
        } catch (err) {
            console.error('Error refreshing playlist:', err);
            // Don't set error on network failure - will retry silently
            // Only set error if it's a persistent issue
            if (playlist.length === 0) {
                setError("Connection error. Retrying...");
            }
        }
    };

    // Get device metadata
    const getDeviceMetadata = () => {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let os = 'Unknown';
        
        // Detect browser
        if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
        else if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
        
        // Detect OS
        if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
        else if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac OS')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('CrOS')) os = 'Chrome OS';
        else if (ua.includes('WebOS')) os = 'WebOS';
        else if (ua.includes('FireOS')) os = 'Fire OS';
        
        return {
            browser,
            os,
            resolution: `${window.screen.width}x${window.screen.height}`,
            orientation: window.screen.orientation?.angle === 90 || window.screen.orientation?.angle === 270 ? 'landscape' : 'portrait'
        };
    };
    
    // Separate effect for ping - runs whenever screen.id changes
    useEffect(() => {
        if (!screen?.id) return;
        
        // Send initial ping immediately when screen is loaded
        const sendPing = async (isUnload = false) => {
            try {
                const metadata = getDeviceMetadata();
                const pingData = {
                    playerVersion: '1.0.0',
                    browser: metadata.browser,
                    os: metadata.os,
                    resolution: metadata.resolution,
                    orientation: metadata.orientation,
                    playlistCount: playlist.length,
                    hasError: !!error
                };
                
                if (isUnload) {
                    // Use sendBeacon for unload (no response needed)
                    navigator.sendBeacon(
                        `${API_URL}/screens/${screen.id}/ping`,
                        JSON.stringify(pingData)
                    );
                } else {
                    const response = await fetch(`${API_URL}/screens/${screen.id}/ping`, { 
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(pingData)
                    });
                    
                    if (!response.ok) {
                        console.warn('Ping failed:', response.status, screen.id);
                    } else {
                        const data = await response.json();
                        // Check if server requested refresh
                        if (data.needsRefresh) {
                            window.location.reload();
                        }
                    }
                }
            } catch (e) {
                console.error('Ping error:', e, 'Screen ID:', screen.id);
            }
        };
        
        // Send ping immediately
        sendPing();
        
        // Then ping every 30 seconds
        const pingInterval = setInterval(() => sendPing(), 30000);
        
        // Send ping when page becomes visible (browser tab/window focused)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                sendPing();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Send ping before page unload (browser closing)
        const handleBeforeUnload = () => {
            sendPing(true);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Also send ping on pagehide (more reliable on mobile)
        const handlePageHide = () => {
            try {
                navigator.sendBeacon(`${API_URL}/screens/${screen.id}/ping`, '');
            } catch (e) {
                // Silent fail
            }
        };
        window.addEventListener('pagehide', handlePageHide);
        
        return () => {
            clearInterval(pingInterval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [screen?.id, playlist.length, error]); // Re-run when screen, playlist, or error changes
    
    // Separate effect for playlist refresh
    useEffect(() => {
        refreshPlaylist(true); // Force refresh on initial load
        // Check for updates every 30 seconds (more frequent than before)
        const interval = setInterval(() => refreshPlaylist(false), 30000);
        
        return () => {
            clearInterval(interval);
        };
    }, [screenCode]);

    // Playlist auto-advance (only for non-video items or videos without loop)
    useEffect(() => {
        if (playlist.length === 0) return;
        const item = playlist[currentIndex];
        if (!item) return;
        
        // Don't auto-advance videos - they handle their own looping/ending
        if (item.media.type === MediaType.VIDEO) {
            return;
        }
        
        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % playlist.length);
        }, item.duration * 1000);
        
        return () => clearTimeout(timer);
    }, [currentIndex, playlist]);

    // Handle video end - only advance if not looping (shouldn't fire with loop=true, but just in case)
    const handleVideoEnd = useCallback(() => {
        // With loop={true}, onEnded shouldn't fire, but if it does, restart the video
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => {
                console.warn('Video restart failed');
            });
        }
    }, []);

    const handleReload = () => {
        window.location.reload();
    };

    const handleFullscreenToggle = async () => {
        if (isFullscreen) {
            await exitFullscreen();
        } else {
            await enterFullscreen();
        }
    };

    // Archived or Disabled state - gentle reminder screen
    if (screen && (screen.status === 'archived' || screen.status === 'disabled')) {
        const isArchived = screen.status === 'archived';
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center max-w-lg px-8">
                    {plan === 'free' && (
                        <div className="mb-6 flex items-center justify-center">
                            <div className="text-2xl font-bold text-white/90">MENUPI</div>
                        </div>
                    )}
                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        {isArchived ? (
                            <svg className="w-10 h-10 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                        ) : (
                            <svg className="w-10 h-10 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        )}
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-3">
                        {isArchived ? 'Screen Archived' : 'Screen Disabled'}
                    </h2>
                    <p className="text-lg text-white/80 mb-2 leading-relaxed">
                        {(screen as any).message || (isArchived 
                            ? 'This screen is currently archived. Please reactivate your plan to restore playback.'
                            : 'This screen has been disabled by an administrator.')}
                    </p>
                    <p className="text-sm text-white/50 mt-4">
                        {isArchived 
                            ? 'All your content is safe and will be restored when you upgrade.'
                            : 'Contact support if you believe this is an error.'}
                    </p>
                </div>
            </div>
        );
    }

    // Error states - safe idle screen
    if (error) {
        return (
            <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
                <div className="text-center max-w-md px-6">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tv className="w-8 h-8 text-white/50" />
                    </div>
                    <p className="text-xl mb-2 font-medium">{error}</p>
                    <p className="text-sm text-white/60 mb-6">
                        {error.includes("not found") 
                            ? "This screen code is invalid or has been removed."
                            : error.includes("unavailable")
                            ? "Please contact support if this issue persists."
                            : "The player will automatically retry."}
                    </p>
                    <button 
                        onClick={handleReload}
                        className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Loading state
    if (playlist.length === 0 && !error) {
        return (
            <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white/80">Loading playlist...</p>
                </div>
            </div>
        );
    }
    
    // Empty playlist state (safe idle)
    if (playlist.length === 0) {
        return (
            <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tv className="w-8 h-8 text-white/50" />
                    </div>
                    <p className="text-xl mb-2 font-medium">No content available</p>
                    <p className="text-sm text-white/60">This screen has no active content to display.</p>
                </div>
            </div>
        );
    }

    const current = playlist[currentIndex];
    if (!current) return null;

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 bg-black overflow-hidden"
            style={{ 
                cursor: showControls ? 'default' : 'none',
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 9999
            }}
        >
            {/* Main Content with Smooth Transitions */}
            <div className="absolute inset-0 flex items-center justify-center">
                {current.media.type === MediaType.VIDEO ? (
                    <video 
                        key={`video-${currentIndex}-${current.key}`}
                        ref={videoRef}
                        src={current.media.url} 
                        autoPlay 
                        muted 
                        playsInline
                        loop={true}
                        className="w-full h-full object-contain animate-fade-in"
                        onEnded={handleVideoEnd}
                        onLoadedMetadata={() => {
                            // Ensure video plays when loaded
                            if (videoRef.current) {
                                videoRef.current.play().catch(() => {
                                    console.warn('Video autoplay failed');
                                });
                            }
                        }}
                        onError={() => {
                            // Skip to next on error
                            setTimeout(() => setCurrentIndex((prev) => (prev + 1) % playlist.length), 1000);
                        }}
                    />
                ) : current.media.type === MediaType.PDF ? (
                    <div key={`pdf-${currentIndex}-${current.key}`} className="w-full h-full bg-white animate-fade-in">
                        <PDFViewer 
                            url={current.media.url} 
                            title={current.media.name}
                            autoAdvance={true}
                            onError={() => {
                                // Auto-advance to next item on error
                                setCurrentIndex((prev) => (prev + 1) % playlist.length);
                            }}
                        />
                    </div>
                ) : (
                    <img 
                        key={`img-${currentIndex}-${current.key}`}
                        src={current.media.url} 
                        alt={current.media.name}
                        className="w-full h-full object-contain animate-fade-in"
                        onError={() => {
                            // Skip to next on error
                            setTimeout(() => setCurrentIndex((prev) => (prev + 1) % playlist.length), 1000);
                        }}
                    />
                )}
            </div>

            {/* MENUPI Branding (Free Plan Only) */}
            {config.branding && (
                <div className="absolute bottom-4 right-4 pointer-events-none z-10">
                    <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                        <span className="text-white text-xs font-medium opacity-80">Powered by</span>
                        <img 
                            src="https://www.menupi.com/src/menupi-logo-black.svg" 
                            alt="MENUPI" 
                            className="h-4 brightness-0 invert"
                        />
                    </div>
                </div>
            )}

            {/* Control Overlay */}
            <div 
                className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-300 z-20 ${
                    showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={resetControlsTimeout}
            >
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-black/80 backdrop-blur-md rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl">
                        {config.controls.fullscreen && (
                            <button
                                onClick={handleFullscreenToggle}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                            >
                                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            </button>
                        )}
                        
                        {config.controls.reload && (
                            <button
                                onClick={handleReload}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                                title="Reload Player"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        )}
                        
                        {config.controls.showCode && screen && (
                            <div className="px-3 py-2 bg-white/10 rounded-lg">
                                <div className="flex items-center gap-2 text-white">
                                    <QrCode className="w-4 h-4" />
                                    <span className="text-sm font-mono font-bold">{screen.screenCode}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default PublicPlayer;
