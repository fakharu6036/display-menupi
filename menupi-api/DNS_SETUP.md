# 🌐 DNS Configuration Guide for api.menupi.com

## Fly.io DNS Records

You need to add these DNS records in Hostinger to point `api.menupi.com` to your Fly.io app.

### Option 1: CNAME Record (Easiest - Recommended)

**In Hostinger DNS Settings:**
1. Go to: **hPanel → Domains → DNS Zone Editor** (or **Advanced → DNS Zone**)
2. Click **Add Record**
3. Fill in:
   - **Type:** `CNAME`
   - **Name:** `api`
   - **Value:** `qx6285y.display-menupi.fly.dev`
   - **TTL:** `3600` (or default)
4. Click **Add Record** or **Save**

**Wait 5-10 minutes** for DNS to propagate.

### Option 2: A and AAAA Records (Direct IP)

**In Hostinger DNS Settings:**
1. Go to: **hPanel → Domains → DNS Zone Editor**
2. Click **Add Record** (twice - once for A, once for AAAA)

**A Record (IPv4):**
- **Type:** `A`
- **Name:** `api`
- **Value:** `66.241.125.67`
- **TTL:** `3600`

**AAAA Record (IPv6):**
- **Type:** `AAAA`
- **Name:** `api`
- **Value:** `2a09:8280:1::ba:b897:0`
- **TTL:** `3600`

**Wait 5-10 minutes** for DNS to propagate.

## Step-by-Step: Hostinger DNS Configuration

### Method 1: Using hPanel

1. **Login to Hostinger hPanel**
   - Go to: https://hpanel.hostinger.com
   - Login with your credentials

2. **Navigate to DNS Settings**
   - Click **Domains** in the left menu
   - Click on **menupi.com** (or your domain)
   - Click **DNS / Nameservers** tab
   - Or go to **Advanced → DNS Zone Editor**

3. **Add CNAME Record**
   - Click **Add Record** or **+** button
   - Select **CNAME** from Type dropdown
   - **Name/Host:** Enter `api` (without .menupi.com)
   - **Value/Target:** Enter `qx6285y.display-menupi.fly.dev`
   - **TTL:** Leave default or set to `3600`
   - Click **Add** or **Save**

4. **Verify**
   - You should see a new record:
     ```
     Type: CNAME
     Name: api
     Value: qx6285y.display-menupi.fly.dev
     ```

### Method 2: Using Hostinger File Manager (if DNS Zone Editor not available)

1. **Access DNS via File Manager**
   - Go to **Files → File Manager**
   - Navigate to `/public_html` or domain root
   - Look for DNS configuration files

2. **Or Contact Support**
   - If you can't find DNS settings, contact Hostinger support
   - Ask them to add:
     - **CNAME:** `api.menupi.com` → `qx6285y.display-menupi.fly.dev`

## Verify DNS Configuration

### Check DNS Propagation

**Option 1: Online Tools**
- Visit: https://dnschecker.org
- Enter: `api.menupi.com`
- Select record type: `CNAME` or `A`
- Check if it shows the Fly.io values

**Option 2: Command Line**
```bash
# Check CNAME
dig api.menupi.com CNAME

# Check A record
dig api.menupi.com A

# Check AAAA record
dig api.menupi.com AAAA
```

**Option 3: Fly.io CLI**
```bash
fly certs check api.menupi.com -a display-menupi
```

## After DNS is Configured

### 1. Wait for Propagation
- DNS changes take 5-10 minutes to propagate
- Can take up to 24 hours in rare cases

### 2. Check Certificate Status
```bash
fly certs check api.menupi.com -a display-menupi
```

You should see:
```
✓ Certificate is valid
```

### 3. Test the Domain
```bash
curl https://api.menupi.com/api/health
```

Should return:
```json
{"status":"ok","timestamp":"...","database":"..."}
```

### 4. Update Frontend
Update your frontend environment variable:
```
VITE_API_URL=https://api.menupi.com/api
```

## Troubleshooting

### DNS Not Propagating
1. **Double-check the record** in Hostinger
2. **Clear DNS cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   
   # Windows
   ipconfig /flushdns
   ```
3. **Wait longer** (up to 24 hours)
4. **Check with different DNS servers:**
   - Use Google DNS: `8.8.8.8`
   - Use Cloudflare DNS: `1.1.1.1`

### Certificate Not Issuing
1. **Verify DNS is correct:**
   ```bash
   fly certs check api.menupi.com -a display-menupi
   ```
2. **Wait for DNS propagation** (can take 10-15 minutes)
3. **Check Fly.io logs:**
   ```bash
   fly logs -a display-menupi
   ```

### Domain Not Resolving
1. **Check if record exists:**
   ```bash
   dig api.menupi.com
   ```
2. **Verify in Hostinger** that the record was saved
3. **Try CNAME instead of A/AAAA** if having issues

## Current Fly.io Configuration

- **App Name:** `display-menupi`
- **Fly.dev URL:** `https://display-menupi.fly.dev`
- **Custom Domain:** `api.menupi.com`
- **CNAME Target:** `qx6285y.display-menupi.fly.dev`
- **IPv4:** `66.241.125.67`
- **IPv6:** `2a09:8280:1::ba:b897:0`

## Quick Reference

**CNAME Record (Recommended):**
```
Type: CNAME
Name: api
Value: qx6285y.display-menupi.fly.dev
TTL: 3600
```

**A Record (IPv4):**
```
Type: A
Name: api
Value: 66.241.125.67
TTL: 3600
```

**AAAA Record (IPv6):**
```
Type: AAAA
Name: api
Value: 2a09:8280:1::ba:b897:0
TTL: 3600
```

