
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string; // Base64 string of the profile picture
  plan: PlanType;
  role: UserRole;
  restaurantId: string;
  nextBillingDate?: number; // Timestamp
  accountStatus?: 'active' | 'suspended' | 'expired';
}

export enum UserRole {
  OWNER = 'owner',
  MEMBER = 'member',
  SUPER_ADMIN = 'super_admin',
}

export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
}

export interface PlanLimits {
  id: PlanType;
  name: string;
  price: string;
  priceAmount: number; // Numeric value for calculations
  description: string;
  storageMB: number;
  maxScreens: number; // -1 for unlimited
  maxUsers: number;
  allowVideo: boolean;
  showWatermark: boolean;
  features: string[];
}

export interface Invoice {
  id: string;
  date: number;
  amount: string;
  planName: string;
  status: 'paid' | 'pending';
  downloadUrl: string;
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf',
  GIF = 'gif',
}

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  type: MediaType;
  size: string;
  duration?: number; // In seconds, default for images
  createdAt: number;
  // Cloud Import Metadata
  sourceProvider?: 'google-drive' | 'dropbox';
  originalFileName?: string;
  lastImportedAt?: number;
}

export interface PlaybackConfig {
  mode: 'duration' | 'times';
  duration: number; // Seconds (used if mode is duration)
  times?: number;   // Play X times (used if mode is times, for video/gif)
  
  // Scheduling
  scheduleType: 'always' | 'custom';
  validFrom?: string; // ISO Date YYYY-MM-DD
  validTo?: string;   // ISO Date YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string;   // HH:MM
  days?: number[];    // 0-6
}

export interface PlaylistItem {
  id: string; // Unique instance ID in playlist
  mediaId: string;
  duration: number; // Calculated effective duration in seconds
  order: number;
  playbackConfig?: PlaybackConfig; // Advanced rules
}

export type AspectRatio = '16:9' | '4:3' | '21:9';
export type DisplayMode = 'contain' | 'cover' | 'fill'; // Fit, Fill, Stretch

export interface Screen {
  id: string;
  screenCode: string; // Unique, 6-char short code (e.g. A9X2B4)
  name: string;
  orientation: 'landscape' | 'portrait';
  aspectRatio: AspectRatio;
  displayMode?: DisplayMode; // How content handles mismatching aspect ratios
  playlist: PlaylistItem[];
  createdAt: number;
  lastPing?: number; // Timestamp of last heartbeat
}

export enum RepeatType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ONCE = 'once',
}

export interface Schedule {
  id: string;
  screenId: string;
  repeatType: RepeatType;
  startTime: string; // "08:00"
  endTime: string;   // "20:00"
  allDay: boolean;   // If true, ignore start/end time
  days: number[];    // 0 = Sunday... (Used for Weekly)
  monthDay?: number; // 1-31 (Used for Monthly)
  specificDate?: string; // YYYY-MM-DD (Used for Once)
  validityStartDate?: string; // YYYY-MM-DD (Optional range start)
  validityEndDate?: string;   // YYYY-MM-DD (Optional range end)
  priority: number;
  active: boolean;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: number;
  restaurantId?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  encryption: 'SSL' | 'TLS' | 'None';
  user: string;
  pass: string;
  enabled: boolean;
}

export interface SystemSettings {
  smtp: SmtpConfig;
}
