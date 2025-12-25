
# MENUPI Production Deployment Strategy

## 1. Environment Configuration
Create a `.env.production` file in Secret Manager:
- `VITE_API_URL`: URL of the Cloud Run API.
- `JWT_SECRET`: HS256 key for user sessions.
- `GCS_BUCKET_NAME`: Name of the bucket for media.
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`: Cloud SQL credentials.

## 2. Infrastructure (GCP)
- **Frontend**: Deploy to **Vercel** or **GCP Cloud Run** (with Firebase Hosting for CDN).
- **Backend**: **Node.js (Express)** on **Cloud Run**. Auto-scale to zero when idle.
- **Database**: **Cloud SQL (MySQL 8.0)**. Use Private IP + SQL Proxy.
- **Storage**: **Google Cloud Storage (GCS)**.
  - Use `Uniform bucket-level access`.
  - Content delivered via **Signed URLs** with 1-hour expiration.

## 3. Media Normalization
- Server-side (Cloud Function) uses `ffmpeg` for video transcoding to H.264/MP4.
- Images compressed via `sharp` to WebP/JPG.
- PDF pages converted to JPG thumbnails for dashboard previews.

## 4. Security Hardening
- **TV Handshake**: Pairing codes expire after 10 minutes.
- **CORS**: Restricted to `*.menupi.com`.
- **DDoS**: Cloud Armor policy on the Load Balancer.
- **Auditing**: Stackdriver logging enabled for all API writes.

## 5. TV Runtime Rules
- The `PublicPlayer` uses **Local Storage caching**.
- Hardware IDs are persistent and tied to the browser Fingerprint.
- Force re-auth if the hardware ID is manually wiped.
