# Device Fingerprinting System

## Problem
Previously, each time the public player link was opened, it would create a new device entry in the database, even if it was the same physical device. This happened because:
- Device IDs were randomly generated using `StorageService.generateCode()`
- If localStorage was cleared, a new ID would be generated
- Different browsers on the same device got different IDs
- No stable device identification

## Solution
Implemented a **stable device fingerprinting system** that generates a unique device ID based on hardware and browser characteristics. The same physical device will always get the same ID, even if:
- localStorage is cleared
- Browser cache is cleared
- The page is refreshed

## How It Works

### 1. Device Fingerprint Generation (`services/deviceFingerprint.ts`)

The system collects multiple device characteristics and creates a stable hash:

**Hardware Characteristics:**
- Screen resolution (width, height)
- Screen color depth and pixel depth
- Hardware concurrency (CPU cores)
- Device memory
- Max touch points

**Browser Characteristics:**
- User agent string
- Language and languages
- Platform
- Timezone and timezone offset

**Advanced Fingerprinting:**
- Canvas fingerprint (browser-specific rendering)
- WebGL fingerprint (GPU-specific)

**Hash Generation:**
- Uses Web Crypto API (SHA-256) if available
- Falls back to simple hash function
- Creates a 16-character hash prefixed with `tv_`

### 2. Device ID Storage

1. **First Check**: Looks for existing ID in `localStorage` (`menupi_device_id`)
2. **If Not Found**: Generates stable fingerprint and stores it
3. **Persistence**: Same device always gets the same ID

### 3. Server-Side Enhancements

**IP Address Tracking:**
- Captures client IP address during registration
- Updates IP on each heartbeat
- Handles proxies and load balancers (x-forwarded-for, x-real-ip)

**User Agent Tracking:**
- Stores browser user agent string
- Helps identify device type and browser

**Database Schema:**
- Added `ip_address` column (optional migration)
- Added `user_agent` column (optional migration)
- Backward compatible (works without migration)

## Files Modified

1. **`services/deviceFingerprint.ts`** (NEW)
   - `generateDeviceFingerprint()`: Creates stable device ID
   - `getDeviceId()`: Gets or creates device ID
   - `isValidDeviceId()`: Validates device ID format

2. **`pages/TvLogin.tsx`**
   - Updated to use `getDeviceId()` instead of random generation
   - Async initialization for fingerprint generation

3. **`pages/PublicPlayer.tsx`**
   - Updated to use `getDeviceId()` for consistent device identification

4. **`server.js`**
   - Enhanced `/api/tvs/register` endpoint to capture IP and user agent
   - Enhanced `/api/tvs/heartbeat` endpoint to update IP and user agent
   - Added `getClientIP()` helper function

5. **`migrate-add-ip-tracking.sql`** (NEW)
   - Optional migration to add IP address and user agent columns

## Benefits

1. **Stable Device Identity**: Same device always gets the same ID
2. **No Duplicate Devices**: Prevents multiple entries for the same physical device
3. **Better Tracking**: IP address helps identify device location
4. **Backward Compatible**: Works with existing database schema
5. **Privacy-Friendly**: Uses device characteristics, not personal information

## Usage

### For Developers

```typescript
import { getDeviceId } from '../services/deviceFingerprint';

// Get stable device ID
const deviceId = await getDeviceId();
// Returns: "tv_a1b2c3d4e5f6g7h8"
```

### For Database Migration

If you want to track IP addresses:

```bash
mysql -u root -p < migrate-add-ip-tracking.sql
```

## Testing

1. Open `/tv` on a device
2. Check `localStorage.getItem('menupi_device_id')` - should be `tv_` followed by hash
3. Clear localStorage and refresh - should get the same ID
4. Check database `hardware_tvs` table - should see one entry per physical device

## Notes

- Device fingerprinting is not 100% unique (two identical devices might get the same ID)
- But it's stable enough to prevent duplicate entries from the same device
- IP address can change (DHCP, VPN, etc.) but helps with identification
- Canvas and WebGL fingerprints add additional uniqueness

