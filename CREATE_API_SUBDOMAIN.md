# 🔧 Create API Subdomain in Hostinger

## ✅ Files Uploaded - Next Step: Create Subdomain

Since you've already uploaded the files, you just need to create the `api` subdomain.

---

## 🚀 Step-by-Step: Create API Subdomain

### Step 1: Log in to Hostinger hPanel

1. Go to: https://hpanel.hostinger.com
2. Log in with your Hostinger account

### Step 2: Create Subdomain

1. **In hPanel, go to:** **Domains** → **Subdomains**
   - Or search for "Subdomains" in the search bar

2. **Click "Create Subdomain"** or **"Add Subdomain"**

3. **Fill in the form:**
   - **Subdomain:** `api`
   - **Domain:** Select `menupi.com` (or your main domain)
   - **Document Root:** `/public_html/api`
   - Or: Point to `/home/u859590789/domains/menupi.com/public_html/api`

4. **Click "Create"** or **"Add"**

### Step 3: Enable SSL

1. **Go to:** **SSL** section in hPanel
2. **Find:** `api.menupi.com` in the list
3. **Click "Enable SSL"** or **"Install SSL"**
4. **Select:** Free SSL (Let's Encrypt)
5. **Wait for activation** (usually 1-5 minutes)

### Step 4: Verify DNS

After creating the subdomain, DNS should auto-configure. To verify:

1. **Wait 5-10 minutes** for DNS propagation
2. **Test with:**
   ```bash
   nslookup api.menupi.com
   ```
   Should return an IP address (not NXDOMAIN)

3. **Test API:**
   ```bash
   curl https://api.menupi.com/api/health
   ```

---

## 📋 Checklist

- [ ] Files uploaded to `/public_html/api/`
- [ ] `.env` file created with correct credentials
- [ ] Subdomain `api` created in Hostinger
- [ ] Subdomain points to `/public_html/api`
- [ ] SSL enabled for `api.menupi.com`
- [ ] DNS propagated (test with nslookup)
- [ ] API health endpoint works

---

## 🐛 Troubleshooting

### Subdomain Not Found After Creation

**Wait for DNS propagation:**
- Can take 5-30 minutes
- Check with: `nslookup api.menupi.com`
- If still NXDOMAIN after 30 minutes, check DNS settings

### SSL Not Working

1. **Wait 5-10 minutes** after enabling
2. **Check SSL status** in Hostinger SSL section
3. **Verify subdomain is active** in Domains section

### API Returns 404

1. **Check file path:** Should be `/public_html/api/index.php`
2. **Check `.htaccess`:** Should be in `/public_html/api/`
3. **Check file permissions:** Folders 755, files 644

### API Returns 500 Error

1. **Check PHP error logs** in Hostinger
2. **Verify `.env` file exists** and has correct values
3. **Check database connection** in `.env`
4. **Verify file permissions** (755/644)

---

## 🎯 Quick Test

After creating subdomain and enabling SSL:

```bash
# Test DNS
nslookup api.menupi.com

# Test API (should work after DNS propagates)
curl https://api.menupi.com/api/health

# Expected response:
# {"success":true,"data":{"status":"ok","timestamp":"...","database":"connected"}}
```

---

## 📝 Important Notes

1. **DNS Propagation:** Can take 5-30 minutes
2. **SSL Activation:** Usually 1-5 minutes after enabling
3. **File Path:** Must be exactly `/public_html/api/`
4. **Document Root:** Should point to `/public_html/api` (not `/public_html`)

---

**Once the subdomain is created and DNS propagates, your frontend will automatically connect!**

