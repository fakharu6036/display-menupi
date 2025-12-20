import { MediaItem, Screen, Schedule, PlanType, PlanLimits, User, ActivityLog, Invoice, PlaylistItem, PlaybackConfig, SystemSettings, UserRole } from '../types';
import { cacheManager } from '../utils/cache';
import { cookieManager } from '../utils/cookies';
import { apiUrl, getApiBaseUrl } from '../utils/apiUrl';

// Helper to handle authentication errors
// Only logout on 401 (Unauthorized) - token is definitely invalid
// 403 (Forbidden) might be a permission issue, not necessarily invalid token
const handleAuthError = (status: number) => {
    if (status === 401) {
        // 401 = token is invalid, definitely logout
        localStorage.removeItem('menupi_user');
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
        return true;
    }
    // 403 or other errors - don't logout, might be temporary/permission issue
    return false;
};

const getAuthHeaders = () => {
    const userStr = localStorage.getItem('menupi_user');
    if (!userStr) return {};
    try {
        const user = JSON.parse(userStr);
        // Check if token exists and is valid
        if (!user || !user.token) {
            console.warn('No token found in user object:', user);
            return {};
        }
        return {
            'Authorization': `Bearer ${user.token}`,
            'X-Authorization': `Bearer ${user.token}`, // Fallback for LiteSpeed Cache
            'Content-Type': 'application/json'
        };
    } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
        return {};
    }
};

export const PLAN_CONFIGS: Record<PlanType, PlanLimits> = {
  [PlanType.FREE]: {
    id: PlanType.FREE,
    name: 'Free Starter',
    price: 'Free',
    priceAmount: 0,
    description: 'Perfect for testing and personal use.',
    storageMB: 15,
    maxScreens: 1,
    maxUsers: 1,
    allowVideo: false,
    showWatermark: true,
    features: ['1 Screen limit', '15 MB Storage', 'Image & PDF only', 'Single User', 'Community Support']
  },
  [PlanType.BASIC]: {
    id: PlanType.BASIC,
    name: 'Basic Business',
    price: '$9',
    priceAmount: 9,
    description: 'For small cafes and shops getting started.',
    storageMB: 50,
    maxScreens: 3,
    maxUsers: 3,
    allowVideo: true,
    showWatermark: false,
    features: ['Up to 3 Screens', '50 MB Storage', 'Video Support (MP4)', '3 Team Members', 'No Watermark', 'Email Support']
  },
  [PlanType.PRO]: {
    id: PlanType.PRO,
    name: 'Pro Enterprise',
    price: '$29',
    priceAmount: 29,
    description: 'Scale your signage across multiple locations.',
    storageMB: 200,
    maxScreens: -1,
    maxUsers: 20,
    allowVideo: true,
    showWatermark: false,
    features: ['Unlimited Screens', '200 MB Storage', '4K Video Support', '20 Team Members', 'Priority Support', 'Advanced Scheduling', 'Cloud Import (Drive/Dropbox)']
  },
};

// --- Storage Service (Now API Service) ---

