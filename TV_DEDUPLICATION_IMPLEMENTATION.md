# TV Deduplication & Device Identity - Implementation Status

## ✅ Completed

### 1. Database Migration
- Created `migrate-tv-deduplication.sql`
- Adds: `device_uid`, `installation_id`, `tv_id`, `mac_hash`, `approved_at`
- Includes indexes for fast lookups
- Migrates existing `device_id` to `device_uid` for backward compatibility

### 2. Device Fingerprinting Service
- Updated `services/deviceFingerprint.ts`
- `generateDeviceUid()` - Permanent hardware-based identity
- `generateInstallationId()` - Ephemeral UUID per install
- `generateMacHash()` - Hardware identification hash
- Backward compatible with legacy `getDeviceId()`

### 3. Registration Endpoint (Backend)
- Updated `/api/tvs/register` with deduplication logic
- Checks `device_uid` for existing devices (prevents duplicates)
- Detects reinstall when `device_uid` exists but `installation_id` differs
- Generates short `tv_id` (e.g., TV-4K2J) for user-facing display
- Maintains backward compatibility with legacy `deviceId` format

## 🔄 In Progress / TODO

### 4. Update TV Client Registration
**File**: `pages/TvLogin.tsx`
**Action**: Update to send `deviceUid` and `installationId` instead of just `deviceId`

```typescript
// Current (needs update):
const deviceId = await getDeviceId();
body: JSON.stringify({ deviceId })

// Should be:
const deviceUid = await getDeviceUid();
const installationId = getInstallationId();
const macHash = await generateMacHash();
body: JSON.stringify({ deviceUid, installationId, macHash })
```

### 5. Update Manual Add Endpoint
**File**: `server.js` - `/api/tvs/manual-add`
**Action**: Update to work with `tv_id` instead of `device_id`
- Accept `tv_id` from user input
- Look up device by `tv_id`
- Mark as `is_manual = true`

### 6. Update Frontend to Use tv_id
**File**: `pages/PhysicalTVs.tsx`
**Action**: 
- Display `tv_id` instead of `device_id` to users
- Update "Add Android TV" modal to accept `tv_id`
- Show `tv_id` in TV cards

### 7. Update Heartbeat Endpoint
**File**: `server.js` - `/api/tvs/heartbeat`
**Action**: Update to use `device_uid` instead of `device_id`

### 8. Update GET /api/tvs Endpoint
**File**: `server.js`
**Action**: Return `tv_id` in response, use `device_uid` for lookups

### 9. Approval Flow (Future Enhancement)
**Action**: Implement approval popup on TV side when user tries to add device
- TV receives approval request
- User confirms on TV
- Backend sets `approved_at` timestamp

## 📋 Migration Steps

1. **Run Database Migration**:
   ```bash
   mysql -u your_user -p your_database < migrate-tv-deduplication.sql
   ```

2. **Update TV Client Code**:
   - Update `TvLogin.tsx` to use new identity model
   - Update `PublicPlayer.tsx` heartbeat to use `device_uid`

3. **Update Dashboard Code**:
   - Update `PhysicalTVs.tsx` to display and use `tv_id`
   - Update manual add flow

4. **Test**:
   - Register new TV → Should get `tv_id`
   - Reinstall app → Should reconnect to same device (no duplicate)
   - Add TV manually → Should use `tv_id`

## 🔑 Key Concepts

### Three-Layer Identity Model

1. **device_uid** (Primary)
   - Permanent, hardware-based
   - Survives reinstall
   - Used for deduplication
   - Never shown to user

2. **installation_id** (Secondary)
   - Ephemeral, changes on reinstall
   - Used to detect reinstall events
   - Never used for pairing

3. **tv_id** (User-Facing)
   - Short code (TV-4K2J)
   - Used for manual entry
   - Can be regenerated if needed
   - Shown to users

### Deduplication Flow

```
TV App Starts
    ↓
Generates device_uid (hardware-based)
Generates installation_id (new UUID)
    ↓
POST /api/tvs/register { deviceUid, installationId, macHash }
    ↓
Backend checks: Does device_uid exist?
    ↓
Case A: No → Create new device, assign tv_id
Case B: Yes → Update existing device, detect reinstall
    ↓
✅ No duplicate created
```

## ⚠️ Important Notes

- **Backward Compatibility**: System maintains support for legacy `deviceId` format during transition
- **Migration**: Existing devices will have `device_uid` set from `device_id` automatically
- **No Data Loss**: All existing device records are preserved
- **Gradual Rollout**: Can be deployed incrementally without breaking existing TVs

## 🎯 Final Enforcement Rule

**If two device records point to the same physical TV, the system is broken.**

MENUPI must always converge to one device per TV.

