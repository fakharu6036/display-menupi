/**
 * Device Fingerprint Service
 * Implements three-layer identity model:
 * 1. device_uid (permanent, hardware-based) - survives reinstall
 * 2. installation_id (ephemeral) - changes on each install
 * 3. tv_id (user-facing, short code) - assigned by backend
 */

/**
 * Generate device_uid (Primary Identity - Permanent)
 * Hardware-based identifier that survives app reinstall
 * Uses: MAC address (if available), Android ID, device model, manufacturer
 */
export const generateDeviceUid = async (): Promise<string> => {
  try {
    // Collect hardware characteristics (most stable)
    const hardwareFingerprint = {
      // Primary: User agent contains device model/manufacturer
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      
      // Hardware specs (stable)
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      
      // Screen characteristics (hardware-specific)
      screenWidth: screen.width,
      screenHeight: screen.height,
      screenColorDepth: screen.colorDepth,
      screenPixelDepth: screen.pixelDepth,
      
      // WebGL renderer (GPU-specific, very stable)
      webgl: getWebGLFingerprint(),
    };
    
    // Create hash from hardware fingerprint
    const fingerprintString = JSON.stringify(hardwareFingerprint);
    const hash = await hashString(fingerprintString);
    
    // Return as device_uid (longer hash for uniqueness)
    return hash.substring(0, 64); // Full SHA-256 hash
  } catch (err) {
    console.error('Failed to generate device_uid:', err);
    // Fallback: use timestamp + random (not ideal but better than nothing)
    return `fallback_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
};

/**
 * Generate installation_id (Secondary Identity - Ephemeral)
 * Changes on each app install/uninstall
 * Used to detect reinstall events
 */
export const generateInstallationId = (): string => {
  // Generate UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Generate MAC hash (for hardware identification)
 * Attempts to derive a stable identifier from available hardware signals
 */
export const generateMacHash = async (): Promise<string> => {
  try {
    const macSource = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      webgl: getWebGLFingerprint(),
    };
    
    const macString = JSON.stringify(macSource);
    const hash = await hashString(macString);
    return hash.substring(0, 32);
  } catch {
    return '';
  }
};

/**
 * Legacy function - now generates device_uid
 * Kept for backward compatibility
 */
export const generateDeviceFingerprint = async (): Promise<string> => {
  return generateDeviceUid();
};

/**
 * Get canvas fingerprint (browser-specific rendering)
 */
const getCanvasFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    canvas.width = 200;
    canvas.height = 50;
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('MENUPI-TV-FP', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('MENUPI-TV-FP', 4, 17);
    
    return canvas.toDataURL();
  } catch {
    return '';
  }
};

/**
 * Get WebGL fingerprint (GPU-specific)
 */
const getWebGLFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';
    
    return JSON.stringify({
      vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
      version: gl.getParameter(gl.VERSION),
    });
  } catch {
    return '';
  }
};

/**
 * Hash a string using Web Crypto API (if available) or simple hash
 */
const hashString = async (str: string): Promise<string> => {
  try {
    // Use Web Crypto API if available (more secure)
    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback if crypto API fails
  }
  
  // Simple hash fallback
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Get or create device_uid (permanent hardware identity)
 * Stored in localStorage, survives reinstall
 */
export const getDeviceUid = async (): Promise<string> => {
  // Check localStorage for existing device_uid
  const storedUid = localStorage.getItem('menupi_device_uid');
  if (storedUid && storedUid.length > 20) {
    return storedUid;
  }
  
  // Generate new device_uid
  const deviceUid = await generateDeviceUid();
  
  // Store in localStorage
  localStorage.setItem('menupi_device_uid', deviceUid);
  
  return deviceUid;
};

/**
 * Get or create installation_id (ephemeral, per install)
 * Changes on each app install/uninstall
 */
export const getInstallationId = (): string => {
  // Check localStorage for existing installation_id
  let installationId = localStorage.getItem('menupi_installation_id');
  
  if (!installationId) {
    // Generate new installation_id
    installationId = generateInstallationId();
    localStorage.setItem('menupi_installation_id', installationId);
  }
  
  return installationId;
};

/**
 * Legacy function - returns device_uid for backward compatibility
 */
export const getDeviceId = async (): Promise<string> => {
  return getDeviceUid();
};

/**
 * Validate device ID format
 */
export const isValidDeviceId = (deviceId: string): boolean => {
  return deviceId && deviceId.startsWith('tv_') && deviceId.length >= 6 && deviceId.length <= 50;
};