export const StorageService = {
  
  // --- Auth ---
  login: async (email: string, password: string): Promise<User> => {
      const res = await fetch(apiUrl('/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
      });
      
      if (!res.ok) {
          const err = await res.json();
          const error = new Error(err.error || 'Failed to login');
          // Preserve requiresVerification flag for UI handling
          if (err.requiresVerification) {
              (error as any).requiresVerification = true;
          }
          throw error;
      }
      
      const response = await res.json();
      
      // Backend wraps response in 'data' key: { success: true, data: { token, user } }
      // Handle both formats for compatibility
      const data = response.data || response;
      
      // Validate response structure
      if (!data.token) {
          console.error('Login response missing token. Response:', response, 'Data:', data);
          throw new Error('Login failed: No token received from server');
      }
      if (!data.user) {
          console.error('Login response missing user. Response:', response, 'Data:', data);
          throw new Error('Login failed: No user data received from server');
      }
      
      const userWithToken = { ...data.user, token: data.token };
      localStorage.setItem('menupi_user', JSON.stringify(userWithToken));
      
      // Verify token was stored correctly
      const stored = localStorage.getItem('menupi_user');
      if (stored) {
          const parsed = JSON.parse(stored);
          if (!parsed.token || parsed.token === 'undefined') {
              console.error('Token not stored correctly after login. Stored:', parsed);
              localStorage.removeItem('menupi_user');
              throw new Error('Login failed: Token storage error');
          }
      }
      
      // Clear cache on login (new user session)
      cacheManager.clearAll();
      
      return userWithToken;
  },

  loginWithGoogle: async (credential: string): Promise<User> => {
      const res = await fetch(apiUrl('/auth/google'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential })
      });

      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Google login failed');
      }

      const response = await res.json();
      // Backend wraps response in 'data' key: { success: true, data: { token, user } }
      const data = response.data || response;
      const userWithToken = { ...data.user, token: data.token };
      localStorage.setItem('menupi_user', JSON.stringify(userWithToken));
      
      // Clear cache on login (new user session)
      cacheManager.clearAll();
      
      return userWithToken;
  },

  registerUser: async (name: string, email: string, password?: string) => {
      const res = await fetch(apiUrl('/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password: password || 'temp1234' }) 
      });

      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Registration failed');
      }

      const response = await res.json();
      // Backend wraps response in 'data' key: { success: true, data: { token, user } }
      const data = response.data || response;
      
      // New registration flow: returns success message and verification link
      // Don't auto-login, user needs to verify email first
      if (response.success && !data.token) {
          return {
              success: true,
              message: response.message || data.message,
              verificationLink: data.verificationLink // Only in development
          };
      }
      
      // Legacy flow: auto-login (for backward compatibility)
      if (data.token && data.user) {
          const userWithToken = { ...data.user, token: data.token };
          localStorage.setItem('menupi_user', JSON.stringify(userWithToken));
          return userWithToken;
      }
      
      return data;
  },

  getUser: (): User => {
      const stored = localStorage.getItem('menupi_user');
      return stored ? JSON.parse(stored) : null;
  },

  refreshUserData: async (): Promise<User> => {
      try {
          const headers = getAuthHeaders();
          // If no auth token, return current user (don't make API call)
          if (!headers['Authorization'] && !headers['X-Authorization']) {
              const currentUser = StorageService.getUser();
              if (currentUser) {
                  return currentUser;
              }
              throw new Error('No user session');
          }
          
          const token = headers['Authorization']?.replace('Bearer ', '') || headers['X-Authorization']?.replace('Bearer ', '');
          // Only add token to URL if it exists and is not undefined
          const url = (token && token !== 'undefined') ? `${apiUrl('/users/me/refresh')}?token=${encodeURIComponent(token)}` : apiUrl('/users/me/refresh');
          const res = await fetch(url, { headers });
          
          if (!res.ok) {
              // Only logout on 401 (unauthorized) - token is definitely invalid
              // For 403 (forbidden) or other errors, keep the user logged in
              if (res.status === 401) {
                  // Token is invalid, logout
                  if (handleAuthError(res.status)) {
                      throw new Error('Session expired. Please log in again.');
                  }
              } else {
                  // Other errors (403, 500, etc.) - don't logout, just return cached user
                  // Check error message - if it says "Invalid or expired token", treat as 401
                  try {
                      const errorData = await res.json();
                      if (errorData.error && errorData.error.includes('Invalid or expired token')) {
                          // This is actually a token issue, but don't logout immediately
                          // Return cached user and let the user try again
                          console.warn('Token appears invalid, but keeping user logged in:', errorData.error);
                          const currentUser = StorageService.getUser();
                          if (currentUser) {
                              return currentUser;
                          }
                      }
                  } catch (e) {
                      // Couldn't parse error, continue
                  }
                  console.warn('Failed to refresh user data:', res.status, res.statusText);
                  const currentUser = StorageService.getUser();
                  if (currentUser) {
                      return currentUser; // Return cached user instead of logging out
                  }
              }
              throw new Error('Failed to refresh user data');
          }
          
          const response = await res.json();
          // Backend wraps response in 'data' key, but refresh endpoint might return user directly
          const updatedUser = response.data || response;
          const currentUser = StorageService.getUser();
          const newUser = { ...currentUser, ...updatedUser, token: currentUser?.token };
          localStorage.setItem('menupi_user', JSON.stringify(newUser));
          window.dispatchEvent(new Event('menupi-user-updated'));
          return newUser;
      } catch (e: any) {
          // If error is about session expiry, let it propagate (will trigger logout)
          if (e.message && e.message.includes('Session expired')) {
              throw e;
          }
          // For other errors, return cached user instead of logging out
          console.error('Failed to refresh user data:', e);
          const currentUser = StorageService.getUser();
          if (currentUser) {
              return currentUser; // Return cached user if refresh fails
          }
          throw e;
      }
  },

  getUserWarnings: async (): Promise<any[]> => {
      try {
          const res = await fetch(apiUrl('/users/me/warnings'), { headers: getAuthHeaders() });
          if (!res.ok) return [];
          return res.json();
      } catch (e) {
          console.error('Failed to fetch user warnings:', e);
          return [];
      }
  },

  isAccountActive: (user?: User): boolean => {
      const u = user || StorageService.getUser();
      return u?.accountStatus === 'active';
  },

  getTeamMembers: async (): Promise<User[]> => {
      try {
          const res = await fetch(apiUrl('/team'), { headers: getAuthHeaders() });
          if (!res.ok) return [];
          return res.json();
      } catch (e) {
          console.error('Failed to fetch team members:', e);
          return [];
      }
  },

  updateUserProfile: async (updates: { name?: string; email?: string }): Promise<User> => {
      const res = await fetch(apiUrl('/users/me'), {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updates)
      });
      
      if (!res.ok) {
          // Check if response is JSON before parsing
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
              const err = await res.json();
              throw new Error(err.error || 'Failed to update profile');
          } else {
              // Response is not JSON (likely HTML error page)
              const text = await res.text();
              throw new Error(`Failed to update profile: ${res.status} ${res.statusText}`);
          }
      }
      
      const updatedUser = await res.json();
      const currentUser = StorageService.getUser();
      const newUser = { ...currentUser, ...updatedUser };
      localStorage.setItem('menupi_user', JSON.stringify(newUser));
      window.dispatchEvent(new Event('menupi-storage-change'));
      return newUser;
  },

  uploadAvatar: async (file: File): Promise<string> => {
      const headers = getAuthHeaders();
      const token = headers['Authorization'];
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      const res = await fetch(apiUrl('/users/me/avatar'), {
          method: 'POST',
          headers: { 'Authorization': token },
          body: formData
      });
      
      if (!res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
              const err = await res.json();
              throw new Error(err.error || 'Failed to upload avatar');
          } else {
              throw new Error(`Failed to upload avatar: ${res.status} ${res.statusText}`);
          }
      }
      
      const data = await res.json();
      const currentUser = StorageService.getUser();
      const newUser = { ...currentUser, avatarUrl: data.avatarUrl };
      localStorage.setItem('menupi_user', JSON.stringify(newUser));
      window.dispatchEvent(new Event('menupi-storage-change'));
      return data.avatarUrl;
  },

  inviteUser: async (email: string, name: string) => {
      const res = await fetch(apiUrl('/team/invite'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ email, name })
      });
      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to invite user');
      }
      window.dispatchEvent(new Event('menupi-storage-change'));
  },

  removeUser: async (userId: string) => {
      const res = await fetch(apiUrl(`/team/${userId}`), {
          method: 'DELETE',
          headers: getAuthHeaders()
      });
      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to remove user');
      }
      window.dispatchEvent(new Event('menupi-storage-change'));
  },

  // --- Screens ---
  getScreens: async (forceRefresh = false): Promise<Screen[]> => {
      // Check cache first
      if (!forceRefresh) {
          const cached = cacheManager.get<Screen[]>('screens');
          if (cached) {
              return cached;
          }
      }

      try {
          const headers = getAuthHeaders();
          const token = headers['Authorization']?.replace('Bearer ', '') || headers['X-Authorization']?.replace('Bearer ', '');
          const url = token ? `${apiUrl('/screens')}?token=${encodeURIComponent(token)}` : apiUrl('/screens');
          const res = await fetch(url, { headers });
          if (!res.ok) {
              if (handleAuthError(res.status)) {
                  throw new Error('Session expired. Please log in again.');
              }
              throw new Error('Failed to fetch screens');
          }
          const response = await res.json();
          // Backend wraps response in 'data' key: { success: true, data: [...] }
          const data = response.data || response;
          // Ensure data is an array
          if (!Array.isArray(data)) {
              console.error('Screens response is not an array:', response);
              return [];
          }
          
          // Normalize media URLs in screen playlists
          const normalizedScreens = data.map((screen: Screen) => {
              if (screen.playlist && Array.isArray(screen.playlist)) {
                  const normalizedPlaylist = screen.playlist.map((item: PlaylistItem) => {
                      // Media URLs are in the media object, not directly in playlist items
                      // But we need to normalize when media is accessed
                      return item;
                  });
                  return { ...screen, playlist: normalizedPlaylist };
              }
              return screen;
          });
          
          // Cache for 5 minutes to reduce API calls and avoid database connection limits
          // Convert milliseconds to days for cookie expiration (0.0035 days ≈ 5 minutes)
          cacheManager.set('screens', normalizedScreens, 0.0035);
          
          return normalizedScreens;
      } catch (e) {
          console.error(e);
          // Return cached data if available, even if expired
          const cached = cacheManager.get<Screen[]>('screens');
          return cached || [];
      }
  },

  getScreen: async (id: string): Promise<Screen | undefined> => {
      const screens = await StorageService.getScreens();
      return screens.find(s => s.id === id);
  },

  getScreenByCode: async (code: string): Promise<Screen | undefined> => {
      try {
          // Public endpoint - no auth required for TV player
          const res = await fetch(apiUrl(`/public/screen/${code}`));
          if (res.ok) {
              const response = await res.json();
              // Backend wraps response in 'data' key: { success: true, data: {...} }
              const data = response.data || response;
              // Transform response to match Screen interface
              return {
                  id: data.id,
                  screenCode: data.screenCode,
                  name: data.name,
                  orientation: data.orientation,
                  aspectRatio: data.aspectRatio,
                  displayMode: data.displayMode,
                  playlist: data.playlist,
                  createdAt: data.createdAt,
                  lastPing: data.lastPing
              };
          }
      } catch (e) {
          console.error('Error fetching screen by code:', e);
      }
      return undefined; 
  },

  pingScreen: (screenId: string) => {
      console.log('Ping', screenId);
  },

  saveScreen: async (screen: Screen) => {
      if (screen.id && screen.id.length < 10) { 
          await fetch(apiUrl(`/screens/${screen.id}`), {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify(screen)
          });
      } else {
          await fetch(apiUrl('/screens'), {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(screen)
          });
      }
      
      // Invalidate cache when screen is updated
      cacheManager.invalidateScreens();
      window.dispatchEvent(new Event('menupi-storage-change'));
  },

  deleteScreen: async (id: string) => {
      await fetch(apiUrl(`/screens/${id}`), {
          method: 'DELETE',
          headers: getAuthHeaders()
      });
      
      // Invalidate cache
      cacheManager.invalidateScreens();
      window.dispatchEvent(new Event('menupi-storage-change'));
  },

  duplicateScreen: async (id: string) => {
      // Check if user can create more screens before duplicating
      const canCreate = await StorageService.canCreateScreen();
      if (!canCreate.allowed) {
          throw new Error(canCreate.reason || 'Screen limit reached');
      }
      
      const screen = await StorageService.getScreen(id);
      if (screen) {
          const newScreen = { ...screen, id: '', name: `${screen.name} (Copy)`, screenCode: StorageService.generateCode() };
          await StorageService.saveScreen(newScreen);
      }
  },

  // --- Media ---
  getMedia: async (forceRefresh = false): Promise<MediaItem[]> => {
      // Check cache first (3 minutes TTL)
      if (!forceRefresh) {
          const cached = cacheManager.get<MediaItem[]>('media', 3 * 60 * 1000);
          if (cached) {
              return cached;
          }
      }

      try {
          const res = await fetch(apiUrl('/media'), { headers: getAuthHeaders() });
          if (!res.ok) {
              // Check if 403 error says token is invalid/expired - logout in that case
              if (res.status === 403) {
                  const contentType = res.headers.get('content-type');
                  if (contentType && contentType.includes('application/json')) {
                      const errorData = await res.json().catch(() => ({}));
                      if (errorData.error && 
                          (errorData.error.includes('Invalid or expired token') || errorData.error.includes('Unauthorized'))) {
                          console.warn('Token invalid or expired. Logging out.');
                          localStorage.removeItem('menupi_user');
                          if (!window.location.pathname.includes('/login')) {
                              window.location.href = '/login';
                          }
                      }
                  }
              }
              if (handleAuthError(res.status)) {
                  return [];
              }
              return [];
          }
          const response = await res.json();
          // Backend wraps response in 'data' key: { success: true, data: [...] }
          const data = response.data || response;
          // Ensure data is an array
          if (!Array.isArray(data)) {
              console.error('Media response is not an array:', response);
              return [];
          }
          
          // Normalize URLs to fix localhost URLs from database
          // Check for all localhost variations and normalize them
          const normalizedData = data.map((item: MediaItem) => {
              if (item.url && (item.url.includes('localhost') || item.url.includes('127.0.0.1') || 
                  item.url.startsWith('http://localhost') || item.url.startsWith('http://127.0.0.1'))) {
                  try {
                      const urlObj = new URL(item.url);
                      const path = urlObj.pathname;
                      const apiBaseUrl = getApiBaseUrl();
                      const baseUrl = apiBaseUrl.startsWith('http') ? apiBaseUrl : `https://${apiBaseUrl}`;
                      const cleanPath = path.startsWith('/') ? path : `/${path}`;
                      return { ...item, url: `${baseUrl}${cleanPath}` };
                  } catch (e) {
                      const pathMatch = item.url.match(/\/(uploads\/.+)$/);
                      if (pathMatch) {
                          const apiBaseUrl = getApiBaseUrl();
                          const baseUrl = apiBaseUrl.startsWith('http') ? apiBaseUrl : `https://${apiBaseUrl}`;
                          return { ...item, url: `${baseUrl}/${pathMatch[1]}` };
                      }
                  }
              }
              return item;
          });
          
          // Cache for 5 minutes to reduce API calls and avoid database connection limits
          // Convert milliseconds to days for cookie expiration (0.0035 days ≈ 5 minutes)
          cacheManager.set('media', normalizedData, 0.0035);
          
          return normalizedData;
      } catch (e) {
          // Return cached data if available, but normalize URLs in cached data too
          const cached = cacheManager.get<MediaItem[]>(`media`);
          if (cached) {
              return cached.map((item: MediaItem) => {
                  if (item.url && (item.url.includes('localhost:3000') || item.url.includes('localhost:3001') || item.url.includes('127.0.0.1'))) {
                      try {
                          const urlObj = new URL(item.url);
                          const path = urlObj.pathname;
                          const apiBaseUrl = getApiBaseUrl();
                          const baseUrl = apiBaseUrl.startsWith('http') ? apiBaseUrl : `https://${apiBaseUrl}`;
                          const cleanPath = path.startsWith('/') ? path : `/${path}`;
                          return { ...item, url: `${baseUrl}${cleanPath}` };
                      } catch (e) {
                          const pathMatch = item.url.match(/\/(uploads\/.+)$/);
                          if (pathMatch) {
                              const apiBaseUrl = getApiBaseUrl();
                              const baseUrl = apiBaseUrl.startsWith('http') ? apiBaseUrl : `https://${apiBaseUrl}`;
                              return { ...item, url: `${baseUrl}/${pathMatch[1]}` };
                          }
                      }
                  }
                  return item;
              });
          }
          return [];
      }
  },

  uploadMedia: async (file: File) => {
      const headers = getAuthHeaders();
      const token = headers['Authorization'];
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch(apiUrl('/media'), {
          method: 'POST',
          headers: { 'Authorization': token },
          body: formData
      });
      
      if (!res.ok) throw new Error('Upload failed');
      
      // Invalidate cache when media is uploaded
      cacheManager.invalidateMedia();
      cacheManager.invalidateStorage();
      window.dispatchEvent(new Event('menupi-storage-change'));
  },

  saveMedia: async (media: MediaItem) => {
      // For external links/web imports
      console.log('Saving external media', media);
      window.dispatchEvent(new Event('menupi-storage-change'));
  },

  deleteMedia: async (id: string) => {
      await fetch(apiUrl(`/media/${id}`), {
          method: 'DELETE',
          headers: getAuthHeaders()
      });
      
      // Invalidate cache
      cacheManager.invalidateMedia();
      cacheManager.invalidateStorage();
      window.dispatchEvent(new Event('menupi-storage-change'));
  },

  deleteMediaBatch: async (ids: string[]) => {
      await Promise.all(ids.map(id => StorageService.deleteMedia(id)));
  },

  duplicateMedia: async (id: string) => {
      window.dispatchEvent(new Event('menupi-storage-change'));
  },

  reimportMedia: async (id: string) => {
      console.log('Reimporting', id);
  },

  addMediaToScreen: async (screenId: string, mediaIds: string[], position: 'top' | 'end', config: PlaybackConfig) => {
      const screen = await StorageService.getScreen(screenId);
      if (!screen) throw new Error("Screen not found");

      const newItems: PlaylistItem[] = mediaIds.map((mid, idx) => ({
          id: Date.now() + '-' + idx,
          mediaId: mid,
          duration: config.duration,
          order: 0,
          playbackConfig: config
      }));

      let newPlaylist = [...screen.playlist];
      if (position === 'top') {
          newPlaylist = [...newItems, ...newPlaylist];
      } else {
          newPlaylist = [...newPlaylist, ...newItems];
      }
      
      await StorageService.saveScreen({ ...screen, playlist: newPlaylist });
  },

  // --- Schedules ---
  getSchedules: async (forceRefresh = false): Promise<Schedule[]> => {
      // Check cache first
      if (!forceRefresh) {
          const cached = cacheManager.get<Schedule[]>('schedules');
          if (cached) {
              return cached;
          }
      }

      try {
          const res = await fetch(apiUrl('/schedules'), { headers: getAuthHeaders() });
          if (!res.ok) return [];
          const response = await res.json();
          // Backend wraps response in 'data' key: { success: true, data: [...] }
          const data = response.data || response;
          // Ensure data is an array
          if (!Array.isArray(data)) {
              return [];
          }
          
          // Cache for 2 minutes
          // Cache for 5 minutes to reduce API calls and avoid database connection limits (0.0035 days ≈ 5 minutes)
          cacheManager.set('schedules', data, 0.0035);
          
          return data;
      } catch (e) {
          // Return cached data if available
          const cached = cacheManager.get<Schedule[]>('schedules');
          return cached || [];
      }
  },

  saveSchedule: async (schedule: Schedule) => {
      await fetch(apiUrl('/schedules'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(schedule)
      });
      
      // Invalidate cache
      cacheManager.invalidateSchedules();
      window.dispatchEvent(new Event('menupi-storage-change'));
  },

  deleteSchedule: async (id: string) => {
      await fetch(apiUrl(`/schedules/${id}`), {
          method: 'DELETE',
          headers: getAuthHeaders()
      });
      
      // Invalidate cache
      cacheManager.invalidateSchedules();
      window.dispatchEvent(new Event('menupi-storage-change'));
  },

  // --- Admin / System ---
  getAllRestaurants: async (): Promise<any[]> => {
      try {
          const res = await fetch(apiUrl('/admin/restaurants'), { headers: getAuthHeaders() });
          if (!res.ok) return [];
          const restaurants = await res.json();
          // Return full restaurant data with stats
          return restaurants.map((r: any) => ({
              id: r.id,
              name: r.ownerName || r.name,
              email: r.ownerEmail || r.email,
              avatarUrl: r.avatarUrl,
              role: UserRole.OWNER,
              plan: r.plan as PlanType,
              restaurantId: r.id,
              accountStatus: r.accountStatus,
              createdAt: r.createdAt,
              stats: r.stats || {
                  screenCount: 0,
                  mediaCount: 0,
                  storageMB: 0,
                  storageBreakdown: {}
              }
          }));
      } catch (e) {
          console.error('Failed to fetch restaurants:', e);
          return [];
      }
  },

  getSystemStats: async () => {
      try {
          const res = await fetch(apiUrl('/admin/stats'), { headers: getAuthHeaders() });
          if (!res.ok) {
              return { totalUsers: 0, totalScreens: 0, activeScreens: 0, totalStorageMB: 0, totalFiles: 0, estimatedRevenue: 0 };
          }
          return res.json();
      } catch (e) {
          console.error('Failed to fetch system stats:', e);
          return { totalUsers: 0, totalScreens: 0, activeScreens: 0, totalStorageMB: 0, totalFiles: 0, estimatedRevenue: 0 };
      }
  },

  getSettings: (): SystemSettings => ({
      smtp: { host: 'smtp.mailgun.org', port: 587, encryption: 'TLS', user: 'postmaster', pass: 'secret', enabled: true }
  }),

  saveSettings: (settings: SystemSettings) => {
      console.log('Settings saved', settings);
  },

  getActivities: async (): Promise<ActivityLog[]> => {
      try {
          const res = await fetch(apiUrl('/admin/activities'), { headers: getAuthHeaders() });
          if (!res.ok) return [];
          return res.json();
      } catch (e) {
          console.error('Failed to fetch activities:', e);
          return [];
      }
  },

  logActivity: (action: string, details: string) => console.log(action, details),

  adminCreateUser: (name: string, email: string, plan: PlanType, role: UserRole) => {
      return { user: { id: 'new', name, email, plan, role } as User, password: 'temp-password-123' };
  },

  adminUpdateUser: (id: string, updates: Partial<User>) => {
      console.log('Admin updated user', id, updates);
  },

  adminDeleteUser: (id: string) => {
      console.log('Admin deleted user', id);
  },

  adminResetPassword: (id: string) => {
      console.log('Reset password for', id);
  },

  simulateSendEmail: async (to: string, subject: string, body: string) => {
      return { sent: true, server: 'smtp.mailgun.org' };
  },

  // --- Helpers ---
  // Generate secure, non-guessable shortcode (Base32-like, excludes confusing chars)
  // Note: In production, backend generates codes using crypto.randomBytes
  // This client-side version is for preview/development only
  generateCode: () => {
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Base32-like, excludes 0, O, I, 1
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
  },

  getStorageUsage: async (forceRefresh = false): Promise<number> => {
      // Check cache first
      if (!forceRefresh) {
          const cached = cacheManager.get<number>('storage_usage');
          if (cached !== null) {
              return cached;
          }
      }

      try {
          const headers = getAuthHeaders();
          if (!headers['Authorization'] && !headers['X-Authorization']) {
              // Silently return default when not logged in (expected behavior)
              return 0;
          }
          
          const res = await fetch(apiUrl('/storage/usage'), { headers });
          if (!res.ok) {
              // Check if response is JSON before parsing
              const contentType = res.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                  const errorData = await res.json().catch(() => ({}));
                  console.error('Storage usage error:', res.status, errorData);
                  // Check if 403 error says token is invalid/expired - logout in that case
                  if (res.status === 403 && errorData.error && 
                      (errorData.error.includes('Invalid or expired token') || errorData.error.includes('Unauthorized'))) {
                      console.warn('Token invalid or expired. Logging out.');
                      localStorage.removeItem('menupi_user');
                      if (!window.location.pathname.includes('/login')) {
                          window.location.href = '/login';
                      }
                      return 0;
                  }
              } else {
                  // HTML response (PHP warnings or database errors) - log but don't parse
                  const text = await res.text().catch(() => '');
                  if (text.includes('max_connections_per_hour') || text.includes('Database connection failed')) {
                      console.warn('Database connection limit exceeded. Using cached data.');
                  } else {
                      console.error('Storage usage error (HTML response):', res.status, text.substring(0, 200));
                  }
              }
              if (handleAuthError(res.status)) {
                  return 0;
              }
              return 0;
          }
          // Check if response is JSON before parsing
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
              // HTML response (PHP warnings or database errors) - return default
              const text = await res.text().catch(() => '');
              if (text.includes('max_connections_per_hour') || text.includes('Database connection failed')) {
                  console.warn('Database connection limit exceeded. Using cached data.');
              } else {
                  console.error('Storage usage returned HTML instead of JSON:', text.substring(0, 200));
              }
              return 0;
          }
          const response = await res.json();
          // Backend wraps response in 'data' key: { success: true, data: {...} }
          const data = response.data || response;
          const usage = data.usedMB || data.used || 0;
          
          // Cache for 5 minutes to reduce API calls and avoid database connection limits
          // Cache for 5 minutes (0.0035 days ≈ 5 minutes)
          cacheManager.set('storage_usage', usage, 0.0035);
          
          return usage;
      } catch (e) {
          console.error('Failed to fetch storage usage:', e);
          // Return cached data if available
          const cached = cacheManager.get<number>('storage_usage');
          return cached !== null ? cached : 0;
      }
  },
  
  getStorageBreakdown: async (forceRefresh = false) => {
      // Check cache first
      if (!forceRefresh) {
          const cached = cacheManager.get<{ image: number; video: number; pdf: number; gif: number; other: number }>('storage_breakdown');
          if (cached) {
              return cached;
          }
      }

      try {
          const headers = getAuthHeaders();
          if (!headers['Authorization'] && !headers['X-Authorization']) {
              // Silently return default when not logged in (expected behavior)
              return { image: 0, video: 0, pdf: 0, gif: 0, other: 0 };
          }
          
          const res = await fetch(apiUrl('/storage/breakdown'), { headers });
          if (!res.ok) {
              // Check if response is JSON before parsing
              const contentType = res.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                  const errorData = await res.json().catch(() => ({}));
                  console.error('Storage breakdown error:', res.status, errorData);
                  // Check if 403 error says token is invalid/expired - logout in that case
                  if (res.status === 403 && errorData.error && 
                      (errorData.error.includes('Invalid or expired token') || errorData.error.includes('Unauthorized'))) {
                      console.warn('Token invalid or expired. Logging out.');
                      localStorage.removeItem('menupi_user');
                      if (!window.location.pathname.includes('/login')) {
                          window.location.href = '/login';
                      }
                      return { image: 0, video: 0, pdf: 0, gif: 0, other: 0 };
                  }
              } else {
                  // HTML response (PHP warnings or database errors) - log but don't parse
                  const text = await res.text().catch(() => '');
                  if (text.includes('max_connections_per_hour') || text.includes('Database connection failed')) {
                      console.warn('Database connection limit exceeded. Using cached data.');
                  } else {
                      console.error('Storage breakdown error (HTML response):', res.status, text.substring(0, 200));
                  }
              }
              if (handleAuthError(res.status)) {
                  return { image: 0, video: 0, pdf: 0, gif: 0, other: 0 };
              }
              return { image: 0, video: 0, pdf: 0, gif: 0, other: 0 };
          }
          // Check if response is JSON before parsing
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
              // HTML response (PHP warnings or database errors) - return default
              const text = await res.text().catch(() => '');
              if (text.includes('max_connections_per_hour') || text.includes('Database connection failed')) {
                  console.warn('Database connection limit exceeded. Using cached data.');
              } else {
                  console.error('Storage breakdown returned HTML instead of JSON:', text.substring(0, 200));
              }
              return { image: 0, video: 0, pdf: 0, gif: 0, other: 0 };
          }
          const response = await res.json();
          // Backend wraps response in 'data' key: { success: true, data: {...} }
          const data = response.data || response;
          
          // Cache for 5 minutes to reduce API calls and avoid database connection limits (0.0035 days ≈ 5 minutes)
          cacheManager.set('storage_breakdown', data, 0.0035);
          
          return data;
      } catch (e) {
          console.error('Failed to fetch storage breakdown:', e);
          // Return cached data if available
          const cached = cacheManager.get<{ image: number; video: number; pdf: number; gif: number; other: number }>('storage_breakdown');
          return cached || { image: 0, video: 0, pdf: 0, gif: 0, other: 0 };
      }
  },
  
  getCurrentPlanConfig: (): PlanLimits => {
      const user = StorageService.getUser();
      const plan = user?.plan || PlanType.FREE;
      return PLAN_CONFIGS[plan];
  },
  
  canCreateScreen: async () => {
      const user = StorageService.getUser();
      if (!user) return { allowed: false, reason: 'Not authenticated' };
      
      try {
          const screens = await StorageService.getScreens();
          const planConfig = StorageService.getCurrentPlanConfig();
          
          if (planConfig.maxScreens === -1) {
              return { allowed: true };
          }
          
          if (screens.length >= planConfig.maxScreens) {
              return { allowed: false, reason: `Plan limit reached (${planConfig.maxScreens} screens)` };
          }
          
          return { allowed: true };
      } catch (e) {
          return { allowed: false, reason: 'Error checking limits' };
      }
  },
  
  canUpload: async (size: number, type: string) => {
      const user = StorageService.getUser();
      if (!user) return { allowed: false, reason: 'Not authenticated' };
      
      try {
          const usedMB = await StorageService.getStorageUsage();
          const planConfig = StorageService.getCurrentPlanConfig();
          const sizeMB = size / (1024 * 1024);
          
          // Check storage limit
          if (usedMB + sizeMB > planConfig.storageMB) {
              return { allowed: false, reason: `Storage limit reached (${planConfig.storageMB} MB)` };
          }
          
          // Check video support
          if (type.startsWith('video/') && !planConfig.allowVideo) {
              return { allowed: false, reason: 'Video uploads require Basic or Pro plan' };
          }
          
          return { allowed: true };
      } catch (e) {
          return { allowed: false, reason: 'Error checking limits' };
      }
  },
};
