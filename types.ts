
/**
 * MENUPI Production Type Definitions
 */

export interface User {
  id: string;
  email: string;
  role: UserRole;
  plan: PlanType;
  name: string;
  restaurantId: string;
  accountStatus: 'active' | 'suspended';
  avatarUrl?: string;
}

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  STAFF = 'staff',
  SUPER_ADMIN = 'super_admin',
}

export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'premium', // Maps to 'premium' in database
  ENTERPRISE = 'enterprise', // Maps to 'enterprise' in database
}

export interface MediaItem {
  id: string;
  name: string;
  type: MediaType;
  size_mb: number;
  url: string; // This is a Signed URL or CDN URL
  thumbnail_url: string;
  duration: number; // For images/PDFs, this is the display time
  createdAt: number;
  normalized_format: 'jpg' | 'png' | 'mp4' | 'pdf';
  sourceProvider?: string; // For re-importing
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf',
  GIF = 'gif',
}

export interface PlaybackConfig {
  mode: 'duration' | 'repeat';
  duration: number;
}

export enum ScreenStatus {
  LIVE = 'live',
  OFFLINE = 'offline',
  UNPAIRED = 'unpaired',
}

export interface Screen {
  id: string;
  name: string;
  screenCode: string; // Short code for pairing
  status: ScreenStatus;
  lastPing?: number;
  orientation: 'landscape' | 'portrait';
  aspectRatio: '16:9' | '9:16' | '4:3';
  playlist: PlaylistItem[];
  isPaused: boolean;
}

export interface PlaylistItem {
  id: string;
  mediaId: string;
  duration: number;
  order: number;
  playbackConfig?: {
    mode: 'loop' | 'once' | 'duration';
    duration?: number; // in seconds, for duration mode
  };
}

export interface PhysicalTV {
  id: string;
  hardware_id: string;
  name: string;
  assignedScreenId?: string;
  lastSeen: number;
  status: 'online' | 'offline';
  isManual?: boolean;
  isAndroidTV?: boolean;
}

export enum RepeatType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  ONCE = 'once',
}

export interface Schedule {
  id: string;
  screenId: string;
  repeatType: RepeatType;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  days: number[];    // 0-6
  active: boolean;
}

export interface PlanRequest {
  id: string;
  userId: string;
  requestedPlan: PlanType;
  status: 'pending' | 'approved' | 'denied';
  timestamp: number;
}
