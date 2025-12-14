// Client-side cache utility - Now uses cookies instead of localStorage
// Cookies are lighter, automatically expire, and are sent with requests
// Reduces localStorage usage and improves performance

import { cookieCache } from './cookies';

// Re-export cookie cache as cacheManager for backward compatibility
export const cacheManager = cookieCache;

// Legacy localStorage-based cache (fallback for large data)
// Only use for data that exceeds cookie size limits
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

const LOCALSTORAGE_PREFIX = 'menupi_ls_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default TTL

class LocalStorageCache {
    private getKey(key: string): string {
        return `${LOCALSTORAGE_PREFIX}${key}`;
    }

    set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttl
        };
        try {
            const serialized = JSON.stringify(entry);
            // Only use localStorage if data is too large for cookies
            if (serialized.length > 3500) {
                localStorage.setItem(this.getKey(key), serialized);
            } else {
                // Use cookie cache for smaller data
                cookieCache.set(key, data, ttl / (24 * 60 * 60 * 1000));
            }
        } catch (e) {
            // Storage quota exceeded or disabled - silently fail
            console.warn('Cache set failed:', e);
        }
    }

    get<T>(key: string): T | null {
        try {
            // Try cookie cache first
            const cookieData = cookieCache.get<T>(key);
            if (cookieData !== null) return cookieData;

            // Fallback to localStorage for large data
            const stored = localStorage.getItem(this.getKey(key));
            if (!stored) return null;

            const entry: CacheEntry<T> = JSON.parse(stored);
            
            // Check if expired
            if (Date.now() > entry.expiresAt) {
                this.remove(key);
                return null;
            }

            return entry.data;
        } catch (e) {
            // Invalid cache entry - remove it
            this.remove(key);
            return null;
        }
    }

    remove(key: string): void {
        try {
            cookieCache.remove(key);
            localStorage.removeItem(this.getKey(key));
        } catch (e) {
            // Ignore
        }
    }

    clear(pattern?: string): void {
        try {
            cookieCache.clear(pattern);
            if (pattern) {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(this.getKey(pattern))) {
                        localStorage.removeItem(key);
                    }
                });
            } else {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(LOCALSTORAGE_PREFIX)) {
                        localStorage.removeItem(key);
                    }
                });
            }
        } catch (e) {
            // Ignore
        }
    }

    clearAll(): void {
        cookieCache.clearAll();
        this.clear();
    }
}

// Export hybrid cache manager (cookies for small data, localStorage for large)
export const hybridCache = new LocalStorageCache();

