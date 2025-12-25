# `/tvs` Page - Complete Explanation

## Overview

The `/tvs` page is a **management interface for Android TV devices** in your digital signage system. It allows you to manually add, monitor, and manage physical Android TV devices that display your content.

---

## What It Does

The `/tvs` page provides:

1. **Manual Device Management**: Only shows Android TV devices that you manually add
2. **Real-time Monitoring**: Shows which TVs are online/offline and their connection status
3. **Screen Pairing**: Link Android TV devices to your digital screens (profiles)
4. **Device Control**: Add, remove, and manage Android TV devices
5. **Filtering & Search**: Find specific devices quickly

---

## How It Works - Complete Flow

### 1. **Device Registration Flow**

When an Android TV first connects to your system:

```
Android TV Browser → Opens tv.menupi.com
    ↓
Device Fingerprinting → Generates unique device ID
    ↓
POST /api/tvs/register → Registers device in database
    ↓
Server detects Android TV from User-Agent
    ↓
Stores: device_id, IP address, user_agent, is_android_tv flag
```

**Key Points:**
- Each Android TV gets a unique `device_id` (based on device fingerprinting)
- The server automatically detects if it's an Android TV by checking the User-Agent string
- Devices are stored in the `hardware_tvs` database table

### 2. **Heartbeat System**

Android TVs continuously send "heartbeat" signals:

```
Android TV (every few seconds)
    ↓
POST /api/tvs/heartbeat → { deviceId: "tv_abc123" }
    ↓
Server updates: last_seen_at = NOW()
    ↓
Status calculated: online if last_seen < 60 seconds
```

**Purpose:**
- Keeps track of which devices are currently online
- Updates the "Last Seen" timestamp
- Helps determine connection quality

### 3. **Manual Addition Process**

To show a TV in the `/tvs` page, you must manually add it:

```
User clicks "Add Android TV" button
    ↓
Modal opens → User enters device ID
    ↓
POST /api/tvs/manual-add → { deviceId: "tv_abc123" }
    ↓
Server marks device: is_manual = TRUE, is_android_tv = TRUE
    ↓
Device now appears in /tvs page
```

**Why Manual?**
- Prevents confusion from too many devices
- Only shows devices you explicitly want to manage
- Filters out non-Android TV devices automatically

### 4. **Displaying TVs**

The `/tvs` page fetches devices:

```
Frontend: GET /api/tvs
    ↓
Backend Query:
  SELECT * FROM hardware_tvs
  WHERE restaurant_id = ?
  AND is_manual = TRUE
  AND is_android_tv = TRUE
    ↓
Returns only manually added Android TVs
    ↓
Frontend displays with:
  - Online/Offline status
  - Last seen time
  - Assigned screen
  - Connection quality
```

---

## Key Features Explained

### **1. Auto-Refresh (Every 15 seconds)**

```javascript
// Automatically refreshes TV list every 15 seconds
setInterval(() => {
  StorageService.getPhysicalTVs()
}, 15000)
```

**Purpose:** Keeps the status information up-to-date without manual refresh

### **2. Status Detection**

**Online Status:**
- Device is "online" if `last_seen_at` is within the last 60 seconds
- Otherwise marked as "offline"

**Connection Quality:**
- **Excellent**: Last seen < 1 minute ago
- **Good**: Last seen < 5 minutes ago  
- **Poor**: Last seen > 5 minutes ago or offline

### **3. Screen Assignment**

```
User selects a screen from dropdown
    ↓
POST /api/tvs/{deviceId}/assign → { screenId: "123" }
    ↓
Server updates: assigned_screen_id = 123
    ↓
Android TV now displays content from that screen
```

**Purpose:** Links a physical TV device to a digital screen profile, so the TV knows what content to display

### **4. QR Code Pairing**

```
User clicks QR scanner button
    ↓
Camera opens → Scans QR code from TV
    ↓
QR code format: "MENUPI:tv_abc123"
    ↓
Extracts device ID → Assigns to selected screen
```

**Purpose:** Easy way to pair TVs without manually entering device IDs

### **5. Bulk Operations**

- **Select Multiple TVs**: Checkbox selection
- **Bulk Assign**: Assign multiple TVs to the same screen at once
- **Bulk Unpair**: Remove screen assignments from multiple TVs

### **6. Filtering & Search**

**Filters:**
- All TVs
- Online only
- Offline only
- Assigned (has a screen)
- Unassigned (no screen)

**Search:**
- Search by device name
- Search by device ID
- Search by assigned screen name

**Sorting:**
- By name
- By status (online first)
- By last seen
- By assigned screen

