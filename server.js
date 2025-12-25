import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// import fetch from 'node-fetch'; // Uncomment if using Node < 18

const app = express();

// CORS Configuration for Production Subdomains
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Production: Allow all menupi.com subdomains
    if (origin.includes('menupi.com')) {
      return callback(null, true);
    }
    
    // Block other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Database Connection
// Railway provides all database credentials via environment variables
// MySQL2 pool configuration (only valid options to avoid warnings)
// Updated: 2025-12-25 - Removed invalid options (acquireTimeout, timeout, reconnect)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Explicitly remove any invalid options that might come from env vars or elsewhere
// This prevents Railway env vars or other sources from adding invalid MySQL options
// CRITICAL: These options are NOT valid for connection pools, only for individual connections
delete dbConfig.acquireTimeout;
delete dbConfig.timeout;
delete dbConfig.reconnect;

// Also check and remove from process.env if they exist (Railway might set these)
if (process.env.MYSQL_ACQUIRE_TIMEOUT || process.env.DB_ACQUIRE_TIMEOUT) {
    console.warn('⚠️  Removing invalid MySQL option: acquireTimeout (not valid for pools)');
}
if (process.env.MYSQL_TIMEOUT || process.env.DB_TIMEOUT) {
    console.warn('⚠️  Removing invalid MySQL option: timeout (not valid for pools)');
}
if (process.env.MYSQL_RECONNECT || process.env.DB_RECONNECT) {
    console.warn('⚠️  Removing invalid MySQL option: reconnect (not valid for pools)');
}

// Validate required database configuration
if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
    console.error('❌ Database configuration missing. Required environment variables:');
    console.error('   - DB_HOST');
    console.error('   - DB_USER');
    console.error('   - DB_NAME');
    console.error('   - DB_PASSWORD');
    process.exit(1);
}

const pool = mysql.createPool(dbConfig);

// Get base URL for file serving (production only)
const getBaseUrl = () => {
  // Check for explicit API URL in environment (required)
  if (process.env.API_URL) {
    return process.env.API_URL.endsWith('/') ? process.env.API_URL.slice(0, -1) : process.env.API_URL;
  }
  
  // Production: Use API domain (api.menupi.com)
  const protocol = process.env.PROTOCOL || 'https';
  const domain = process.env.DOMAIN || 'api.menupi.com';
  return `${protocol}://${domain}`;
};

const BASE_URL = getBaseUrl();

// Test database connection (non-blocking)
// Note: Database tables must be initialized via Railway MySQL Shell using migrations_all.sql
// The backend does NOT auto-create tables in production
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected');
    // Verify tables exist (silent check)
    connection.query('SHOW TABLES LIKE "restaurants"')
      .then(([rows]) => {
        if (rows.length > 0) {
          console.log('✅ Tables ready');
        } else {
          console.warn('⚠️  Database tables not initialized. Run migrations_all.sql in Railway MySQL Shell.');
        }
        connection.release();
      })
      .catch(() => {
        // Silent fail - tables check is optional
        connection.release();
      });
  })
  .catch(err => {
    // Only log critical connection errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.error('❌ Database connection failed. Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME environment variables.');
      console.error('   Error:', err.message);
    } else {
      // Other errors (auth, etc.) - log but don't be noisy
      console.error('❌ Database connection error:', err.message);
    }
  });

// Middleware: Verify Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return res.status(500).json({ error: 'Server configuration error: JWT_SECRET not set' });
    }
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Helper to Generate JWT
const generateToken = (user) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
    }
    return jwt.sign(
        { id: user.id, restaurantId: user.restaurant_id, role: user.role }, 
        jwtSecret, 
        { expiresIn: '24h' }
    );
};

// --- ROOT & HEALTH CHECK ROUTES ---

// Root endpoint - API information
app.get('/', (req, res) => {
    res.json({
        service: 'MENUPI API',
        version: '1.0.0',
        status: 'online',
        endpoints: {
            auth: '/api/login, /api/register, /api/auth/google',
            media: '/api/media',
            screens: '/api/screens',
            schedules: '/api/schedules',
            tvs: '/api/tvs',
            admin: '/api/admin/*',
            health: '/api/health'
        },
        documentation: 'https://github.com/fakharu6036/display-menupi'
    });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Quick database connectivity check
        const [result] = await pool.execute('SELECT 1 as health');
        res.json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString(),
            service: 'MENUPI API'
        });
    } catch (err) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: err.message,
            timestamp: new Date().toISOString(),
            service: 'MENUPI API'
        });
    }
});

// --- AUTH ROUTES ---

// 1. Local Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.execute(
            'SELECT u.*, r.plan, r.account_status, r.name as rest_name FROM users u JOIN restaurants r ON u.restaurant_id = r.id WHERE u.email = ? AND u.auth_method = "local"', 
            [email]
        );

        if (users.length === 0) return res.status(401).json({ error: 'User not found or uses Google Login' });
        
        const user = users[0];
        const match = await bcrypt.compare(password, user.password);
        
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                restaurantId: user.restaurant_id.toString(),
                plan: user.plan,
                accountStatus: user.account_status,
                avatarUrl: null // Add avatar column to DB if needed
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. Local Register
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check existing
        const [existing] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Create Restaurant
        const [restResult] = await connection.execute(
            'INSERT INTO restaurants (name, email, owner_name, plan, max_screens, account_status) VALUES (?, ?, ?, ?, ?, ?)',
            [`${name}'s Business`, email, name, 'free', 1, 'active']
        );
        const restaurantId = restResult.insertId;

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User
        const [userResult] = await connection.execute(
            'INSERT INTO users (name, restaurant_id, email, password, role, auth_method) VALUES (?, ?, ?, ?, ?, ?)',
            [name, restaurantId, email, hashedPassword, 'owner', 'local']
        );

        await connection.commit();

        // Auto Login
        const user = { id: userResult.insertId, restaurant_id: restaurantId, role: 'owner' };
        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user.id.toString(),
                email,
                name,
                role: 'owner',
                restaurantId: restaurantId.toString(),
                plan: 'free',
                accountStatus: 'active'
            }
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error('Registration error:', err);
        
        // Handle database connection errors
        if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
            return res.status(503).json({ error: 'Database connection failed. Please ensure MySQL is running.' });
        }
        
        // Handle duplicate email
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        res.status(500).json({ error: err.message || 'Registration failed' });
    }
});

