# Development Ports Configuration

This application runs on different ports in development to simulate the production subdomain setup:

## Port Assignment

- **Dashboard (app.menupi.com)**: Port `3000`
- **TV Player (tv.menupi.com)**: Port `3001`
- **API Server (api.menupi.com)**: Port `3002`

## Running Services

### Option 1: Run All Services Together
```bash
npm run start:all
```
This runs:
- Dashboard on http://localhost:3000
- TV Player on http://localhost:3001
- API Server on http://localhost:3002

### Option 2: Run Dashboard + API Only
```bash
npm run start
```
This runs:
- Dashboard on http://localhost:3000
- API Server on http://localhost:3002

### Option 3: Run Services Separately

**Dashboard only:**
```bash
npm run dev:dashboard
```
Access at: http://localhost:3000

**TV Player only:**
```bash
npm run dev:tv
```
Access at: http://localhost:3001

**API Server only:**
```bash
npm run server:api
```
API available at: http://localhost:3002

## Environment Variables

You can customize ports using environment variables:

### Frontend (Vite)
Create a `.env` file:
```env
VITE_PORT=3000          # Dashboard port (or 3001 for TV player)
VITE_API_PORT=3002     # API server port
VITE_API_URL=http://localhost:3002  # Explicit API URL (optional)
```

### Backend (Node.js)
Create a `.env` file:
```env
PORT=3002               # API server port
API_PORT=3002          # Alternative API port variable
```

## Access URLs

- **Dashboard**: http://localhost:3000
- **TV Player**: http://localhost:3001
- **TV Player with Screen Code**: http://localhost:3001/tv/[SCREEN_CODE]
- **API Endpoints**: http://localhost:3002/api/*

## Notes

- The API server must be running before the frontend can make requests
- TV Player and Dashboard can run simultaneously on different ports
- All services automatically detect the correct API URL based on the port configuration
- In production, these will be on different subdomains instead of ports