---

## Database Structure

### `hardware_tvs` Table

```sql
- device_id (VARCHAR) - Unique device identifier
- restaurant_id (INT) - Which restaurant owns this device
- assigned_screen_id (INT) - Which screen profile is assigned
- assigned_screen_code (VARCHAR) - Screen code for quick lookup
- last_seen_at (TIMESTAMP) - Last heartbeat time
- is_manual (BOOLEAN) - TRUE if manually added from /tvs page
- is_android_tv (BOOLEAN) - TRUE if detected as Android TV
- ip_address (VARCHAR) - Last known IP address
- user_agent (VARCHAR) - Browser user agent string
```

---

## API Endpoints

### **GET `/api/tvs`**
- **Purpose**: Fetch all manually added Android TVs
- **Auth**: Required (authenticateToken)
- **Returns**: Array of TV objects
- **Filter**: Only returns `is_manual = TRUE AND is_android_tv = TRUE`

### **POST `/api/tvs/manual-add`**
- **Purpose**: Manually add an Android TV device
- **Auth**: Required
- **Body**: `{ deviceId: string, name?: string }`
- **Action**: Marks device as `is_manual = TRUE, is_android_tv = TRUE`

### **DELETE `/api/tvs/:deviceId`**
- **Purpose**: Remove an Android TV device
- **Auth**: Required
- **Action**: Deletes device from database

### **POST `/api/tvs/:deviceId/assign`**
- **Purpose**: Assign a screen to a TV device
- **Auth**: Required
- **Body**: `{ screenId?: string }`
- **Action**: Links TV to a screen profile

### **POST `/api/tvs/register`** (Public)
- **Purpose**: Register a new device (called by TV itself)
- **Auth**: None (public endpoint)
- **Action**: Creates device record, detects Android TV

### **POST `/api/tvs/heartbeat`** (Public)
- **Purpose**: Update device heartbeat (called by TV itself)
- **Auth**: None (public endpoint)
- **Action**: Updates `last_seen_at` timestamp

---

## Android TV Detection

The system automatically detects Android TV devices by checking the User-Agent string:

```javascript
function isAndroidTV(userAgent) {
  // Checks for patterns like:
  // - "android" + "tv"
  // - "aftb", "aftm", "afts" (Amazon Fire TV)
  // - "nexus player"
  // - "nvidia shield"
  // - "mi box"
  // - "androidtv"
  // - "smart-tv"
}
```

**Supported Devices:**
- Android TV boxes
- Amazon Fire TV / Fire Stick
- NVIDIA Shield
- Xiaomi Mi Box
- Any device with Android TV OS

---

## User Workflow Example

1. **Setup Android TV:**
   - Open browser on Android TV
   - Navigate to `tv.menupi.com`
   - Device automatically registers with unique ID

2. **Add to Management:**
   - Go to `/tvs` page in dashboard
   - Click "Add Android TV"
   - Enter the device ID (shown on TV screen)
   - Device appears in list

3. **Assign Screen:**
   - Select a screen from dropdown
   - TV now displays content from that screen
   - Status shows "Broadcasting: [Screen Name]"

4. **Monitor:**
   - See real-time online/offline status
   - Check connection quality
   - View last seen time
   - Filter and search devices

5. **Remove (if needed):**
   - Click trash icon on TV card
   - Confirm deletion
   - Device removed from management

---

## Security & Access Control

- **Authentication Required**: All management endpoints require login
- **Restaurant Isolation**: Users only see TVs for their restaurant
- **Public Endpoints**: Only `/api/tvs/register` and `/api/tvs/heartbeat` are public (called by TVs themselves)
- **Permission Check**: Uses `canEdit` to determine if user can modify TVs

---

## Error Handling

- **Migration Not Run**: If database columns don't exist, returns empty array (graceful degradation)
- **Device Not Found**: Returns 404 with error message
- **Network Errors**: Frontend shows error alerts, retries automatically
- **Invalid Device ID**: Validation prevents adding invalid IDs

---

## Summary

The `/tvs` page is a **smart filtering and management system** that:

✅ Only shows manually added Android TV devices (reduces confusion)  
✅ Automatically detects Android TV devices from User-Agent  
✅ Provides real-time monitoring and status updates  
✅ Allows easy pairing of physical TVs to digital screen profiles  
✅ Supports bulk operations for managing multiple devices  
✅ Includes search, filter, and sort capabilities  

The key innovation is the **manual addition requirement** - this ensures you only see and manage the Android TV devices you explicitly want to control, making the interface much cleaner and less confusing.

