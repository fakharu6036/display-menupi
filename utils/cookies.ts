// Cookie utility for lightweight storage
// Cookies are automatically sent with requests and have built-in expiration

interface CookieOptions {
    expires?: number; // Days until expiration
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}

class CookieManager {
    set(name: string, value: string, options: CookieOptions = {}): void {
        const {
            expires = 7, // Default 7 days
            path = '/',
            domain,
            secure = window.location.protocol === 'https:',
            sameSite = 'lax'
        } = options;

        let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

        if (expires) {
            const date = new Date();
            date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
            cookieString += `; expires=${date.toUTCString()}`;
        }

        cookieString += `; path=${path}`;

        if (domain) {
            cookieString += `; domain=${domain}`;
        }

        if (secure) {
            cookieString += '; secure';
        }

        cookieString += `; samesite=${sameSite}`;

        document.cookie = cookieString;
    }

    get(name: string): string | null {
        const nameEQ = encodeURIComponent(name) + '=';
        const cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1, cookie.length);
            }
            if (cookie.indexOf(nameEQ) === 0) {
                return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
            }
        }

        return null;
    }

    remove(name: string, path: string = '/'): void {
        // Set expiration to past date
        document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
    }

    // Remove all cookies with a specific prefix
    clear(prefix: string): void {
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name.startsWith(prefix)) {
                this.remove(name);
            }
        });
    }
}

export const cookieManager = new CookieManager();

// Cookie-based cache with automatic expiration
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const CACHE_PREFIX = 'menupi_cache_';
const MAX_COOKIE_SIZE = 4096; // Browser limit per cookie

class CookieCache {
    private getKey(key: string): string {
        return `${CACHE_PREFIX}${key}`;
    }

    set<T>(key: string, data: T, ttlDays: number = 1): boolean {
        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now()
            };

            const cookieValue = JSON.stringify(entry);
            
            // Check size limit (leave room for cookie name and metadata)
            if (cookieValue.length > MAX_COOKIE_SIZE - 200) {
                console.warn(`Cache entry too large for cookie: ${key}`);
                return false;
            }

            cookieManager.set(this.getKey(key), cookieValue, { expires: ttlDays });
            return true;
        } catch (e) {
            console.warn('Cookie cache set failed:', e);
            return false;
        }
    }

    get<T>(key: string, maxAge?: number): T | null {
        try {
            const stored = cookieManager.get(this.getKey(key));
            if (!stored) return null;

            const entry: CacheEntry<T> = JSON.parse(stored);
            
            // Check if expired (if maxAge provided in milliseconds)
            if (maxAge && Date.now() - entry.timestamp > maxAge) {
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
        cookieManager.remove(this.getKey(key));
    }

    clear(pattern?: string): void {
        if (pattern) {
            // Clear specific pattern
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
                const eqPos = cookie.indexOf('=');
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                if (name.startsWith(this.getKey(pattern))) {
                    cookieManager.remove(name);
                }
            });
        } else {
            // Clear all cache cookies
            cookieManager.clear(CACHE_PREFIX);
        }
    }

    // Invalidate cache for specific resource types
    invalidateScreens(): void {
        this.clear('screens');
        this.clear('screen_');
    }

    invalidateMedia(): void {
        this.clear('media');
        this.clear('storage_');
    }

    invalidateSchedules(): void {
        this.clear('schedules');
    }

    invalidateStorage(): void {
        this.clear('storage_');
    }

    clearAll(): void {
        this.clear();
    }
}

export const cookieCache = new CookieCache();

