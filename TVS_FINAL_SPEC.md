# ✅ MENUPI /tvs PAGE — FINAL SYSTEM COMMAND & SPEC

**This document is the authoritative specification for the `/tvs` page. All implementations must match this spec exactly.**

---

## PURPOSE (NON-NEGOTIABLE)

`/tvs` is a **hardware management page**.

It exists **only** to:
- Monitor Android TV devices
- Pair them with Screen Profiles
- Control which TVs MENUPI actively manages

**It is NOT:**
- ❌ A screen editor
- ❌ A media manager
- ❌ A content creation tool
- ❌ An analytics dashboard
- ❌ A scheduling interface

---

## CORE RULE

**Only Android TVs that the user explicitly adds are visible and manageable in `/tvs`.**

This is intentional.

---

## WHAT /tvs DOES (CLEAR DEFINITION)

The `/tvs` page is a **manual registry and control panel** for Android TV devices running the MENUPI Public Player.

It allows users to:
- See only TVs they chose to manage
- Check live status (online/offline)
- Assign or change Screen Profiles
- Remove TVs cleanly

---

## SYSTEM MODEL (VERY IMPORTANT)

MENUPI separates three things:
1. **Device** (TV hardware)
2. **Screen Profile** (what to show)
3. **Public Player** (runtime)

`/tvs` manages **Devices only**.

---

## DEVICE REGISTRATION FLOW (AUTOMATIC, SILENT)

### Step 1: TV Opens Player
- Android TV opens `tv.menupi.com`
- Player generates a unique `device_id`
- Browser User-Agent confirms: `is_android_tv = true`

### Step 2: Server Registration
- Backend auto-registers the device:
  - `device_id`
  - Device type
  - First seen timestamp
- Device is stored in DB but **hidden by default**

⚠️ **Important**: This does **NOT** make the device appear in `/tvs`.

---

## MANUAL ADDITION FLOW (REQUIRED)

### Why Manual Addition Exists
- Prevents clutter
- Prevents random TVs from appearing
- Gives users full control
- Keeps `/tvs` clean and intentional

### Step-by-Step Manual Add
1. User opens `/tvs`
2. Clicks "Add Android TV"
3. Enters:
   - Device ID (or scans QR)
4. System validates:
   - Device exists
   - Device is Android TV
5. Flag is set: `is_manual = true`
6. **Only now**: ✅ The TV appears in `/tvs`

---

## FILTERING RULE (STRICT)

The `/tvs` page **must** show **only**:

```sql
WHERE is_android_tv = TRUE
AND is_manual = TRUE
```

**Nothing else.**

---

## REAL-TIME MONITORING

### Heartbeat System
- Each TV sends heartbeat every few seconds
- Backend updates:
  - `last_seen_at`
  - Connection quality

### UI Behavior
- Auto-refresh every 15 seconds
- Status shown as:
  - Online
  - Offline
- "Last seen" timestamp always visible
- **No graphs. No analytics. Status only.**

---

## SCREEN PAIRING (CORE ACTION)

### What Pairing Means
Pairing = assigning one Screen Profile to one TV device.

### How Pairing Works
From `/tvs`:
- Each TV row/card has:
  - Screen assignment dropdown
  - QR pairing option
- User can:
  - Select a Screen Profile
  - Or scan QR code from dashboard
- Backend stores: `device_id → screen_id`
- TV immediately starts showing assigned content.

---

## BULK OPERATIONS (LIMITED, SAFE)

**Allowed bulk actions:**
- ✅ Assign Screen Profile
- ✅ Unpair Screen Profile
- ✅ Remove TVs from management

**Not allowed:**
- ❌ Bulk delete media
- ❌ Bulk edit screens
- ❌ Bulk scheduling

---

## SEARCH & FILTERING

**Allowed filters:**
- Device name
- Device ID
- Online / Offline status

**Purpose:**
- Fast lookup
- Large deployments support

---

## DELETE / REMOVE DEVICE

### Behavior
- Removes TV from `/tvs`
- Sets: `is_manual = false`
- Device returns to "unmanaged" state

### Result
- TV still runs Public Player
- But is **no longer controlled** by this account
- Can be re-added later if needed

**Note**: Device is NOT deleted from database, only unmanaged.

---

## WHY THIS DESIGN IS CORRECT

- ✅ Scales cleanly
- ✅ Prevents UI chaos
- ✅ Matches real signage workflows
- ✅ Keeps mental model simple
- ✅ Works today and for future TV app

---

## EXPLICITLY OUT OF SCOPE (DO NOT ADD)

❌ Media uploads  
❌ Screen editing  
❌ Scheduling  
❌ User management  
❌ Analytics dashboards  

Those belong elsewhere.

---

## FINAL ENFORCEMENT RULE

**If a feature does not directly help identify, monitor, or assign a TV, it does not belong in `/tvs`.**

---

## DOCUMENTATION

All technical details (API, DB schema, examples) must live in:
- `TVS_PAGE_EXPLANATION.md` (detailed technical docs)

The UI must stay simple and readable.

---

## IMPLEMENTATION CHECKLIST

- [x] Filtering: `is_android_tv = TRUE AND is_manual = TRUE`
- [x] Manual addition required
- [x] Real-time status monitoring (15s refresh)
- [x] Screen pairing functionality
- [x] Bulk operations (assign/unpair/remove)
- [x] Search and filtering
- [x] Remove sets `is_manual = false` (not delete)
- [x] No navigation to screens/media/schedules
- [x] No analytics or graphs
- [x] Status only display

---

**Last Updated**: Based on final authoritative spec  
**Status**: ✅ Implementation matches spec

