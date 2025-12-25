
import { User, MediaItem, Screen, PhysicalTV, PlanType, ScreenStatus, Schedule, PlanRequest, RepeatType, UserRole, MediaType } from '../types';

export interface StagedPlaylistItem {
  type: 'library' | 'upload';
  mediaId?: string;
  file?: File;
  duration: number;
}

/**
 * PRODUCTION API SERVICE - Backend Connection Only
 */
import { getApiBase } from './config';

const API_BASE = getApiBase();

/**
 * Check if response is HTML (error page) instead of JSON
 * Returns the response text if HTML, null if JSON
 */
const checkHtmlResponse = async (res: Response, url: string): Promise<string | null> => {
  const contentType = res.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    // Clone the response so we can read it without consuming the original
    const clonedRes = res.clone();
    const text = await clonedRes.text();
    console.error('❌ API returned HTML instead of JSON:', {
      url,
      status: res.status,
      contentType,
      preview: text.substring(0, 300),
      apiBase: API_BASE,
      envVar: import.meta.env?.VITE_API_BASE_URL || 'NOT SET'
    });
    return text; // Return the text so caller can throw error
  }
  return null; // Response is JSON, proceed normally
};

/**
 * Get headers for API requests, including ngrok-skip-browser-warning if needed
 */
const getHeaders = (includeAuth = true) => {
  try {
    const token = includeAuth ? localStorage.getItem('menupi_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add ngrok-skip-browser-warning header if using ngrok
    if (API_BASE && (API_BASE.includes('ngrok.io') || API_BASE.includes('ngrok-free.app') || API_BASE.includes('ngrok.app'))) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    return headers;
  } catch {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    // Add ngrok-skip-browser-warning header if using ngrok
    if (API_BASE && (API_BASE.includes('ngrok.io') || API_BASE.includes('ngrok-free.app') || API_BASE.includes('ngrok.app'))) {
      headers['ngrok-skip-browser-warning'] = 'true';
    }
    
    return headers;
  }
};

/**
 * Get ngrok skip browser warning header (for use in direct fetch calls)
 */
export const getNgrokHeader = (): Record<string, string> => {
  if (API_BASE && (API_BASE.includes('ngrok.io') || API_BASE.includes('ngrok-free.app') || API_BASE.includes('ngrok.app'))) {
    return { 'ngrok-skip-browser-warning': 'true' };
  }
  return {};
};

export const StorageService = {
  // SESSION
  getUser: (): User | null => {
    try {
      const data = localStorage.getItem('menupi_user');
      if (!data || data === 'undefined' || data === 'null') return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  login: async (email: string, password: string): Promise<void> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Invalid credentials' }));
      throw new Error(error.error || 'Invalid credentials');
    }
    const data = await res.json();
    localStorage.setItem('menupi_token', data.token);
    localStorage.setItem('menupi_user', JSON.stringify(data.user));
    window.dispatchEvent(new Event('menupi-storage-change'));
  },

  registerUser: async (name: string, email: string, password: string): Promise<void> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(error.error || 'Registration failed');
      }
      const data = await res.json();
      localStorage.setItem('menupi_token', data.token);
      localStorage.setItem('menupi_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('menupi-storage-change'));
    } catch (err: any) {
      // Handle network errors (server not running, CORS, etc.)
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please ensure the backend server is running on port 3001.');
      }
      throw err;
    }
  },

  loginWithGoogle: async (credential: string): Promise<User> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Google login failed' }));
      throw new Error(error.error || 'Google login failed');
    }
    const data = await res.json();
    localStorage.setItem('menupi_token', data.token);
    localStorage.setItem('menupi_user', JSON.stringify(data.user));
    window.dispatchEvent(new Event('menupi-storage-change'));
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('menupi_token');
    localStorage.removeItem('menupi_user');
    window.location.href = '/login';
  },

  // MEDIA
  getMedia: async (): Promise<MediaItem[]> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const res = await fetch(`${API_BASE}/api/media`, { headers: getHeaders() });
      
      // Check if response is HTML (error page or ngrok warning)
      const htmlText = await checkHtmlResponse(res, `${API_BASE}/api/media`);
      if (htmlText) {
        throw new Error(`API server returned HTML instead of JSON. Check if VITE_API_BASE_URL is set correctly in Vercel. Current API URL: ${API_BASE}`);
      }
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          // Clear invalid session
          localStorage.removeItem('menupi_token');
          localStorage.removeItem('menupi_user');
          window.dispatchEvent(new Event('menupi-storage-change'));
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Failed to fetch media: ${res.statusText}`);
      }
      const data = await res.json();
      // Map server response to frontend format
      return data.map((item: any) => {
        let size_mb = 0;
        if (typeof item.size === 'string') {
          size_mb = parseFloat(item.size.replace(' MB', '').replace('MB', '').trim()) || 0;
        } else if (item.size_mb) {
          size_mb = parseFloat(item.size_mb) || 0;
        } else if (item.file_size_mb) {
          size_mb = parseFloat(item.file_size_mb) || 0;
        }
        return {
          id: item.id,
          name: item.name,
          type: item.type as MediaType,
          size_mb,
          url: item.url,
          thumbnail_url: item.url, // Use same URL as thumbnail for now
          duration: item.duration || 10,
          createdAt: item.createdAt || item.created_at || Date.now(),
          normalized_format: item.type === 'image' ? 'jpg' : item.type === 'video' ? 'mp4' : item.type === 'pdf' ? 'pdf' : 'jpg',
          sourceProvider: item.sourceProvider || item.source
        };
      });
    } catch (err: any) {
      // Enhanced error logging
      if (err.message && err.message.includes('HTML instead of JSON')) {
        console.error('❌ API Configuration Error:', {
          apiBase: API_BASE,
          envVar: import.meta.env?.VITE_API_BASE_URL || 'NOT SET',
          suggestion: 'Set VITE_API_BASE_URL in Vercel environment variables'
        });
      }
      console.error('Failed to fetch media:', err);
      throw err;
    }
  },

  // SCREENS
  getScreens: async (): Promise<Screen[]> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const res = await fetch(`${API_BASE}/api/screens`, { headers: getHeaders() });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('menupi_token');
          localStorage.removeItem('menupi_user');
          window.dispatchEvent(new Event('menupi-storage-change'));
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Failed to fetch screens: ${res.statusText}`);
      }
      const data = await res.json();
      // Map server response to frontend format
      return data.map((screen: any) => ({
        id: screen.id,
        name: screen.name,
        screenCode: screen.screenCode,
        status: screen.lastPing && (Date.now() - screen.lastPing < 60000) ? ScreenStatus.LIVE : ScreenStatus.OFFLINE,
        orientation: screen.orientation || 'landscape',
        aspectRatio: screen.aspectRatio || '16:9',
        playlist: screen.playlist || [],
        isPaused: false // Default, can be stored in DB later
      }));
    } catch (err: any) {
      console.error('Failed to fetch screens:', err);
      throw err;
    }
  },

  // HARDWARE NODES
  getPhysicalTVs: async (): Promise<PhysicalTV[]> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const res = await fetch(`${API_BASE}/api/tvs`, { headers: getHeaders() });
      
      // Check if response is HTML (error page or ngrok warning)
      const htmlText = await checkHtmlResponse(res, `${API_BASE}/api/tvs`);
      if (htmlText) {
        throw new Error(`API server returned HTML instead of JSON. Check if VITE_API_BASE_URL is set correctly in Vercel. Current API URL: ${API_BASE}`);
      }
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('menupi_token');
          localStorage.removeItem('menupi_user');
          window.dispatchEvent(new Event('menupi-storage-change'));
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Failed to fetch TVs: ${res.statusText}`);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err: any) {
      console.error('Failed to fetch TVs:', err);
      throw err;
    }
  },

  assignScreenToTV: async (tvId: string, screenId?: string) => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    const res = await fetch(`${API_BASE}/api/tvs/${tvId}/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ screenId })
    });
    if (!res.ok) {
      throw new Error(`Failed to assign screen: ${res.statusText}`);
    }
  },

  manuallyAddAndroidTV: async (deviceId: string, name?: string) => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    const res = await fetch(`${API_BASE}/api/tvs/manual-add`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ deviceId, name })
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || `Failed to add Android TV: ${res.statusText}`);
    }
    return await res.json();
  },

  removeAndroidTV: async (deviceId: string) => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    const res = await fetch(`${API_BASE}/api/tvs/${deviceId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(error.error || `Failed to remove Android TV: ${res.statusText}`);
    }
    return await res.json();
  },

  updateTVHeartbeat: async (deviceId: string) => {
    if (!API_BASE) return;
    try {
      const res = await fetch(`${API_BASE}/api/tvs/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      });
      if (!res.ok) {
        console.warn('Heartbeat failed:', res.statusText);
      }
    } catch (err) {
      console.warn('Heartbeat error:', err);
    }
  },

  getStorageUsage: () => {
    // Calculate from already loaded media if available, otherwise return 0
    // For async version, use getMedia() and calculate manually
    return 0; // Will be calculated from media array in components
  },

  getCurrentPlanConfig: () => {
    const user = StorageService.getUser();
    const plans: Record<string, { storageMB: number; maxScreens: number }> = {
      [PlanType.FREE]: { storageMB: 100, maxScreens: 1 },
      [PlanType.BASIC]: { storageMB: 1024, maxScreens: 5 },
      [PlanType.PRO]: { storageMB: 10240, maxScreens: 50 },
      [PlanType.ENTERPRISE]: { storageMB: 102400, maxScreens: 999 },
      // Also support database values directly
      'free': { storageMB: 100, maxScreens: 1 },
      'basic': { storageMB: 1024, maxScreens: 5 },
      'premium': { storageMB: 10240, maxScreens: 50 },
      'enterprise': { storageMB: 102400, maxScreens: 999 },
      'pro': { storageMB: 10240, maxScreens: 50 }, // Legacy support
    };
    return plans[user?.plan || PlanType.FREE] || plans[PlanType.FREE];
  },

  generateCode: () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  },
  
  canEdit: (user: User | null) => !!user && (user.role === 'owner' || user.role === 'admin'),
  
  // SCHEDULES
  getSchedules: async (): Promise<Schedule[]> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const res = await fetch(`${API_BASE}/api/schedules`, { headers: getHeaders() });
      
      // Check if response is HTML (error page or ngrok warning)
      const htmlText = await checkHtmlResponse(res, `${API_BASE}/api/schedules`);
      if (htmlText) {
        throw new Error(`API server returned HTML instead of JSON. Check if VITE_API_BASE_URL is set correctly in Vercel. Current API URL: ${API_BASE}`);
      }
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('menupi_token');
          localStorage.removeItem('menupi_user');
          window.dispatchEvent(new Event('menupi-storage-change'));
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Failed to fetch schedules: ${res.statusText}`);
      }
      const data = await res.json();
      return data.map((s: any) => ({
        id: s.id,
        screenId: s.screenId,
        repeatType: s.repeatType as RepeatType,
        startTime: s.startTime,
        endTime: s.endTime,
        days: s.days || [],
        active: s.active !== false
      }));
    } catch (err: any) {
      console.error('Failed to fetch schedules:', err);
      throw err;
    }
  },

  saveSchedule: async (schedule: Schedule): Promise<Schedule> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const res = await fetch(`${API_BASE}/api/schedules`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          screenId: schedule.screenId,
          repeatType: schedule.repeatType,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          days: schedule.days,
          specificDate: schedule.repeatType === RepeatType.ONCE ? new Date().toISOString().split('T')[0] : undefined
        })
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to save schedule' }));
        throw new Error(error.error || 'Failed to save schedule');
      }
      const data = await res.json();
      return { ...schedule, id: data.id.toString() };
    } catch (err: any) {
      console.error('Failed to save schedule:', err);
      throw err;
    }
  },

  deleteSchedule: async (id: string): Promise<void> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const res = await fetch(`${API_BASE}/api/schedules/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) {
        throw new Error(`Failed to delete schedule: ${res.statusText}`);
      }
    } catch (err: any) {
      console.error('Failed to delete schedule:', err);
      throw err;
    }
  },

  // SCREENS
  saveScreen: async (screen: Screen): Promise<void> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const res = await fetch(`${API_BASE}/api/screens/${screen.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: screen.name,
          orientation: screen.orientation,
          aspectRatio: screen.aspectRatio,
          playlist: screen.playlist.map(item => ({
            mediaId: item.mediaId,
            duration: item.duration,
            playbackConfig: { mode: 'duration', duration: item.duration }
          }))
        })
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('menupi_token');
          localStorage.removeItem('menupi_user');
          window.dispatchEvent(new Event('menupi-storage-change'));
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Failed to save screen: ${res.statusText}`);
      }
      window.dispatchEvent(new Event('menupi-storage-change'));
    } catch (err: any) {
      console.error('Failed to save screen:', err);
      throw err;
    }
  },

  createScreenComplete: async (data: { name: string; orientation: string; stagedPlaylist: StagedPlaylistItem[]; schedule?: any }): Promise<Screen> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const screenCode = StorageService.generateCode();
      // Create screen
      const screenRes = await fetch(`${API_BASE}/api/screens`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: data.name,
          orientation: data.orientation,
          aspectRatio: '16:9',
          screenCode
        })
      });
      if (!screenRes.ok) throw new Error('Failed to create screen');
      const screenData = await screenRes.json();
      const screenId = screenData.id.toString();

      // Upload files and create playlist
      const playlistItems = [];
      for (const item of data.stagedPlaylist) {
        let mediaId = item.mediaId;
        if (item.type === 'upload' && item.file) {
          const formData = new FormData();
          formData.append('file', item.file);
          const uploadRes = await fetch(`${API_BASE}/api/media`, {
            method: 'POST',
            headers: { 'Authorization': getHeaders().Authorization || '' },
            body: formData
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            mediaId = uploadData.id.toString();
          }
        }
        if (mediaId) {
          playlistItems.push({ mediaId, duration: item.duration });
        }
      }

      // Update screen with playlist
      await fetch(`${API_BASE}/api/screens/${screenId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: data.name,
          orientation: data.orientation,
          aspectRatio: '16:9',
          playlist: playlistItems.map(item => ({
            mediaId: item.mediaId,
            duration: item.duration,
            playbackConfig: { mode: 'duration', duration: item.duration }
          }))
        })
      });

      // Create schedule if provided
      if (data.schedule) {
        await fetch(`${API_BASE}/api/schedules`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            screenId,
            repeatType: 'daily',
            startTime: data.schedule.startTime,
            endTime: data.schedule.endTime || '23:59',
            days: JSON.stringify(data.schedule.days || []),
            priority: 0
          })
        });
      }

      window.dispatchEvent(new Event('menupi-storage-change'));
      return {
        id: screenId,
        name: data.name,
        screenCode,
        status: ScreenStatus.OFFLINE,
        orientation: data.orientation as 'landscape' | 'portrait',
        aspectRatio: '16:9',
        playlist: playlistItems.map((item, idx) => ({
          id: idx.toString(),
          mediaId: item.mediaId,
          duration: item.duration,
          order: idx
        })),
        isPaused: false
      };
    } catch (err: any) {
      console.error('Failed to create screen:', err);
      throw new Error(err.message || 'Failed to create screen');
    }
  },

  getScreen: async (id: string): Promise<Screen | undefined> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const res = await fetch(`${API_BASE}/api/screens`, { headers: getHeaders() });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('menupi_token');
          localStorage.removeItem('menupi_user');
          window.dispatchEvent(new Event('menupi-storage-change'));
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        return undefined;
      }
      const screens = await res.json();
      const screen = screens.find((s: any) => s.id === id);
      if (!screen) return undefined;
      return {
        id: screen.id,
        name: screen.name,
        screenCode: screen.screenCode,
        status: screen.lastPing && (Date.now() - screen.lastPing < 60000) ? ScreenStatus.LIVE : ScreenStatus.OFFLINE,
        orientation: screen.orientation || 'landscape',
        aspectRatio: screen.aspectRatio || '16:9',
        playlist: screen.playlist || [],
        isPaused: false
      };
    } catch (err: any) {
      console.error('Failed to fetch screen:', err);
      throw err;
    }
  },

  // MEDIA OPERATIONS
  uploadMedia: async (file: File): Promise<MediaItem> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/media`, {
        method: 'POST',
        headers: { 'Authorization': getHeaders().Authorization || '' },
        body: formData
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || 'Upload failed');
      }
      const data = await res.json();
      window.dispatchEvent(new Event('menupi-storage-change'));
      // Return the uploaded media by fetching it
      const media = await StorageService.getMedia();
      const uploaded = media.find(m => m.id === data.id.toString());
      if (!uploaded) {
        throw new Error('Uploaded media not found');
      }
      return uploaded;
    } catch (err: any) {
      console.error('Upload failed:', err);
      throw err;
    }
  },

  deleteMedia: async (id: string): Promise<void> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const res = await fetch(`${API_BASE}/api/media/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('menupi_token');
          localStorage.removeItem('menupi_user');
          window.dispatchEvent(new Event('menupi-storage-change'));
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Failed to delete media: ${res.statusText}`);
      }
      window.dispatchEvent(new Event('menupi-storage-change'));
    } catch (err: any) {
      console.error('Failed to delete media:', err);
      throw err;
    }
  },

  deleteMediaBatch: async (ids: string[]): Promise<void> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    await Promise.all(ids.map(id => StorageService.deleteMedia(id)));
  },

  reimportMedia: async (id: string): Promise<void> => {
    // Not implemented in backend yet
    console.log('Reimport media:', id);
  },

  // PLAN REQUESTS
  requestPlanChange: async (plan: PlanType): Promise<void> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const res = await fetch(`${API_BASE}/api/plan-request`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ requestedPlan: plan })
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to create plan request' }));
        throw new Error(error.error || 'Failed to create plan request');
      }
      window.dispatchEvent(new Event('menupi-storage-change'));
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please ensure the backend server is running.');
      }
      throw err;
    }
  },

  getPlanRequests: async (): Promise<PlanRequest[]> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const user = StorageService.getUser();
      // Early return for non-admin users - don't even make the API call
      if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return [];
      }
      const res = await fetch(`${API_BASE}/api/admin/plan-requests`, {
        headers: getHeaders()
      });
      if (!res.ok) {
        // 404 means endpoint doesn't exist (server not restarted) - return empty array
        if (res.status === 404) {
          console.warn('Admin endpoints not available - server may need restart');
          return [];
        }
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('menupi_token');
          localStorage.removeItem('menupi_user');
          window.location.href = '/login';
          throw new Error('Session expired. Please login again.');
        }
        return [];
      }
      const data = await res.json();
      return data.map((req: any) => ({
        id: req.id,
        userId: req.userId,
        requestedPlan: req.requestedPlan as PlanType,
        status: req.status,
        timestamp: req.timestamp
      }));
    } catch (err: any) {
      console.error('Failed to fetch plan requests:', err);
      return [];
    }
  },

  approvePlanRequest: async (id: string): Promise<void> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const res = await fetch(`${API_BASE}/api/admin/plan-requests/${id}/approve`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to approve plan request' }));
        throw new Error(error.error || 'Failed to approve plan request');
      }
      window.dispatchEvent(new Event('menupi-storage-change'));
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        throw new Error('Cannot connect to server. Please ensure the backend server is running.');
      }
      throw err;
    }
  },

  // ADMIN METHODS
  getSystemStats: (): { totalUsers: number; activeScreens: number; totalStorageMB: number; estimatedRevenue: number } => {
    // This should be called from API, but for now return cached or default
    try {
      const cached = localStorage.getItem('menupi_admin_stats');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return { totalUsers: 0, activeScreens: 0, totalStorageMB: 0, estimatedRevenue: 0 };
  },

  getAllUsers: (): User[] => {
    // This should be called from API, but for now return cached or empty
    try {
      const cached = localStorage.getItem('menupi_admin_users');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return [];
  },

  // Load admin data from API
  loadAdminData: async (): Promise<void> => {
    if (!API_BASE) {
      throw new Error('API server not configured');
    }
    try {
      const user = StorageService.getUser();
      if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
        return;
      }

      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats`, { headers: getHeaders() }),
        fetch(`${API_BASE}/api/admin/users`, { headers: getHeaders() })
      ]);

      // Handle 404 (endpoint not found - server needs restart)
      if (statsRes.status === 404 || usersRes.status === 404) {
        console.warn('Admin endpoints not available - server may need restart');
        return;
      }

      if (statsRes.ok) {
        const stats = await statsRes.json();
        localStorage.setItem('menupi_admin_stats', JSON.stringify(stats));
      }

      if (usersRes.ok) {
        const users = await usersRes.json();
        localStorage.setItem('menupi_admin_users', JSON.stringify(users.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          plan: u.plan,
          restaurantId: u.restaurantId,
          accountStatus: u.accountStatus
        }))));
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
    }
  }
};