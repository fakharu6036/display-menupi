# Local Testing Guide

## ✅ Current Status

Both servers are running locally:

- **Backend API**: http://localhost:3001
- **Frontend App**: http://localhost:3000

## 🚀 Quick Start

### 1. Start Backend
```bash
node server.js
```
The backend will start on port 3001.

### 2. Start Frontend (in a new terminal)
```bash
npm run dev
```
The frontend will start on port 3000.

## 📋 Prerequisites

### Database Setup (Required for full functionality)

1. **Install MySQL** (if not installed):
   ```bash
   # macOS with Homebrew
   brew install mysql
   brew services start mysql
   ```

2. **Create Database**:
   ```bash
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS menupi_db;"
   ```

3. **Apply Schema**:
   ```bash
   mysql -u root menupi_db < database/schema.sql
   ```

4. **Update .env file** (if needed):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=menupi_db
   ```

## 🧪 Testing Endpoints

### Public Endpoints (No Auth Required)
- `GET http://localhost:3001/api/public/screen/{CODE}` - Get screen by code

### Protected Endpoints (Require JWT Token)
- `POST http://localhost:3001/api/register` - Register new user
- `POST http://localhost:3001/api/login` - Login
- `POST http://localhost:3001/api/auth/google` - Google OAuth
- `GET http://localhost:3001/api/screens` - Get screens
- `GET http://localhost:3001/api/media` - Get media
- `POST http://localhost:3001/api/media` - Upload media

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **TV Login**: http://localhost:3000/tv
- **TV Player**: http://localhost:3000/tv/{SCREEN_CODE}

## ⚠️ Common Issues

### Backend won't start
- Check if port 3001 is already in use
- Verify `.env` file exists with correct database credentials
- Check MySQL is running: `brew services list` (macOS)

### Database connection errors
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists: `mysql -u root -e "SHOW DATABASES;"`

### Frontend can't connect to API
- Verify backend is running on port 3001
- Check `VITE_API_URL` in `.env.local` is set to `http://localhost:3001/api`
- Check browser console for CORS errors

### File upload fails
- Ensure `uploads/` directory exists and is writable
- Check file size limits in `.env`
- Verify file type is allowed

## 🛑 Stop Servers

Press `Ctrl+C` in the terminal where each server is running.

Or kill by port:
```bash
# Kill backend
lsof -ti:3001 | xargs kill

# Kill frontend
lsof -ti:3000 | xargs kill
```

## 📝 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can register new user
- [ ] Can login with email/password
- [ ] Can upload media files
- [ ] Can create screens
- [ ] TV player loads with screen code
- [ ] Playlist updates every 60 seconds