// 3. Google Auth (Login or Register)
app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;
    
    try {
        // Verify Google Token
        // Using fetch to standard endpoint to avoid google-auth-library dependency complexity here
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        
        if (!googleRes.ok) {
            return res.status(401).json({ error: 'Invalid Google Token' });
        }
        
        const payload = await googleRes.json();
        const { sub: googleId, email, name, picture } = payload;

        // Check if user exists
        const [users] = await pool.execute(
            'SELECT u.*, r.plan, r.account_status FROM users u JOIN restaurants r ON u.restaurant_id = r.id WHERE u.email = ?', 
            [email]
        );

        if (users.length > 0) {
            // LOGIN existing user
            const user = users[0];
            
            // Link Google ID if not set
            if (!user.google_id) {
                await pool.execute('UPDATE users SET google_id = ?, auth_method = "google" WHERE id = ?', [googleId, user.id]);
            }

            const token = generateToken(user);
            return res.json({
                token,
                user: {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    restaurantId: user.restaurant_id.toString(),
                    plan: user.plan,
                    accountStatus: user.account_status,
                    avatarUrl: picture
                }
            });
        } else {
            // REGISTER new user
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                // Create Restaurant
                const [restResult] = await connection.execute(
                    'INSERT INTO restaurants (name, email, owner_name, plan, max_screens, account_status) VALUES (?, ?, ?, ?, ?, ?)',
                    [`${name}'s Business`, email, name, 'free', 1, 'active']
                );
                const restaurantId = restResult.insertId;

                // Create User (Password is dummy for google auth)
                const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);
                const [userResult] = await connection.execute(
                    'INSERT INTO users (name, restaurant_id, email, password, role, google_id, auth_method) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [name, restaurantId, email, dummyPassword, 'owner', googleId, 'google']
                );

                await connection.commit();

                const user = { id: userResult.insertId, restaurant_id: restaurantId, role: 'owner' };
                const token = generateToken(user);

                return res.json({
                    token,
                    user: {
                        id: user.id.toString(),
                        email,
                        name,
                        role: 'owner',
                        restaurantId: restaurantId.toString(),
                        plan: 'free',
                        accountStatus: 'active',
                        avatarUrl: picture
                    }
                });
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        }
    } catch (err) {
        console.error("Google Auth Error:", err);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});


// --- MEDIA ROUTES ---

app.get('/api/media', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM media WHERE restaurant_id = ? ORDER BY created_at DESC',
            [req.user.restaurantId]
        );
        
        const media = rows.map(row => ({
            id: row.id.toString(),
            url: row.source === 'upload' ? `${BASE_URL}/${row.file_path}` : row.file_path,
            name: row.file_name,
            type: row.file_type,
            size: row.file_size_mb + ' MB',
            size_mb: parseFloat(row.file_size_mb) || 0,
            duration: row.duration || 10,
            createdAt: new Date(row.created_at).getTime(),
            sourceProvider: row.source === 'upload' ? undefined : row.source
        }));
        
        res.json(media);
    } catch (err) {
        // In development, return empty array if database error
        console.error('Media fetch error:', err.message);
        res.json([]);
    }
});

