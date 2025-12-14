# Missing Features & Mock Data Removal Plan

## 🚨 Critical Issues Found

### 1. Mock/Demo Data (Must Remove)
- ❌ `getAllRestaurants()` - Returns hardcoded demo data
- ❌ `getSystemStats()` - Returns fake stats (12 users, 45 screens, etc.)
- ❌ `getStorageUsage()` - Always returns 0
- ❌ `getStorageBreakdown()` - Always returns zeros
- ❌ `getCurrentPlanConfig()` - Always returns PRO plan (should use user's actual plan)
- ❌ `canCreateScreen()` - Always returns true (no plan limit checking)
- ❌ `canUpload()` - Always returns true (no storage limit checking)
- ❌ `getTeamMembers()` - Returns mock data
- ❌ `getSettings()` - Returns hardcoded SMTP config
- ❌ `getActivities()` - Returns single mock log entry
- ❌ Mock admin login (admin@menupi.com / admin)

### 2. Missing Backend API Endpoints
- ❌ `/api/admin/stats` - Real system statistics
- ❌ `/api/admin/restaurants` - List all restaurants
- ❌ `/api/admin/users` - Manage users
- ❌ `/api/team` - Get team members
- ❌ `/api/team/invite` - Invite user
- ❌ `/api/team/:id` - Remove user
- ❌ `/api/storage/usage` - Calculate storage usage
- ❌ `/api/storage/breakdown` - Storage by type
- ❌ `/api/activities` - Get activity logs
- ❌ `/api/activities/log` - Log activity
- ❌ `/api/settings` - Get/save settings
- ❌ `/api/screens/:id/ping` - Screen heartbeat

### 3. Missing Features
- ❌ Storage usage calculation from database
- ❌ Plan-based restrictions (screen limits, storage limits)
- ❌ Upload validation against plan limits
- ❌ Team management (invite/remove users) - Backend not implemented
- ❌ Activity logging system
- ❌ Settings persistence
- ❌ Video duration detection on upload
- ❌ Playlist order persistence (display_order column exists but not used)
- ❌ Screen ping/heartbeat tracking
- ❌ Plan upgrade/downgrade functionality
- ❌ Watermark for free plan
- ❌ Schedule priority handling
- ❌ Real-time active screen detection

## 📋 Implementation Priority

### Phase 1: Critical (Remove Mock Data)
1. ✅ Remove mock admin login
2. ✅ Implement real storage usage calculation
3. ✅ Implement plan-based restrictions
4. ✅ Fix getCurrentPlanConfig to use user's actual plan

### Phase 2: Backend APIs
1. ✅ Add storage usage endpoint
2. ✅ Add team management endpoints
3. ✅ Add admin dashboard endpoints
4. ✅ Add activity logging endpoints
5. ✅ Add settings endpoints

### Phase 3: Advanced Features
1. ✅ Video duration detection
2. ✅ Playlist ordering
3. ✅ Screen heartbeat tracking
4. ✅ Schedule priority

## 🎯 Success Criteria

- [ ] No mock/demo data in production code
- [ ] All features from functionality report implemented
- [ ] Real data from database everywhere
- [ ] Plan restrictions enforced
- [ ] Storage limits enforced
- [ ] Team management working
- [ ] Admin dashboard shows real stats
- [ ] Activity logging functional

