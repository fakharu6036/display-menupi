# Database Migration Guide for Railway

## 🎯 Overview

This guide explains how to initialize the database on Railway. The backend **does NOT** auto-create tables in production - you must run migrations manually via Railway MySQL Shell.

## ✅ Migration File: `migrations_all.sql`

**Location**: `migrations_all.sql` in the repository root

**What it does**:
- Creates all required tables (restaurants, users, media, screens, etc.)
- Adds all migration columns (IP tracking, TV management, deduplication)
- Safe to run multiple times (idempotent)
- Uses `IF NOT EXISTS` and safe index creation

**Safety Features**:
- ✅ All `CREATE TABLE` use `IF NOT EXISTS`
- ✅ All `ALTER TABLE` use `IF NOT EXISTS` for columns
- ✅ Indexes are created safely (checks if exists first)
- ✅ No `DROP TABLE` or destructive operations
- ✅ Foreign keys are properly ordered

## 📋 Step-by-Step: Run Migration in Railway

### Step 1: Access Railway MySQL Shell

1. Go to Railway Dashboard
2. Open your project
3. Find the **MySQL** service (or add one if not exists)
4. Click on the MySQL service
5. Click **"Connect"** tab
6. Click **"MySQL Shell"** button

### Step 2: Run the Migration

In the MySQL Shell, run:

```sql
SOURCE migrations_all.sql;
```

Or copy-paste the entire contents of `migrations_all.sql` into the shell.

### Step 3: Verify Migration

After running, verify tables were created:

```sql
SHOW TABLES;
```

You should see:
- restaurants
- users
- media
- screens
- screen_media
- schedules
- hardware_tvs
- plan_requests

### Step 4: Check Table Structure (Optional)

```sql
DESCRIBE hardware_tvs;
```

You should see all columns including:
- device_id (legacy)
- device_uid (new)
- installation_id
- tv_id
- is_manual
- is_android_tv
- ip_address
- user_agent
- etc.

## 🔍 What the Migration Does

### Part 1: Core Tables
Creates base tables in dependency order:
1. `restaurants` (no dependencies)
2. `users` (depends on restaurants)
3. `media` (depends on users, restaurants)
4. `screens` (depends on users, restaurants)
5. `screen_media` (depends on screens, media)
6. `schedules` (depends on restaurants, users, screens)

### Part 2: Hardware TVs Table
Creates `hardware_tvs` table for device management.

### Part 3: Plan Requests Table
Creates `plan_requests` table for plan upgrade requests.

### Part 4: IP Tracking Migration
Adds `ip_address` and `user_agent` columns to `hardware_tvs`.

### Part 5: Manual TV Management Migration
Adds `is_manual` and `is_android_tv` columns to `hardware_tvs`.

### Part 6: TV Deduplication Migration
Adds deduplication fields:
- `device_uid` (unique, permanent identity)
- `installation_id` (ephemeral, per install)
- `tv_id` (user-facing code)
- `mac_hash` (hardware identification)
- `approved_at` (approval timestamp)

## ⚠️ Important Notes

### Why Manual Migration?

1. **Production Safety**: Auto-creating tables in production code is risky
2. **Control**: You control when and how migrations run
3. **Visibility**: See exactly what's being created
4. **Rollback**: Easier to manage if something goes wrong
5. **Railway Best Practice**: Railway recommends manual migrations

### Backend Behavior

The backend will:
- ✅ Connect to the database
- ✅ Log "Database connected" on success
- ✅ Log "Tables ready" if tables exist
- ✅ Warn if tables don't exist (but continue running)
- ❌ **NOT** auto-create tables
- ❌ **NOT** run migrations automatically

### If Tables Don't Exist

If you see the warning:
```
⚠️  Database tables not initialized. Run migrations_all.sql in Railway MySQL Shell.
```

**Action**: Run `migrations_all.sql` in Railway MySQL Shell (see Step 2 above).

## 🔄 Re-running Migrations

**Safe to re-run**: The migration is idempotent. You can run it multiple times:
- Existing tables won't be recreated
- Existing columns won't be re-added
- Existing indexes won't be re-created
- No data will be lost

## 🐛 Troubleshooting

### Error: "Table already exists"
**Status**: ✅ Normal - table was already created. Migration continues.

### Error: "Duplicate column name"
**Status**: ✅ Normal - column was already added. Migration continues.

### Error: "Duplicate key name" (index)
**Status**: ✅ Normal - index was already created. Migration continues.

### Error: "Cannot connect to database"
**Action**: Check Railway environment variables:
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

### Error: "Access denied"
**Action**: Verify database credentials in Railway Variables.

## 📝 Migration File Structure

```
migrations_all.sql
├── Part 1: Core Tables (base schema)
├── Part 2: Hardware TVs Table
├── Part 3: Plan Requests Table
├── Part 4: IP Tracking Migration
├── Part 5: Manual TV Management Migration
└── Part 6: TV Deduplication Migration
```

## ✅ Verification Checklist

After running migration:

- [ ] All 8 tables exist (SHOW TABLES)
- [ ] `hardware_tvs` has all columns (DESCRIBE hardware_tvs)
- [ ] Backend logs "Database connected"
- [ ] Backend logs "Tables ready"
- [ ] No errors in Railway logs
- [ ] API endpoints respond correctly

## 🚀 Next Steps

After migration completes:

1. ✅ Backend will automatically connect
2. ✅ API endpoints will work
3. ✅ You can create users via `/api/register`
4. ✅ You can manage TVs via `/api/tvs`

---

**Status**: ✅ Ready for Railway deployment
**Migration File**: `migrations_all.sql`
**Run Once**: In Railway MySQL Shell