app.post('/api/media', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const typeMap = {
            'image/jpeg': 'image', 'image/png': 'image', 'image/gif': 'gif',
            'video/mp4': 'video', 'application/pdf': 'pdf'
        };
        const fileType = typeMap[file.mimetype] || 'image';
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

        const [result] = await pool.execute(
            'INSERT INTO media (user_id, restaurant_id, file_name, file_path, file_type, file_size_mb, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, req.user.restaurantId, file.originalname, file.path.replace(/\\/g, '/'), fileType, sizeMb, 'upload']
        );

        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/media/:id', authenticateToken, async (req, res) => {
    try {
        // Get file path first to delete from disk
        const [files] = await pool.execute('SELECT file_path FROM media WHERE id = ? AND restaurant_id = ?', [req.params.id, req.user.restaurantId]);
        if (files.length > 0) {
            const filePath = files[0].file_path;
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await pool.execute('DELETE FROM media WHERE id = ? AND restaurant_id = ?', [req.params.id, req.user.restaurantId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SCREENS ROUTES ---

app.get('/api/screens', authenticateToken, async (req, res) => {
    try {
        const [screens] = await pool.execute(
            'SELECT * FROM screens WHERE restaurant_id = ?',
            [req.user.restaurantId]
        );

        // Fetch playlist items for each screen
        const result = await Promise.all(screens.map(async (screen) => {
            try {
                const [playlistItems] = await pool.execute(
                    `SELECT sm.*, m.file_path, m.file_type, m.source 
                     FROM screen_media sm 
                     JOIN media m ON sm.media_id = m.id 
                     WHERE sm.screen_id = ?`,
                    [screen.id]
                );

                const playlist = playlistItems.map((item, idx) => ({
                    id: item.id.toString(),
                    mediaId: item.media_id.toString(),
                    duration: item.play_value || 10,
                    order: item.display_order !== null && item.display_order !== undefined ? item.display_order : idx,
                    playbackConfig: {
                        mode: item.play_mode === 'seconds' ? 'duration' : 'times',
                        duration: item.play_value,
                        scheduleType: 'always'
                    }
                })).sort((a, b) => a.order - b.order);

                return {
                    id: screen.id.toString(),
                    screenCode: screen.screen_code,
                    name: screen.name,
                    orientation: screen.orientation === 'horizontal' ? 'landscape' : 'portrait',
                    aspectRatio: screen.aspect_ratio,
                    displayMode: screen.display_mode === 'fit' ? 'contain' : screen.display_mode,
                    playlist: playlist,
                    createdAt: new Date(screen.created_at).getTime(),
                    lastPing: screen.last_seen_at ? new Date(screen.last_seen_at).getTime() : undefined
                };
            } catch (err) {
                // If playlist fetch fails, return screen with empty playlist
                return {
                    id: screen.id.toString(),
                    screenCode: screen.screen_code,
                    name: screen.name,
                    orientation: screen.orientation === 'horizontal' ? 'landscape' : 'portrait',
                    aspectRatio: screen.aspect_ratio,
                    displayMode: screen.display_mode === 'fit' ? 'contain' : screen.display_mode,
                    playlist: [],
                    createdAt: new Date(screen.created_at).getTime(),
                    lastPing: screen.last_seen_at ? new Date(screen.last_seen_at).getTime() : undefined
                };
            }
        }));

        res.json(result);
    } catch (err) {
        // In development, return empty array if database error
        console.error('Screens fetch error:', err.message);
        res.json([]);
    }
});

app.post('/api/screens', authenticateToken, async (req, res) => {
    const { name, orientation, aspectRatio, screenCode } = req.body;
    try {
        const [result] = await pool.execute(
            'INSERT INTO screens (user_id, restaurant_id, name, orientation, aspect_ratio, screen_code, template) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, req.user.restaurantId, name, orientation === 'landscape' ? 'horizontal' : 'vertical', aspectRatio, screenCode, 'default']
        );
        res.json({ id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/screens/:id', authenticateToken, async (req, res) => {
    const { playlist, ...updates } = req.body;
    const screenId = req.params.id;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Update Screen Details
        if (updates.name) {
            await connection.execute(
                'UPDATE screens SET name = ?, orientation = ?, aspect_ratio = ? WHERE id = ? AND restaurant_id = ?',
                [updates.name, updates.orientation === 'landscape' ? 'horizontal' : 'vertical', updates.aspectRatio, screenId, req.user.restaurantId]
            );
        }

        // Update Playlist: Delete all old items and re-insert
        // Note: In production, consider "upsert" or diffing to be more efficient
        if (playlist) {
            await connection.execute('DELETE FROM screen_media WHERE screen_id = ?', [screenId]);
            
            for (let idx = 0; idx < playlist.length; idx++) {
                const item = playlist[idx];
                const mode = item.playbackConfig?.mode === 'times' ? 'times' : 'seconds';
                const val = item.duration;
                await connection.execute(
                    'INSERT INTO screen_media (screen_id, media_id, play_mode, play_value, display_order) VALUES (?, ?, ?, ?, ?)',
                    [screenId, item.mediaId, mode, val, item.order !== undefined ? item.order : idx]
                );
            }
        }

        await connection.commit();
        res.json({ success: true });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        connection.release();
    }
});

app.delete('/api/screens/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('DELETE FROM screens WHERE id = ? AND restaurant_id = ?', [req.params.id, req.user.restaurantId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SCHEDULES ROUTES ---

app.get('/api/schedules', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM schedules WHERE restaurant_id = ?',
            [req.user.restaurantId]
        );
        
        const schedules = rows.map(s => ({
            id: s.id.toString(),
            screenId: s.screen_id.toString(),
            repeatType: s.repeat_type === 'date' ? 'once' : s.repeat_type, // Map 'date' to 'once'
            startTime: s.start_time.substring(0, 5), // Remove seconds
            endTime: s.end_time.substring(0, 5),
            allDay: false, // DB doesn't have allDay col, infer from 00:00-23:59 if needed
            days: s.days_of_week ? JSON.parse(s.days_of_week) : [],
            specificDate: s.date ? new Date(s.date).toISOString().split('T')[0] : undefined,
            priority: s.priority,
            active: true
        }));
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/schedules', authenticateToken, async (req, res) => {
    const s = req.body;
    try {
        const repeatType = s.repeatType === 'once' ? 'date' : s.repeatType;
        const [result] = await pool.execute(
            'INSERT INTO schedules (restaurant_id, user_id, screen_id, repeat_type, days_of_week, date, start_time, end_time, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                req.user.restaurantId, req.user.id, s.screenId, repeatType, 
                JSON.stringify(s.days || []), s.specificDate || null, s.startTime, s.endTime, s.priority
            ]
        );
        res.json({ id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/schedules/:id', authenticateToken, async (req, res) => {
    try {
        await pool.execute('DELETE FROM schedules WHERE id = ? AND restaurant_id = ?', [req.params.id, req.user.restaurantId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PHYSICAL TVs ROUTES ---

app.post('/api/tvs/heartbeat', async (req, res) => {
    try {
        const { deviceId } = req.body;
        if (!deviceId) return res.status(400).json({ error: 'deviceId required' });
        
        const clientIP = getClientIP(req);
        const userAgent = req.headers['user-agent'] || 'unknown';
        const androidTV = isAndroidTV(userAgent);
        
        // Update last_seen_at, IP address, user agent, and Android TV status for hardware_tvs
        try {
            await pool.execute(
                'UPDATE hardware_tvs SET last_seen_at = NOW(), ip_address = ?, user_agent = ?, is_android_tv = ? WHERE device_id = ?',
                [clientIP, userAgent, androidTV, deviceId]
            );
        } catch (updateErr) {
            // If columns don't exist, try without them
            try {
                await pool.execute(
                    'UPDATE hardware_tvs SET last_seen_at = NOW(), user_agent = ? WHERE device_id = ?',
                    [userAgent, deviceId]
                );
            } catch (updateErr2) {
                // If user_agent column doesn't exist either, just update last_seen_at
                await pool.execute(
                    'UPDATE hardware_tvs SET last_seen_at = NOW() WHERE device_id = ?',
                    [deviceId]
                );
            }
        }
        
        // Also update screen if assigned
        const [devices] = await pool.execute(
            'SELECT assigned_screen_id FROM hardware_tvs WHERE device_id = ?',
            [deviceId]
        );
        
        if (devices.length > 0 && devices[0].assigned_screen_id) {
            await pool.execute(
                'UPDATE screens SET last_seen_at = NOW() WHERE id = ?',
                [devices[0].assigned_screen_id]
            );
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public endpoint for TV to check pairing status by device_id
app.get('/api/tvs/public/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        
        // Check if device exists and is paired
        const [devices] = await pool.execute(
            'SELECT * FROM hardware_tvs WHERE device_id = ?',
            [deviceId]
        );
        
        if (devices.length === 0) {
            // Device not registered yet - return unpaired
            return res.json({ paired: false, tv: null, deviceId });
        }
        
        const device = devices[0];
        
        if (!device.assigned_screen_id) {
            // Device exists but not paired
            return res.json({ paired: false, tv: null, deviceId });
        }
        
        // Get assigned screen
        const [screens] = await pool.execute(
            'SELECT * FROM screens WHERE id = ?',
            [device.assigned_screen_id]
        );
        
        if (screens.length === 0) {
            return res.json({ paired: false, tv: null, deviceId });
        }
        
        const screen = screens[0];
        
        // Update last seen
        await pool.execute(
            'UPDATE hardware_tvs SET last_seen_at = NOW() WHERE device_id = ?',
            [deviceId]
        );
        
        res.json({
            paired: true,
            tv: {
                id: device.device_id,
                device_id: device.device_id,
                name: screen.name,
                assignedScreenId: screen.id.toString(),
                assignedScreenCode: screen.screen_code,
                lastSeen: device.last_seen_at ? new Date(device.last_seen_at).getTime() : Date.now(),
                status: 'online'
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper function to get client IP address (handles proxies and load balancers)
const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
           'unknown';
};

// Helper function to detect Android TV from user agent
const isAndroidTV = (userAgent) => {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    // Android TV detection patterns
    return ua.includes('android') && (
        ua.includes('tv') || 
        ua.includes('aftb') || // Amazon Fire TV
        ua.includes('aftm') || // Amazon Fire TV Stick
        ua.includes('afts') || // Amazon Fire TV Stick
        ua.includes('afte') || // Amazon Fire TV Edition
        ua.includes('afta') || // Amazon Fire TV
        ua.includes('nexus player') ||
        ua.includes('nvidia shield') ||
        ua.includes('mi box') ||
        ua.includes('mibox') ||
        ua.includes('androidtv') ||
        ua.includes('smart-tv') ||
        ua.includes('smarttv')
    );
};

// Helper function to generate short tv_id (user-facing code)
/** @returns {string} */
const generateTvId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
    let result = 'TV-';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Public endpoint to register device (with deduplication)
app.post('/api/tvs/register', async (req, res) => {
    try {
        const { deviceUid, installationId, macHash } = req.body;
        
        if (!deviceUid) {
            // Backward compatibility: if old deviceId format is sent
            const { deviceId } = req.body;
            if (!deviceId) return res.status(400).json({ error: 'deviceUid or deviceId required' });
            // Use deviceId as deviceUid for migration
            return handleLegacyRegistration(deviceId, req, res);
        }
        
        const clientIP = getClientIP(req);
        const userAgent = req.headers['user-agent'] || 'unknown';
        const androidTV = isAndroidTV(userAgent);
        const newInstallationId = installationId || `install_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        
        // DEDUPLICATION LOGIC: Check if device_uid already exists
        let [existing] = await pool.execute(
            'SELECT * FROM hardware_tvs WHERE device_uid = ?',
            [deviceUid]
        );
        
        if (existing.length > 0) {
            // Case B: Device exists (reinstall detected)
            const existingDevice = existing[0];
            const isReinstall = existingDevice.installation_id !== newInstallationId;
            
            // Update device with new installation_id and current info
            try {
                await pool.execute(
                    `UPDATE hardware_tvs 
                     SET installation_id = ?, 
                         last_seen_at = NOW(), 
                         ip_address = ?, 
                         user_agent = ?, 
                         is_android_tv = ?,
                         mac_hash = COALESCE(?, mac_hash)
                     WHERE device_uid = ?`,
                    [newInstallationId, clientIP, userAgent, androidTV, macHash, deviceUid]
                );
            } catch (updateErr) {
                // Fallback if columns don't exist
                try {
                    await pool.execute(
                        'UPDATE hardware_tvs SET installation_id = ?, last_seen_at = NOW() WHERE device_uid = ?',
                        [newInstallationId, deviceUid]
                    );
                } catch (updateErr2) {
                    await pool.execute(
                        'UPDATE hardware_tvs SET last_seen_at = NOW() WHERE device_uid = ?',
                        [deviceUid]
                    );
                }
            }
            
            // Get updated device info
            [existing] = await pool.execute(
                'SELECT * FROM hardware_tvs WHERE device_uid = ?',
                [deviceUid]
            );
            const device = existing[0];
            
            console.log(`[TV Registration] Existing device reconnected: ${deviceUid}${isReinstall ? ' (REINSTALL DETECTED)' : ''}`);
            
            return res.json({ 
                success: true, 
                deviceUid,
                tvId: device.tv_id || device.device_id,
                registered: false, 
                existing: true,
                isReinstall,
                isAndroidTV: androidTV,
                isManual: device.is_manual === 1 || device.is_manual === true,
                assignedScreenId: device.assigned_screen_id ? device.assigned_screen_id.toString() : null
            });
        }
        
        // Case A: New device (first time)
        // Generate short tv_id for user-facing display
        let tvId = generateTvId();
        
        // Ensure tv_id is unique
        let [tvIdCheck] = await pool.execute(
            'SELECT * FROM hardware_tvs WHERE tv_id = ?',
            [tvId]
        );
        let attempts = 0;
        while (tvIdCheck.length > 0 && attempts < 10) {
            tvId = generateTvId();
            [tvIdCheck] = await pool.execute(
                'SELECT * FROM hardware_tvs WHERE tv_id = ?',
                [tvId]
            );
            attempts++;
        }
        
        // Register new device
        try {
            await pool.execute(
                `INSERT INTO hardware_tvs 
                 (device_uid, device_id, installation_id, tv_id, mac_hash, last_seen_at, ip_address, user_agent, is_android_tv) 
                 VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
                [deviceUid, deviceUid.substring(0, 50), newInstallationId, tvId, macHash, clientIP, userAgent, androidTV]
            );
        } catch (insertErr) {
            // Fallback if new columns don't exist
            if (insertErr.code === 'ER_BAD_FIELD_ERROR') {
                try {
                    await pool.execute(
                        'INSERT INTO hardware_tvs (device_id, last_seen_at, is_android_tv) VALUES (?, NOW(), ?)',
                        [deviceUid.substring(0, 50), androidTV]
                    );
                } catch (insertErr2) {
                    await pool.execute(
                        'INSERT INTO hardware_tvs (device_id, last_seen_at) VALUES (?, NOW())',
                        [deviceUid.substring(0, 50)]
                    );
                }
            } else if (insertErr.code === 'ER_DUP_ENTRY') {
                // Race condition - device was just registered
                [existing] = await pool.execute(
                    'SELECT * FROM hardware_tvs WHERE device_uid = ?',
                    [deviceUid]
                );
                if (existing.length > 0) {
                    return res.json({ 
                        success: true, 
                        deviceUid,
                        tvId: existing[0].tv_id || existing[0].device_id,
                        registered: false, 
                        existing: true,
                        isAndroidTV: androidTV
                    });
                }
            } else {
                throw insertErr;
            }
        }
        
        console.log(`[TV Registration] New device registered: ${deviceUid} (tv_id: ${tvId}) from IP: ${clientIP}`);
        res.json({ 
            success: true, 
            deviceUid,
            tvId,
            registered: true, 
            isAndroidTV: androidTV,
            isManual: false
        });
    } catch (err) {
        console.error('[TV Registration Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// Legacy registration handler (for backward compatibility)
const handleLegacyRegistration = async (deviceId, req, res) => {
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const androidTV = isAndroidTV(userAgent);
    
    // Check if device already exists (legacy check by device_id)
    const [existing] = await pool.execute(
        'SELECT * FROM hardware_tvs WHERE device_id = ?',
        [deviceId]
    );
    
    if (existing.length > 0) {
        try {
            await pool.execute(
                'UPDATE hardware_tvs SET last_seen_at = NOW(), ip_address = ?, user_agent = ?, is_android_tv = ? WHERE device_id = ?',
                [clientIP, userAgent, androidTV, deviceId]
            );
        } catch (updateErr) {
            await pool.execute(
                'UPDATE hardware_tvs SET last_seen_at = NOW() WHERE device_id = ?',
                [deviceId]
            );
        }
        return res.json({ success: true, deviceId, registered: false, existing: true, isAndroidTV: androidTV });
    }
    
    // Register new device (legacy)
    try {
        await pool.execute(
            'INSERT INTO hardware_tvs (device_id, last_seen_at, ip_address, user_agent, is_android_tv) VALUES (?, NOW(), ?, ?, ?)',
            [deviceId, clientIP, userAgent, androidTV]
        );
    } catch (insertErr) {
        if (insertErr.code === 'ER_BAD_FIELD_ERROR') {
            await pool.execute(
                'INSERT INTO hardware_tvs (device_id, last_seen_at) VALUES (?, NOW())',
                [deviceId]
            );
        } else {
            throw insertErr;
        }
    }
    
    console.log(`[TV Registration] New device registered (legacy): ${deviceId}`);
    res.json({ success: true, deviceId, registered: true, isAndroidTV: androidTV });
};

// Public endpoint to validate and assign screen code manually
app.post('/api/tvs/assign-screen-code', async (req, res) => {
    try {
        const { deviceId, screenCode } = req.body;
        
        // Validate input
        if (!deviceId || !screenCode) {
            return res.status(400).json({ error: 'deviceId and screenCode are required' });
        }
        
        const normalizedScreenCode = screenCode.trim().toUpperCase();
        
        // Find screen by code
        const [screens] = await pool.execute(
            'SELECT * FROM screens WHERE screen_code = ?',
            [normalizedScreenCode]
        );
        
        if (screens.length === 0) {
            return res.status(404).json({ 
                error: 'Screen code not found',
                message: `No screen found with code: ${normalizedScreenCode}. Please check the code and try again.`
            });
        }
        
        const screen = screens[0];
        
        // Check if device exists
        const [devices] = await pool.execute(
            'SELECT * FROM hardware_tvs WHERE device_id = ?',
            [deviceId]
        );
        
        if (devices.length === 0) {
            // Register device first
            await pool.execute(
                'INSERT INTO hardware_tvs (device_id, restaurant_id, assigned_screen_id, assigned_screen_code, last_seen_at) VALUES (?, ?, ?, ?, NOW())',
                [deviceId, screen.restaurant_id, screen.id, normalizedScreenCode]
            );
        } else {
            // Update existing device
            await pool.execute(
                'UPDATE hardware_tvs SET restaurant_id = ?, assigned_screen_id = ?, assigned_screen_code = ?, last_seen_at = NOW() WHERE device_id = ?',
                [screen.restaurant_id, screen.id, normalizedScreenCode, deviceId]
            );
        }
        
        res.json({ 
            success: true, 
            screenCode: normalizedScreenCode,
            screenId: screen.id.toString(),
            screenName: screen.name,
            message: `Successfully paired device to screen: ${screen.name}`
        });
    } catch (err) {
        console.error('Assign screen code error:', err);
        res.status(500).json({ 
            error: err.message || 'Failed to assign screen code',
            message: 'Database error occurred. Please try again or contact support.'
        });
    }
});

// Public endpoint for TV to get screen data
app.get('/api/screens/public/:screenCode', async (req, res) => {
    try {
        const { screenCode } = req.params;
        const [screens] = await pool.execute(
            'SELECT * FROM screens WHERE screen_code = ?',
            [screenCode]
        );
        
        if (screens.length === 0) {
            return res.status(404).json({ error: 'Screen not found' });
        }
        
        const screen = screens[0];
        
        // Get playlist items
        const [playlistItems] = await pool.execute(
            `SELECT sm.*, m.file_path, m.file_type, m.source 
             FROM screen_media sm 
             JOIN media m ON sm.media_id = m.id 
             WHERE sm.screen_id = ? 
             ORDER BY sm.display_order ASC`,
            [screen.id]
        );

        const playlist = playlistItems.map((item, idx) => ({
            id: item.id.toString(),
            mediaId: item.media_id.toString(),
            duration: item.play_value || 10,
            order: item.display_order !== null && item.display_order !== undefined ? item.display_order : idx,
            playbackConfig: {
                mode: item.play_mode === 'seconds' ? 'duration' : 'times',
                duration: item.play_value,
                scheduleType: 'always'
            }
        })).sort((a, b) => a.order - b.order);

        // Get media items
        const mediaIds = playlist.map(p => p.mediaId);
        let media = [];
        if (mediaIds.length > 0) {
            const placeholders = mediaIds.map(() => '?').join(',');
            const [mediaRows] = await pool.execute(
                `SELECT * FROM media WHERE id IN (${placeholders})`,
                mediaIds
            );
            
            media = mediaRows.map((row) => {
                // Normalize file_type to match MediaType enum
                let mediaType = row.file_type;
                if (mediaType === 'image') mediaType = 'image';
                else if (mediaType === 'video') mediaType = 'video';
                else if (mediaType === 'pdf') mediaType = 'pdf';
                else if (mediaType === 'gif') mediaType = 'gif';
                
                return {
                    id: row.id.toString(),
                    url: row.source === 'upload' ? `${BASE_URL}/${row.file_path}` : row.file_path,
                    name: row.file_name,
                    type: mediaType,
                    size_mb: parseFloat(row.file_size_mb) || 0,
                    duration: row.duration || 10,
                    createdAt: new Date(row.created_at).getTime(),
                    thumbnail_url: row.source === 'upload' ? `${BASE_URL}/${row.file_path}` : row.file_path,
                    normalized_format: row.file_type === 'image' ? 'jpg' : row.file_type === 'video' ? 'mp4' : row.file_type === 'pdf' ? 'pdf' : 'jpg',
                    sourceProvider: row.source === 'upload' ? undefined : row.source
                };
            });
        }

        res.json({
            id: screen.id.toString(),
            screenCode: screen.screen_code,
            name: screen.name,
            orientation: screen.orientation === 'horizontal' ? 'landscape' : 'portrait',
            aspectRatio: screen.aspect_ratio,
            displayMode: screen.display_mode === 'fit' ? 'contain' : screen.display_mode,
            playlist: playlist,
            media: media,
            createdAt: new Date(screen.created_at).getTime(),
            lastPing: screen.last_seen_at ? new Date(screen.last_seen_at).getTime() : undefined
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard endpoint to assign screen to device (by device_id)
app.post('/api/tvs/:deviceId/assign', authenticateToken, async (req, res) => {
    try {
        const { screenId } = req.body;
        const deviceId = req.params.deviceId;
        
        // Get screen info if screenId provided
        let screen = null;
        let restaurantId = req.user.restaurantId;
        
        if (screenId) {
            const [screens] = await pool.execute(
                'SELECT * FROM screens WHERE id = ? AND restaurant_id = ?',
                [screenId, restaurantId]
            );
            
            if (screens.length === 0) {
                return res.status(404).json({ error: 'Screen not found' });
            }
            
            screen = screens[0];
        }
        
        // Check if device exists
        const [devices] = await pool.execute(
            'SELECT * FROM hardware_tvs WHERE device_id = ?',
            [deviceId]
        );
        
        if (devices.length === 0) {
            // Register device first
            await pool.execute(
                'INSERT INTO hardware_tvs (device_id, restaurant_id, assigned_screen_id, assigned_screen_code, last_seen_at) VALUES (?, ?, ?, ?, NOW())',
                [deviceId, restaurantId, screenId || null, screen ? screen.screen_code : null]
            );
        } else {
            // Update existing device
            await pool.execute(
                'UPDATE hardware_tvs SET restaurant_id = ?, assigned_screen_id = ?, assigned_screen_code = ?, last_seen_at = NOW() WHERE device_id = ?',
                [restaurantId, screenId || null, screen ? screen.screen_code : null, deviceId]
            );
        }
        
        res.json({ success: true, deviceId, screenId: screenId || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard endpoint to get all TVs (hardware devices)
// Only returns manually added Android TV devices
app.get('/api/tvs', authenticateToken, async (req, res) => {
    try {
        // Check if columns exist by trying a query that handles both cases
        let devices;
        try {
            // Try with the new columns first
            [devices] = await pool.execute(
                `SELECT ht.*, s.name as screen_name, s.screen_code as screen_code 
                 FROM hardware_tvs ht 
                 LEFT JOIN screens s ON ht.assigned_screen_id = s.id 
                 WHERE (ht.restaurant_id = ? OR ht.restaurant_id IS NULL) 
                 AND (ht.is_manual = TRUE OR ht.is_manual = 1)
                 AND (ht.is_android_tv = TRUE OR ht.is_android_tv = 1)`,
                [req.user.restaurantId]
            );
        } catch (queryErr) {
            // If columns don't exist, return empty array (migration not run yet)
            if (queryErr.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('[TVs API] Migration not run yet - is_manual and is_android_tv columns missing');
                return res.json([]);
            }
            throw queryErr;
        }
        
        const tvs = devices.map(device => ({
            id: device.device_id,
            device_id: device.device_id,
            hardware_id: device.device_id,
            name: device.screen_name || `TV ${device.device_id.substring(0, 8)}`,
            assignedScreenId: device.assigned_screen_id ? device.assigned_screen_id.toString() : undefined,
            assignedScreenCode: device.assigned_screen_code,
            lastSeen: device.last_seen_at ? new Date(device.last_seen_at).getTime() : Date.now(),
            status: device.last_seen_at && (Date.now() - new Date(device.last_seen_at).getTime() < 60000) ? 'online' : 'offline',
            isManual: device.is_manual === 1 || device.is_manual === true,
            isAndroidTV: device.is_android_tv === 1 || device.is_android_tv === true
        }));
        
        res.json(tvs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to remove/delete an Android TV device from management
// Sets is_manual = false so device returns to "unmanaged" state
// Device still exists in DB and can still run Public Player, but won't appear in /tvs
app.delete('/api/tvs/:deviceId', authenticateToken, async (req, res) => {
    try {
        const { deviceId } = req.params;
        const restaurantId = req.user.restaurantId;
        
        // Check if device exists and belongs to this restaurant
        const [devices] = await pool.execute(
            'SELECT * FROM hardware_tvs WHERE device_id = ? AND (restaurant_id = ? OR restaurant_id IS NULL)',
            [deviceId, restaurantId]
        );
        
        if (devices.length === 0) {
            return res.status(404).json({ error: 'TV device not found' });
        }
        
        // Remove from management by setting is_manual = false
        // Device returns to "unmanaged" state but still exists
        try {
            await pool.execute(
                'UPDATE hardware_tvs SET is_manual = FALSE WHERE device_id = ?',
                [deviceId]
            );
        } catch (updateErr) {
            // If is_manual column doesn't exist, fallback to deletion
            if (updateErr.code === 'ER_BAD_FIELD_ERROR') {
                await pool.execute(
                    'DELETE FROM hardware_tvs WHERE device_id = ?',
                    [deviceId]
                );
            } else {
                throw updateErr;
            }
        }
        
        console.log(`[TV Remove] Android TV device removed from management: ${deviceId} by restaurant ${restaurantId}`);
        res.json({ success: true, deviceId, message: 'TV device removed from management. Device still runs but is no longer controlled by this account.' });
    } catch (err) {
        console.error('[TV Remove Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to manually add an Android TV device
app.post('/api/tvs/manual-add', authenticateToken, async (req, res) => {
    try {
        const { deviceId, name } = req.body;
        if (!deviceId) return res.status(400).json({ error: 'deviceId is required' });
        
        const restaurantId = req.user.restaurantId;
        
        // Check if device already exists
        const [existing] = await pool.execute(
            'SELECT * FROM hardware_tvs WHERE device_id = ?',
            [deviceId]
        );
        
        if (existing.length > 0) {
            // Update existing device to mark as manual and Android TV
            try {
                await pool.execute(
                    'UPDATE hardware_tvs SET restaurant_id = ?, is_manual = TRUE, is_android_tv = TRUE, last_seen_at = NOW() WHERE device_id = ?',
                    [restaurantId, deviceId]
                );
            } catch (updateErr) {
                // If columns don't exist, try without them
                await pool.execute(
                    'UPDATE hardware_tvs SET restaurant_id = ?, last_seen_at = NOW() WHERE device_id = ?',
                    [restaurantId, deviceId]
                );
            }
            return res.json({ 
                success: true, 
                deviceId, 
                message: 'TV device updated and marked as manually added Android TV',
                isAndroidTV: true,
                isManual: true
            });
        }
        
        // Create new device marked as manual Android TV
        try {
            await pool.execute(
                'INSERT INTO hardware_tvs (device_id, restaurant_id, is_manual, is_android_tv, last_seen_at) VALUES (?, ?, TRUE, TRUE, NOW())',
                [deviceId, restaurantId]
            );
        } catch (insertErr) {
            // If columns don't exist, insert without them
            if (insertErr.code === 'ER_BAD_FIELD_ERROR') {
                await pool.execute(
                    'INSERT INTO hardware_tvs (device_id, restaurant_id, last_seen_at) VALUES (?, ?, NOW())',
                    [deviceId, restaurantId]
                );
            } else {
                throw insertErr;
            }
        }
        
        console.log(`[Manual TV Add] Android TV device manually added: ${deviceId} by restaurant ${restaurantId}`);
        res.json({ 
            success: true, 
            deviceId, 
            message: 'Android TV device successfully added',
            isAndroidTV: true,
            isManual: true
        });
    } catch (err) {
        console.error('[Manual TV Add Error]', err);
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN ROUTES ---

// Admin middleware - check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Get system statistics (admin only)
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Total users
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const totalUsers = userCount[0].count;

        // Active screens (screens with last_seen_at in last 5 minutes)
        const [activeScreens] = await pool.execute(
            'SELECT COUNT(*) as count FROM screens WHERE last_seen_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)'
        );
        const activeScreensCount = activeScreens[0].count;

        // Total storage used
        const [storage] = await pool.execute(
            'SELECT SUM(file_size_mb) as total FROM media'
        );
        const totalStorageMB = parseFloat(storage[0].total || 0);

        // Estimated revenue (basic calculation: $9 basic, $29 pro per month)
        const [revenue] = await pool.execute(
            `SELECT 
                SUM(CASE WHEN plan = 'basic' THEN 9 ELSE 0 END) +
                SUM(CASE WHEN plan = 'premium' THEN 19 ELSE 0 END) +
                SUM(CASE WHEN plan = 'enterprise' THEN 29 ELSE 0 END) as total
            FROM restaurants WHERE account_status = 'active'`
        );
        const estimatedRevenue = Math.round(parseFloat(revenue[0].total || 0));

        res.json({
            totalUsers,
            activeScreens: activeScreensCount,
            totalStorageMB: Math.round(totalStorageMB * 100) / 100,
            estimatedRevenue
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT u.id, u.name, u.email, u.role, u.created_at, 
                    r.plan, r.account_status, r.name as restaurant_name
             FROM users u
             JOIN restaurants r ON u.restaurant_id = r.id
             ORDER BY u.created_at DESC`
        );

        const formattedUsers = users.map(user => ({
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            plan: user.plan,
            accountStatus: user.account_status,
            restaurantId: user.restaurant_id?.toString(),
            restaurantName: user.restaurant_name,
            createdAt: new Date(user.created_at).getTime()
        }));

        res.json(formattedUsers);
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get plan requests (admin only)
app.get('/api/admin/plan-requests', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [requests] = await pool.execute(
            `SELECT pr.*, u.name as user_name, u.email as user_email, r.name as restaurant_name
             FROM plan_requests pr
             JOIN users u ON pr.user_id = u.id
             JOIN restaurants r ON pr.restaurant_id = r.id
             ORDER BY pr.created_at DESC`
        );

        const formattedRequests = requests.map(req => ({
            id: req.id.toString(),
            userId: req.user_id.toString(),
            restaurantId: req.restaurant_id.toString(),
            requestedPlan: req.requested_plan,
            status: req.status,
            timestamp: new Date(req.created_at).getTime(),
            userName: req.user_name,
            userEmail: req.user_email,
            restaurantName: req.restaurant_name
        }));

        res.json(formattedRequests);
    } catch (err) {
        console.error('Get plan requests error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create plan request (user)
app.post('/api/plan-request', authenticateToken, async (req, res) => {
    try {
        const { requestedPlan } = req.body;
        
        if (!requestedPlan || !['free', 'basic', 'premium', 'enterprise'].includes(requestedPlan)) {
            return res.status(400).json({ error: 'Invalid plan type' });
        }

        // Check if there's already a pending request
        const [existing] = await pool.execute(
            'SELECT * FROM plan_requests WHERE user_id = ? AND status = "pending"',
            [req.user.id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'You already have a pending plan request' });
        }

        // Create new request
        const [result] = await pool.execute(
            'INSERT INTO plan_requests (user_id, restaurant_id, requested_plan, status) VALUES (?, ?, ?, "pending")',
            [req.user.id, req.user.restaurantId, requestedPlan]
        );

        res.json({ 
            success: true, 
            id: result.insertId.toString(),
            requestedPlan,
            status: 'pending'
        });
    } catch (err) {
        console.error('Create plan request error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Approve plan request (admin only)
app.post('/api/admin/plan-requests/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const requestId = req.params.id;

        // Get the request
        const [requests] = await pool.execute(
            'SELECT * FROM plan_requests WHERE id = ?',
            [requestId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ error: 'Plan request not found' });
        }

        const request = requests[0];

        // Update request status
        await pool.execute(
            'UPDATE plan_requests SET status = "approved", updated_at = NOW() WHERE id = ?',
            [requestId]
        );

        // Update restaurant plan
        await pool.execute(
            'UPDATE restaurants SET plan = ?, updated_at = NOW() WHERE id = ?',
            [request.requested_plan, request.restaurant_id]
        );

        res.json({ success: true, message: 'Plan request approved' });
    } catch (err) {
        console.error('Approve plan request error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Deny plan request (admin only)
app.post('/api/admin/plan-requests/:id/deny', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const requestId = req.params.id;

        // Update request status
        const [result] = await pool.execute(
            'UPDATE plan_requests SET status = "denied", updated_at = NOW() WHERE id = ?',
            [requestId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Plan request not found' });
        }

        res.json({ success: true, message: 'Plan request denied' });
    } catch (err) {
        console.error('Deny plan request error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Railway automatically sets process.env.PORT
// No fallback needed - Railway requires PORT to be set
const PORT = process.env.PORT;
if (!PORT) {
    console.error('❌ PORT environment variable not set. Railway should set this automatically.');
    process.exit(1);
}
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 MENUPI API Server');
    console.log('='.repeat(60));
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);
    console.log(`📅 Deployed: 2025-12-25 (v2.0.0)`);
    console.log(`✅ Code Version: cba96f1`);
    console.log('='.repeat(60));
});
