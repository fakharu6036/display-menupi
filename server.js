
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
// import fetch from 'node-fetch'; // Uncomment if using Node < 18

const app = express();

// CORS Configuration - ONLY allow app.menupi.com and tv.menupi.com
// IMPORTANT: Do NOT add menupi.com or any other domains
const getAllowedOrigins = () => {
    const origins = [];
    
    // Production domains (LOCKED)
    if (process.env.NODE_ENV === 'production') {
        origins.push('https://app.menupi.com');
        origins.push('https://tv.menupi.com');
    } else {
        // Development - allow localhost
        origins.push('http://localhost:3000');
        origins.push('http://localhost:5173');
    }
    
    // Allow additional origins from env if specified (for staging/testing)
    if (process.env.ALLOWED_ORIGINS) {
        const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
        origins.push(...additionalOrigins);
    }
    
    return origins;
};

const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        
        // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
        if (!origin) {
            return callback(null, true);
        }
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Multer Storage with File Validation
const allowedMimeTypes = (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,video/mp4,application/pdf').split(',');
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        // Sanitize filename to prevent path traversal
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, Date.now() + '-' + sanitizedName);
    }
});

const upload = multer({ 
    storage,
    fileFilter,
    limits: { 
        fileSize: maxFileSize,
        files: 1
    }
});

// Database Connection - Optimized for hosting limits
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'u859590789_disys',
    waitForConnections: true,
    connectionLimit: 2, // Reduced to prevent exceeding hourly limit
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

const pool = mysql.createPool(dbConfig);

// Connection error handler
pool.on('error', (err) => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ER_USER_LIMIT_REACHED') {
        console.error('Database connection error:', err.message);
    }
});

// Middleware: Verify Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', async (err, user) => {
        if (err) return res.sendStatus(403);
        
        // Verify user and restaurant still exist and are active
        try {
            const [users] = await pool.execute(
                'SELECT u.id, u.role, u.restaurant_id, r.account_status, r.id as restaurant_exists FROM users u LEFT JOIN restaurants r ON u.restaurant_id = r.id WHERE u.id = ?',
                [user.id]
            );
            
            if (users.length === 0) {
                // User doesn't exist (was deleted)
                return res.status(401).json({ error: 'User account no longer exists' });
            }
            
            const userData = users[0];
            
            // Check if restaurant exists
            if (!userData.restaurant_exists) {
                // Restaurant was deleted
                return res.status(401).json({ error: 'Account has been deleted' });
            }
            
            // Check if restaurant is deleted or suspended
            if (userData.account_status === 'deleted' || userData.account_status === 'suspended') {
                return res.status(403).json({ 
                    error: userData.account_status === 'deleted' 
                        ? 'Account has been deleted' 
                        : 'Account has been suspended' 
                });
            }
            
            // Update req.user with current data (include both formats for compatibility)
            req.user = {
                id: userData.id,
                role: userData.role,
                restaurantId: userData.restaurant_id,
                restaurant_id: userData.restaurant_id  // Keep both for backward compatibility
            };
            
            next();
        } catch (dbErr) {
            console.error('Database error in authenticateToken:', dbErr);
            // If database check fails, still allow the request (fail open for availability)
            // But log the error for monitoring
            req.user = user;
            next();
        }
    });
};

// Helper to Generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, restaurantId: user.restaurant_id, role: user.role }, 
        process.env.JWT_SECRET || 'secret_key', 
        { expiresIn: '5h' }
    );
};

// --- AUTH ROUTES ---

// 1. Local Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if is_verified column exists
        let hasVerificationColumn = true;
        try {
            await pool.execute('SELECT is_verified FROM users LIMIT 1');
        } catch (err) {
            hasVerificationColumn = false;
        }

        const query = hasVerificationColumn
            ? 'SELECT u.*, r.plan, r.account_status, r.name as rest_name FROM users u JOIN restaurants r ON u.restaurant_id = r.id WHERE u.email = ? AND u.auth_method = "local"'
            : 'SELECT u.*, r.plan, r.account_status, r.name as rest_name FROM users u JOIN restaurants r ON u.restaurant_id = r.id WHERE u.email = ? AND u.auth_method = "local"';
        
        const [users] = await pool.execute(query, [email]);

        if (users.length === 0) return res.status(401).json({ error: 'User not found or uses Google Login' });
        
        const user = users[0];
        
        // Check if restaurant is deleted or suspended
        if (user.account_status === 'deleted') {
            return res.status(403).json({ error: 'Account has been deleted' });
        }
        
        if (user.account_status === 'suspended') {
            return res.status(403).json({ error: 'Account has been suspended. Please contact support.' });
        }
        
        const match = await bcrypt.compare(password, user.password);
        
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        // Check if email is verified (only for local auth, Google users are auto-verified)
        if (hasVerificationColumn && user.is_verified === false) {
            return res.status(403).json({ 
                error: 'Please verify your email first. Check your inbox for the verification link.',
                requiresVerification: true
            });
        }

        const token = generateToken(user);

        // Check if avatar_url column exists and get avatar
        let avatarUrl = null;
        try {
            const [userWithAvatar] = await pool.execute('SELECT avatar_url FROM users WHERE id = ?', [user.id]);
            if (userWithAvatar.length > 0) {
                avatarUrl = userWithAvatar[0].avatar_url;
            }
        } catch (err) {
            // Column doesn't exist yet, will be created on first upload
        }

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
                avatarUrl: avatarUrl
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        let errorMessage = 'Server error';
        if (err?.code === 'ECONNREFUSED') {
            errorMessage = 'Database connection failed. Please ensure MySQL is running.';
        } else if (err?.message) {
            errorMessage = err.message;
        }
        res.status(500).json({ error: errorMessage });
    }
});

// Helper: Generate verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Helper: Hash verification token
const hashVerificationToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

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

        // Check if verification columns exist, if not, add them
        try {
            await connection.execute('SELECT is_verified, verification_token, token_expires FROM users LIMIT 1');
        } catch (err) {
            // Columns don't exist, add them
            try {
                await connection.execute('ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER google_id');
                await connection.execute('ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) NULL AFTER is_verified');
                await connection.execute('ALTER TABLE users ADD COLUMN token_expires TIMESTAMP NULL AFTER verification_token');
                await connection.execute('CREATE INDEX idx_verification_token ON users(verification_token)');
            } catch (alterErr) {
                console.warn('Could not add verification columns:', alterErr.message);
            }
        }

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

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const hashedToken = hashVerificationToken(verificationToken);
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        // Create User (unverified by default)
        const [userResult] = await connection.execute(
            'INSERT INTO users (name, restaurant_id, email, password, role, auth_method, is_verified, verification_token, token_expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, restaurantId, email, hashedPassword, 'owner', 'local', false, hashedToken, tokenExpires]
        );

        // Log activity: New Registration
        try {
            await connection.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [restaurantId, userResult.insertId, 'New Registration', `${name} (${email}) signed up`]
            );
        } catch (logErr) {
            // Activity table might not exist yet, ignore
            console.warn('Could not log registration activity:', logErr.message);
        }

        await connection.commit();

        // Generate verification link
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

        // TODO: Send verification email
        // In production, use a service like SendGrid, AWS SES, or Nodemailer
        console.log('Verification link:', verificationLink);
        console.log('Email verification link for', email, ':', verificationLink);

        // Return success but don't auto-login (user needs to verify email first)
        res.json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            verificationLink: verificationLink // Remove this in production, only for development
        });

    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackErr) {
                console.error('Rollback error:', rollbackErr);
            }
        }
        console.error('Registration error:', err);
        
        // Provide user-friendly error messages
        let errorMessage = 'Registration failed';
        if (err?.code === 'ECONNREFUSED') {
            errorMessage = 'Database connection failed. Please ensure MySQL is running and check your database configuration.';
        } else if (err?.code === 'ER_ACCESS_DENIED_ERROR') {
            errorMessage = 'Database access denied. Please check your database credentials.';
        } else if (err?.code === 'ER_BAD_DB_ERROR') {
            errorMessage = 'Database not found. Please create the database first.';
        } else if (err?.message) {
            errorMessage = err.message;
        }
        
        res.status(500).json({ error: errorMessage });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Email Verification Endpoint
app.get('/api/verify-email', async (req, res) => {
    const { token } = req.query;
    
    if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
    }

    try {
        // Check if verification columns exist
        try {
            await pool.execute('SELECT is_verified, verification_token, token_expires FROM users LIMIT 1');
        } catch (err) {
            // Columns don't exist, add them
            try {
                await pool.execute('ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER google_id');
                await pool.execute('ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) NULL AFTER is_verified');
                await pool.execute('ALTER TABLE users ADD COLUMN token_expires TIMESTAMP NULL AFTER verification_token');
                await pool.execute('CREATE INDEX idx_verification_token ON users(verification_token)');
            } catch (alterErr) {
                console.warn('Could not add verification columns:', alterErr.message);
            }
        }

        // Hash the received token
        const hashedToken = hashVerificationToken(token);

        // Find user with matching verification token
        const [users] = await pool.execute(
            'SELECT id, email, token_expires, is_verified FROM users WHERE verification_token = ?',
            [hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired verification link' });
        }

        const user = users[0];

        // Check if token has expired
        if (user.token_expires && new Date(user.token_expires) < new Date()) {
            return res.status(400).json({ error: 'Verification link has expired. Please request a new one.' });
        }

        // Check if already verified
        if (user.is_verified) {
            return res.json({ 
                success: true, 
                message: 'Email already verified. You can now log in.',
                alreadyVerified: true 
            });
        }

        // Verify the user - DELETE token after verification (security requirement)
        await pool.execute(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL, token_expires = NULL WHERE id = ?',
            [user.id]
        );

        res.json({ 
            success: true, 
            message: 'Email verified successfully! You can now log in.',
            email: user.email
        });

    } catch (err) {
        console.error('Email verification error:', err);
        res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
});

// Resend Verification Email Endpoint
// Rate limiting: Store last resend time in memory (in production, use Redis or database)
const resendRateLimit = new Map(); // email -> { count: number, lastResend: Date }

app.post('/api/resend-verification', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Check if verification columns exist
        try {
            await pool.execute('SELECT is_verified, verification_token, token_expires FROM users LIMIT 1');
        } catch (err) {
            // Columns don't exist, add them
            try {
                await pool.execute('ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER google_id');
                await pool.execute('ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) NULL AFTER is_verified');
                await pool.execute('ALTER TABLE users ADD COLUMN token_expires TIMESTAMP NULL AFTER verification_token');
                await pool.execute('CREATE INDEX idx_verification_token ON users(verification_token)');
            } catch (alterErr) {
                console.warn('Could not add verification columns:', alterErr.message);
            }
        }

        // Find user by email
        const [users] = await pool.execute(
            'SELECT id, email, is_verified FROM users WHERE email = ? AND auth_method = "local"',
            [email]
        );

        if (users.length === 0) {
            // Don't reveal if email exists (security best practice)
            return res.json({ 
                success: true, 
                message: 'If an account exists with this email, a verification link has been sent.' 
            });
        }

        const user = users[0];

        // Check if user is already verified
        if (user.is_verified) {
            return res.json({ 
                success: true, 
                message: 'Email is already verified. You can log in.',
                alreadyVerified: true
            });
        }

        // Rate limiting: Max 3 requests per hour per email
        const now = new Date();
        const rateLimitKey = email.toLowerCase();
        const rateLimitData = resendRateLimit.get(rateLimitKey);
        
        if (rateLimitData) {
            const timeSinceLastResend = now - rateLimitData.lastResend;
            const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
            
            if (rateLimitData.count >= 3 && timeSinceLastResend < oneHour) {
                const minutesLeft = Math.ceil((oneHour - timeSinceLastResend) / (60 * 1000));
                return res.status(429).json({ 
                    error: `Too many requests. Please wait ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''} before requesting another verification email.` 
                });
            }
            
            // Reset count if more than 1 hour has passed
            if (timeSinceLastResend >= oneHour) {
                rateLimitData.count = 0;
            }
            
            rateLimitData.count += 1;
            rateLimitData.lastResend = now;
        } else {
            resendRateLimit.set(rateLimitKey, { count: 1, lastResend: now });
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const hashedToken = hashVerificationToken(verificationToken);
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

        // Update user with new token and expiry
        await pool.execute(
            'UPDATE users SET verification_token = ?, token_expires = ? WHERE id = ?',
            [hashedToken, tokenExpires, user.id]
        );

        // Generate verification link
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

        // TODO: Send verification email
        // In production, use a service like SendGrid, AWS SES, or Nodemailer
        console.log('Resend verification link:', verificationLink);
        console.log('Resend verification email for', email, ':', verificationLink);

        res.json({ 
            success: true, 
            message: 'Verification email sent! Please check your inbox.',
            verificationLink: verificationLink // Remove this in production, only for development
        });

    } catch (err) {
        console.error('Resend verification error:', err);
        res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
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

                // Log activity: New Registration (Google)
                try {
                    await connection.execute(
                        'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                        [restaurantId, userResult.insertId, 'New Registration', `${name} (${email}) signed up via Google`]
                    );
                } catch (logErr) {
                    // Activity table might not exist yet, ignore
                    console.warn('Could not log Google registration activity:', logErr.message);
                }

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
        
        const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        const media = rows.map(row => {
            // Convert MySQL datetime to JavaScript timestamp
            // MySQL returns dates - handle all possible formats
            const createdDate = row.created_at;
            let createdAt;
            
            try {
                if (createdDate instanceof Date) {
                    // Already a Date object - getTime() returns milliseconds since epoch
                    createdAt = createdDate.getTime();
                } else if (typeof createdDate === 'string') {
                    // Parse string date (MySQL format: YYYY-MM-DD HH:mm:ss)
                    // MySQL dates are in server timezone, Date constructor interprets them correctly
                    const parsed = new Date(createdDate);
                    if (isNaN(parsed.getTime())) {
                        // Try parsing as ISO string or other formats
                        createdAt = Date.parse(createdDate);
                        if (isNaN(createdAt)) {
                            throw new Error('Invalid date format');
                        }
                    } else {
                        createdAt = parsed.getTime();
                    }
                } else if (createdDate) {
                    // Try to parse as number (timestamp)
                    createdAt = typeof createdDate === 'number' ? createdDate : parseInt(createdDate, 10);
                    if (isNaN(createdAt)) {
                        throw new Error('Invalid timestamp');
                    }
                } else {
                    throw new Error('No created_at value');
                }
            } catch (err) {
                // Fallback to current time if invalid
                console.warn(`Invalid created_at for media ${row.id}:`, createdDate, err.message);
                createdAt = Date.now();
            }
            
            return {
                id: row.id.toString(),
                url: row.source === 'upload' ? `${baseUrl}/${row.file_path}` : row.file_path,
                name: row.file_name,
                type: row.file_type,
                size: row.file_size_mb + ' MB',
                duration: 10, // Default, not stored in DB currently
                createdAt: createdAt,
                sourceProvider: row.source === 'upload' ? undefined : row.source
            };
        });
        
        res.json(media);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/media', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded or file validation failed' });
        }

        // Additional validation
        if (file.size > maxFileSize) {
            fs.unlinkSync(file.path); // Delete oversized file
            return res.status(400).json({ error: `File size exceeds maximum allowed size of ${maxFileSize / (1024 * 1024)}MB` });
        }

        const typeMap = {
            'image/jpeg': 'image', 'image/png': 'image', 'image/gif': 'gif',
            'video/mp4': 'video', 'application/pdf': 'pdf'
        };
        const fileType = typeMap[file.mimetype] || 'image';
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

        // For videos, try to extract duration (basic approach - in production, use ffmpeg)
        let duration = null;
        if (fileType === 'video') {
            // Note: For production, use ffprobe/ffmpeg to get accurate duration
            // This is a placeholder - actual duration should be extracted server-side
            duration = 30; // Default 30 seconds for videos
        }

        const [result] = await pool.execute(
            'INSERT INTO media (user_id, restaurant_id, file_name, file_path, file_type, file_size_mb, source) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, req.user.restaurantId, file.originalname, file.path.replace(/\\/g, '/'), fileType, sizeMb, 'upload']
        );

        // Log activity: Media Uploaded
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [req.user.restaurantId, req.user.id, 'Media Uploaded', `File "${file.originalname}" uploaded (${fileType}, ${sizeMb} MB)`]
            );
        } catch (logErr) {
            // Activity table might not exist yet, ignore
            console.warn('Could not log media upload activity:', logErr.message);
        }

        res.json({ success: true, id: result.insertId, duration: duration });
    } catch (err) {
        // Clean up file if database insert fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: err.message });
    }
});

// Error handler for multer errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large' });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
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

// Public endpoint for TV player to fetch screen by code (no auth required)
app.get('/api/public/screen/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const [screens] = await pool.execute(
            `SELECT s.*, r.plan, r.account_status 
             FROM screens s 
             JOIN restaurants r ON s.restaurant_id = r.id 
             WHERE s.screen_code = ?`,
            [code.toUpperCase()]
        );

        if (screens.length === 0) {
            return res.status(404).json({ error: 'Screen not found' });
        }

        const screen = screens[0];
        
        // Check if screen is archived or disabled
        const isArchived = screen.status === 'archived' || screen.is_archived === 1 || screen.is_archived === true;
        const isDisabled = screen.is_disabled === 1 || screen.is_disabled === true;
        
        // Determine branding requirement based on plan
        const plan = screen.plan || 'free';
        const requiresBranding = plan === 'free';
        
        // Player controls configuration
        const playerConfig = {
            branding: requiresBranding,
            controls: {
                fullscreen: true,
                reload: true,
                showCode: true
            }
        };

        // If screen is archived or disabled, return special state
        if (isArchived || isDisabled) {
            return res.json({
                id: screen.id,
                screenCode: screen.screen_code,
                name: screen.name,
                status: isArchived ? 'archived' : 'disabled',
                accountStatus: screen.account_status,
                plan: plan,
                config: playerConfig,
                playlist: [], // Empty playlist for archived/disabled screens
                message: isArchived 
                    ? 'This screen is currently archived. Please reactivate your plan to restore playback.'
                    : 'This screen has been disabled by an administrator.'
            });
        }
        
        // Fetch playlist items
        let playlistItems;
        try {
            [playlistItems] = await pool.execute(
                `SELECT sm.*, m.file_path, m.file_type, m.source, m.file_name
                 FROM screen_media sm 
                 JOIN media m ON sm.media_id = m.id 
                 WHERE sm.screen_id = ?
                 ORDER BY sm.display_order ASC, sm.id ASC`,
                [screen.id]
            );
        } catch (orderErr) {
            // Fallback if display_order column doesn't exist
            [playlistItems] = await pool.execute(
                `SELECT sm.*, m.file_path, m.file_type, m.source, m.file_name
                 FROM screen_media sm 
                 JOIN media m ON sm.media_id = m.id 
                 WHERE sm.screen_id = ?
                 ORDER BY sm.id ASC`,
                [screen.id]
            );
        }

        // Fetch all media for this restaurant
        const [mediaRows] = await pool.execute(
            'SELECT * FROM media WHERE restaurant_id = ?',
            [screen.restaurant_id]
        );

        const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        
        const playlist = playlistItems.map(item => ({
            id: item.id.toString(),
            mediaId: item.media_id.toString(),
            duration: item.play_value || 10,
            order: item.display_order || 0,
            playbackConfig: {
                mode: item.play_mode === 'seconds' ? 'duration' : 'times',
                duration: item.play_value,
                scheduleType: 'always'
            }
        }));

        const media = mediaRows.map(row => ({
            id: row.id.toString(),
            url: row.source === 'upload' ? `${baseUrl}/${row.file_path}` : row.file_path,
            name: row.file_name,
            type: row.file_type,
            size: row.file_size_mb + ' MB',
            duration: 10,
            createdAt: new Date(row.created_at).getTime(),
            sourceProvider: row.source === 'upload' ? undefined : row.source
        }));

        // Get updated_at timestamp (or use created_at if updated_at doesn't exist)
        const updatedAt = screen.updated_at ? new Date(screen.updated_at).getTime() : new Date(screen.created_at).getTime();
        
        res.json({
            id: screen.id.toString(),
            screenCode: screen.screen_code,
            name: screen.name,
            orientation: screen.orientation === 'horizontal' ? 'landscape' : 'portrait',
            aspectRatio: screen.aspect_ratio,
            displayMode: screen.display_mode === 'fit' ? 'contain' : screen.display_mode,
            playlist: playlist,
            media: media, // Include all media for this restaurant
            createdAt: new Date(screen.created_at).getTime(),
            updatedAt: updatedAt, // Version timestamp for cache invalidation
            lastPing: screen.last_seen_at ? new Date(screen.last_seen_at).getTime() : undefined,
            // Backend-driven configuration
            plan: plan,
            config: playerConfig
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/screens', authenticateToken, async (req, res) => {
    try {
        if (!req.user || !req.user.restaurantId) {
            return res.status(401).json({ error: 'Unauthorized: Invalid user session' });
        }

        const [screens] = await pool.execute(
            'SELECT * FROM screens WHERE restaurant_id = ?',
            [req.user.restaurantId]
        );

        // Fetch playlist items for each screen
        const result = await Promise.all(screens.map(async (screen) => {
            try {
                // Try with display_order first, fallback to id if column doesn't exist
                let playlistItems;
                try {
                    [playlistItems] = await pool.execute(
                        `SELECT sm.*, m.file_path, m.file_type, m.source 
                         FROM screen_media sm 
                         JOIN media m ON sm.media_id = m.id 
                         WHERE sm.screen_id = ?
                         ORDER BY sm.display_order ASC, sm.id ASC`,
                        [screen.id]
                    );
                } catch (orderErr) {
                    // Fallback if display_order column doesn't exist
                    [playlistItems] = await pool.execute(
                        `SELECT sm.*, m.file_path, m.file_type, m.source 
                         FROM screen_media sm 
                         JOIN media m ON sm.media_id = m.id 
                         WHERE sm.screen_id = ?
                         ORDER BY sm.id ASC`,
                        [screen.id]
                    );
                }

                const playlist = playlistItems.map(item => ({
                    id: item.id.toString(),
                    mediaId: item.media_id.toString(),
                    duration: item.play_value || 10,
                    order: item.display_order || 0,
                    playbackConfig: {
                        mode: item.play_mode === 'seconds' ? 'duration' : 'times',
                        duration: item.play_value,
                        scheduleType: 'always'
                    }
                }));

                return {
                    id: screen.id.toString(),
                    screenCode: screen.screen_code,
                    name: screen.name,
                    orientation: screen.orientation === 'horizontal' ? 'landscape' : 'portrait',
                    aspectRatio: screen.aspect_ratio || '16:9',
                    displayMode: screen.display_mode === 'fit' ? 'contain' : (screen.display_mode || 'contain'),
                    playlist: playlist,
                    createdAt: new Date(screen.created_at).getTime(),
                    lastPing: screen.last_seen_at ? new Date(screen.last_seen_at).getTime() : undefined
                };
            } catch (playlistErr) {
                console.error(`Error fetching playlist for screen ${screen.id}:`, playlistErr);
                // Return screen without playlist if there's an error
                return {
                    id: screen.id.toString(),
                    screenCode: screen.screen_code,
                    name: screen.name,
                    orientation: screen.orientation === 'horizontal' ? 'landscape' : 'portrait',
                    aspectRatio: screen.aspect_ratio || '16:9',
                    displayMode: screen.display_mode === 'fit' ? 'contain' : (screen.display_mode || 'contain'),
                    playlist: [],
                    createdAt: new Date(screen.created_at).getTime(),
                    lastPing: screen.last_seen_at ? new Date(screen.last_seen_at).getTime() : undefined
                };
            }
        }));

        res.json(result);
    } catch (err) {
        console.error('Error in /api/screens:', err);
        res.status(500).json({ error: err.message, details: err.stack });
    }
});

app.post('/api/screens', authenticateToken, async (req, res) => {
    const { name, orientation, aspectRatio, screenCode } = req.body;
    try {
        // Get restaurant plan to check screen limits
        const [restaurantRows] = await pool.execute(
            'SELECT plan FROM restaurants WHERE id = ?',
            [req.user.restaurantId]
        );
        
        if (restaurantRows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        
        const plan = restaurantRows[0].plan;
        
        // Plan limits: free=1, basic=3, pro=-1 (unlimited)
        const planLimits = {
            'free': 1,
            'basic': 3,
            'pro': -1
        };
        
        const maxScreens = planLimits[plan] || 1;
        
        // Check screen limit (skip if unlimited)
        if (maxScreens !== -1) {
            const [screenCountRows] = await pool.execute(
                'SELECT COUNT(*) as count FROM screens WHERE restaurant_id = ?',
                [req.user.restaurantId]
            );
            
            const currentCount = screenCountRows[0].count;
            
            if (currentCount >= maxScreens) {
                return res.status(403).json({ 
                    error: `Screen limit reached. Your ${plan} plan allows ${maxScreens} screen${maxScreens > 1 ? 's' : ''}. Please upgrade to create more screens.` 
                });
            }
        }
        
        // Create the screen
        const [result] = await pool.execute(
            'INSERT INTO screens (user_id, restaurant_id, name, orientation, aspect_ratio, screen_code, template) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, req.user.restaurantId, name, orientation === 'landscape' ? 'horizontal' : 'vertical', aspectRatio, screenCode, 'default']
        );
        
        // Log activity: Screen Created
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [req.user.restaurantId, req.user.id, 'Screen Created', `Screen "${name}" created with code ${screenCode}`]
            );
        } catch (logErr) {
            // Activity table might not exist yet, ignore
            console.warn('Could not log screen creation activity:', logErr.message);
        }
        
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

        // Ensure updated_at column exists
        try {
            await connection.execute('SELECT updated_at FROM screens LIMIT 1');
        } catch (err) {
            // Column doesn't exist, add it
            try {
                await connection.execute('ALTER TABLE screens ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
            } catch (alterErr) {
                console.warn('Could not add updated_at column:', alterErr.message);
            }
        }

        // Update Screen Details
        if (updates.name) {
            try {
                await connection.execute(
                    'UPDATE screens SET name = ?, orientation = ?, aspect_ratio = ?, updated_at = NOW() WHERE id = ? AND restaurant_id = ?',
                    [updates.name, updates.orientation === 'landscape' ? 'horizontal' : 'vertical', updates.aspectRatio, screenId, req.user.restaurantId]
                );
            } catch (err) {
                // Fallback if updated_at doesn't exist
                await connection.execute(
                    'UPDATE screens SET name = ?, orientation = ?, aspect_ratio = ? WHERE id = ? AND restaurant_id = ?',
                    [updates.name, updates.orientation === 'landscape' ? 'horizontal' : 'vertical', updates.aspectRatio, screenId, req.user.restaurantId]
                );
            }
        }

        // Update Playlist: Delete all old items and re-insert with order
        if (playlist) {
            // Update screen's updated_at timestamp when playlist changes
            try {
                await connection.execute(
                    'UPDATE screens SET updated_at = NOW() WHERE id = ?',
                    [screenId]
                );
            } catch (err) {
                // Ignore if column doesn't exist
            }
            await connection.execute('DELETE FROM screen_media WHERE screen_id = ?', [screenId]);
            
            // Check if display_order column exists
            let hasDisplayOrder = true;
            try {
                await connection.execute('SELECT display_order FROM screen_media LIMIT 1');
            } catch (err) {
                hasDisplayOrder = false;
                // Add the column if it doesn't exist
                try {
                    await connection.execute('ALTER TABLE screen_media ADD COLUMN display_order INT DEFAULT 0 AFTER play_value');
                    hasDisplayOrder = true;
                } catch (alterErr) {
                    console.warn('Could not add display_order column:', alterErr.message);
                }
            }
            
            for (let i = 0; i < playlist.length; i++) {
                const item = playlist[i];
                const mode = item.playbackConfig?.mode === 'times' ? 'times' : 'seconds';
                const val = item.duration;
                const order = item.order !== undefined ? item.order : i;
                
                if (hasDisplayOrder) {
                    await connection.execute(
                        'INSERT INTO screen_media (screen_id, media_id, play_mode, play_value, display_order) VALUES (?, ?, ?, ?, ?)',
                        [screenId, item.mediaId, mode, val, order]
                    );
                } else {
                    await connection.execute(
                        'INSERT INTO screen_media (screen_id, media_id, play_mode, play_value) VALUES (?, ?, ?, ?)',
                        [screenId, item.mediaId, mode, val]
                    );
                }
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

// --- STORAGE & USAGE ROUTES ---

app.get('/api/storage/usage', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT SUM(file_size_mb) as total_mb FROM media WHERE restaurant_id = ?',
            [req.user.restaurantId]
        );
        const totalMB = parseFloat(rows[0].total_mb || 0);
        res.json({ usedMB: totalMB });
    } catch (err) {
        if (err.code === 'ER_USER_LIMIT_REACHED') {
            res.status(503).json({ error: 'Database connection limit reached. Please wait a moment and try again.' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

app.get('/api/storage/breakdown', authenticateToken, async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId || req.user.restaurant_id;
        if (!restaurantId) {
            return res.status(401).json({ error: 'Restaurant ID missing' });
        }
        
        const [rows] = await pool.execute(
            `SELECT file_type, SUM(file_size_mb) as total_mb 
             FROM media 
             WHERE restaurant_id = ? 
             GROUP BY file_type`,
            [restaurantId]
        );
        
        const breakdown = {
            image: 0,
            video: 0,
            pdf: 0,
            gif: 0,
            other: 0
        };
        
        rows.forEach(row => {
            const type = row.file_type.toLowerCase();
            if (breakdown.hasOwnProperty(type)) {
                breakdown[type] = parseFloat(row.total_mb || 0);
            } else {
                breakdown.other += parseFloat(row.total_mb || 0);
            }
        });
        
        res.json(breakdown);
    } catch (err) {
        if (err.code === 'ER_USER_LIMIT_REACHED') {
            res.status(503).json({ error: 'Database connection limit reached. Please wait a moment and try again.' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// --- TEAM MANAGEMENT ROUTES ---

app.get('/api/team', authenticateToken, async (req, res) => {
    try {
        // Check if avatar_url column exists
        let hasAvatarColumn = true;
        try {
            await pool.execute('SELECT avatar_url FROM users LIMIT 1');
        } catch (err) {
            hasAvatarColumn = false;
        }

        const query = hasAvatarColumn 
            ? 'SELECT id, name, email, role, avatar_url, created_at FROM users WHERE restaurant_id = ? ORDER BY created_at DESC'
            : 'SELECT id, name, email, role, created_at FROM users WHERE restaurant_id = ? ORDER BY created_at DESC';
        
        const [users] = await pool.execute(query, [req.user.restaurantId]);
        
        const team = users.map(u => ({
            id: u.id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            avatarUrl: hasAvatarColumn ? (u.avatar_url || null) : null,
            createdAt: new Date(u.created_at).getTime()
        }));
        
        res.json(team);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/team/invite', authenticateToken, async (req, res) => {
    const { email, name } = req.body;
    
    // Check if user is owner
    const [currentUser] = await pool.execute('SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (currentUser[0].role !== 'owner') {
        return res.status(403).json({ error: 'Only owners can invite team members' });
    }
    
    try {
        // Get restaurant plan to check user limits
        const [restaurantRows] = await pool.execute(
            'SELECT plan FROM restaurants WHERE id = ?',
            [req.user.restaurantId]
        );
        
        if (restaurantRows.length === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        
        const plan = restaurantRows[0].plan;
        
        // Plan limits: free=1, basic=3, pro=20
        const planLimits = {
            'free': 1,
            'basic': 3,
            'pro': 20
        };
        
        const maxUsers = planLimits[plan] || 1;
        
        // Check current user count
        const [userCountRows] = await pool.execute(
            'SELECT COUNT(*) as count FROM users WHERE restaurant_id = ?',
            [req.user.restaurantId]
        );
        
        const currentCount = userCountRows[0].count;
        
        if (currentCount >= maxUsers) {
            return res.status(403).json({ 
                error: `Team member limit reached. Your ${plan} plan allows ${maxUsers} user${maxUsers > 1 ? 's' : ''}. Please upgrade to add more team members.` 
            });
        }
        
        // Check if email already exists
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        // Create temporary password
        const tempPassword = Math.random().toString(36).slice(-12);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        
        // Create user as member
        const [result] = await pool.execute(
            'INSERT INTO users (name, restaurant_id, email, password, role, auth_method) VALUES (?, ?, ?, ?, ?, ?)',
            [name, req.user.restaurantId, email, hashedPassword, 'member', 'local']
        );
        
        res.json({ 
            success: true, 
            userId: result.insertId,
            tempPassword: tempPassword // In production, send via email
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User: Delete own account (with password confirmation)
app.delete('/api/users/me/account', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: 'Password confirmation is required' });
        }
        
        // Get current user
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = users[0];
        const restaurantId = user.restaurant_id || user.restaurantId;
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        // Permanently delete restaurant and all associated data
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            // Delete all media files
            const [mediaFiles] = await connection.execute(
                'SELECT file_path FROM media WHERE restaurant_id = ?',
                [restaurantId]
            );
            
            // Delete media records
            await connection.execute('DELETE FROM media WHERE restaurant_id = ?', [restaurantId]);
            
            // Delete screens
            await connection.execute('DELETE FROM screens WHERE restaurant_id = ?', [restaurantId]);
            
            // Delete schedules
            await connection.execute('DELETE FROM schedules WHERE restaurant_id = ?', [restaurantId]);
            
            // Delete all users
            await connection.execute('DELETE FROM users WHERE restaurant_id = ?', [restaurantId]);
            
            // Delete restaurant
            await connection.execute('DELETE FROM restaurants WHERE id = ?', [restaurantId]);
            
            // Delete warnings
            try {
                await connection.execute('DELETE FROM user_warnings WHERE restaurant_id = ?', [restaurantId]);
            } catch (e) {
                // Table might not exist
            }
            
            // Delete activity logs
            try {
                await connection.execute('DELETE FROM activity_logs WHERE restaurant_id = ?', [restaurantId]);
            } catch (e) {
                // Table might not exist
            }
            
            await connection.commit();
            
            res.json({ success: true, message: 'Account permanently deleted' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/team/:id', authenticateToken, async (req, res) => {
    const userId = req.params.id;
    
    // Check if user is owner
    const [currentUser] = await pool.execute('SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (currentUser[0].role !== 'owner') {
        return res.status(403).json({ error: 'Only owners can remove team members' });
    }
    
    // Prevent deleting yourself
    if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ error: 'Cannot remove yourself' });
    }
    
    try {
        await pool.execute(
            'DELETE FROM users WHERE id = ? AND restaurant_id = ? AND role != "owner"',
            [userId, req.user.restaurantId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- USER PROFILE ROUTES ---

// Debug: Test route to verify server is running
app.get('/api/users/test', (req, res) => {
    res.json({ message: 'User routes are working', timestamp: Date.now() });
});

// Profile picture upload endpoint
app.post('/api/users/me/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Validate it's an image
        if (!file.mimetype.startsWith('image/')) {
            fs.unlinkSync(file.path); // Delete invalid file
            return res.status(400).json({ error: 'File must be an image' });
        }

        // Check if avatar_url column exists, if not, add it
        try {
            await pool.execute('SELECT avatar_url FROM users LIMIT 1');
        } catch (err) {
            // Column doesn't exist, add it
            try {
                await pool.execute('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL AFTER google_id');
            } catch (alterErr) {
                console.warn('Could not add avatar_url column:', alterErr.message);
            }
        }

        // Get current avatar to delete old one
        const [currentUser] = await pool.execute('SELECT avatar_url FROM users WHERE id = ?', [req.user.id]);
        if (currentUser.length > 0 && currentUser[0].avatar_url) {
            const oldPath = currentUser[0].avatar_url.replace(/^.*\/uploads\//, 'uploads/');
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Update user with new avatar path
        const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        const avatarUrl = `${baseUrl}/${file.path.replace(/\\/g, '/')}`;
        
        await pool.execute(
            'UPDATE users SET avatar_url = ? WHERE id = ?',
            [avatarUrl, req.user.id]
        );

        res.json({ avatarUrl });
    } catch (err) {
        // Clean up file if database update fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/me', authenticateToken, async (req, res) => {
    console.log('PUT /api/users/me called', { userId: req.user?.id, body: req.body });
    const { name, email } = req.body;
    
    try {
        // Check if avatar_url column exists
        try {
            await pool.execute('SELECT avatar_url FROM users LIMIT 1');
        } catch (err) {
            // Column doesn't exist, add it
            try {
                await pool.execute('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL AFTER google_id');
            } catch (alterErr) {
                console.warn('Could not add avatar_url column:', alterErr.message);
            }
        }

        // Validate input
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        if (!email || !email.trim()) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Check if email is being changed and if it's already taken
        const [currentUser] = await pool.execute('SELECT email FROM users WHERE id = ?', [req.user.id]);
        if (currentUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (email !== currentUser[0].email) {
            const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Email is already in use' });
            }
        }
        
        // Update user profile
        await pool.execute(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [name.trim(), email.trim(), req.user.id]
        );
        
        // Return updated user
        const [updated] = await pool.execute(
            'SELECT u.*, r.plan, r.account_status FROM users u JOIN restaurants r ON u.restaurant_id = r.id WHERE u.id = ?',
            [req.user.id]
        );
        
        const user = updated[0];
        const baseUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3001}`;
        res.json({
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            restaurantId: user.restaurant_id.toString(),
            plan: user.plan,
            accountStatus: user.account_status,
            avatarUrl: user.avatar_url || null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ADMIN ROUTES ---

const authenticateAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

app.get('/api/admin/stats', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        // Count users - Convert BigInt to Number
        const [userCountRows] = await pool.execute('SELECT COUNT(*) as count FROM users');
        const totalUsers = Number(userCountRows[0]?.count) || 0;
        
        // Count screens - Convert BigInt to Number
        const [screenCountRows] = await pool.execute('SELECT COUNT(*) as count FROM screens');
        const totalScreens = Number(screenCountRows[0]?.count) || 0;
        
        // Count active screens (screens with recent pings - within last 5 minutes)
        // A screen is considered active if it has pinged within the last 5 minutes
        // This gives a more reasonable window for screens that may have brief connectivity issues
        const [activeScreensRows] = await pool.execute(
            'SELECT COUNT(*) as count FROM screens WHERE last_seen_at IS NOT NULL AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)'
        );
        const activeScreens = Number(activeScreensRows[0]?.count) || 0;
        
        // Calculate total storage - Use COALESCE to handle NULL
        const [storageRows] = await pool.execute('SELECT COALESCE(SUM(file_size_mb), 0) as total_mb FROM media');
        const totalStorageMB = Number(storageRows[0]?.total_mb) || 0;
        
        // Count media files - Convert BigInt to Number
        const [fileCountRows] = await pool.execute('SELECT COUNT(*) as count FROM media');
        const totalFiles = Number(fileCountRows[0]?.count) || 0;
        
        // Calculate estimated revenue (mock calculation - adjust based on your pricing)
        // Only count real paying clients - exclude any restaurant that has admin users with pro features
        // Exclude restaurants that have any super_admin users (admins with pro access)
        // Exclude System restaurant
        const [restaurants] = await pool.execute(
            `SELECT DISTINCT r.plan, r.id, r.name 
             FROM restaurants r 
             WHERE r.account_status = "active" 
             AND r.name != "System"
             AND NOT EXISTS (
                 SELECT 1 FROM users u 
                 WHERE u.restaurant_id = r.id 
                 AND u.role = 'super_admin'
             )`
        );
        const revenue = restaurants.reduce((sum, r) => {
            // Only count basic and pro plans (real paying clients)
            // Exclude restaurants where admins have pro features
            if (r.plan === 'basic') return sum + 9;
            if (r.plan === 'pro') return sum + 29;
            return sum;
        }, 0);
        
        res.json({
            totalUsers: totalUsers,
            totalScreens: totalScreens,
            activeScreens: activeScreens,
            totalStorageMB: totalStorageMB,
            totalFiles: totalFiles,
            estimatedRevenue: revenue
        });
    } catch (err) {
        console.error('Error in /api/admin/stats:', err);
        if (err.code === 'ER_USER_LIMIT_REACHED') {
            res.status(503).json({ error: 'Database connection limit reached. Please wait a moment and try again.' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Admin Activity Logs Endpoint
app.get('/api/admin/activities', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        // Check if activity_logs table exists
        let hasActivityTable = true;
        try {
            await pool.execute('SELECT * FROM activity_logs LIMIT 1');
        } catch (err) {
            hasActivityTable = false;
            // Try to create the table
            try {
                await pool.execute(`
                    CREATE TABLE IF NOT EXISTS activity_logs (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        restaurant_id INT NULL,
                        user_id INT NULL,
                        action VARCHAR(100) NOT NULL,
                        details TEXT NULL,
                        metadata JSON NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_restaurant_id (restaurant_id),
                        INDEX idx_user_id (user_id),
                        INDEX idx_action (action),
                        INDEX idx_created_at (created_at)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);
                hasActivityTable = true;
            } catch (createErr) {
                console.warn('Could not create activity_logs table:', createErr.message);
            }
        }

        if (!hasActivityTable) {
            // Fallback: Generate activities from existing data
            const [recentUsers] = await pool.execute(
                `SELECT r.id as restaurant_id, u.id as user_id, u.name, u.email, r.created_at
                 FROM restaurants r
                 LEFT JOIN users u ON r.id = u.restaurant_id AND u.role = 'owner'
                 ORDER BY r.created_at DESC
                 LIMIT 10`
            );
            
            const activities = recentUsers.map((u, index) => ({
                id: `reg-${u.restaurant_id}`,
                action: 'New Registration',
                details: `${u.name || 'User'} (${u.email || ''}) signed up`,
                timestamp: new Date(u.created_at).getTime(),
                restaurantId: u.restaurant_id?.toString()
            }));
            
            return res.json(activities);
        }

        // Fetch real activity logs from database
        const [activities] = await pool.execute(
            `SELECT al.*, u.name as user_name, u.email as user_email, r.name as restaurant_name
             FROM activity_logs al
             LEFT JOIN users u ON al.user_id = u.id
             LEFT JOIN restaurants r ON al.restaurant_id = r.id
             ORDER BY al.created_at DESC
             LIMIT 50`
        );

        const result = activities.map((a) => {
            return {
                id: a.id.toString(),
                action: a.action,
                details: a.details || '',
                timestamp: new Date(a.created_at).getTime(),
                restaurantId: a.restaurant_id?.toString(),
                userId: a.user_id?.toString(),
                userName: a.user_name,
                userEmail: a.user_email,
                restaurantName: a.restaurant_name,
                metadata: a.metadata ? JSON.parse(a.metadata) : null
            };
        });

        res.json(result);
    } catch (err) {
        console.error('Error fetching activity logs:', err);
        if (err.code === 'ER_USER_LIMIT_REACHED') {
            res.status(503).json({ error: 'Database connection limit reached. Please wait a moment and try again.' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Admin: Get user warnings
app.get('/api/admin/users/:id/warnings', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        // Check if user_warnings table exists
        let hasWarningsTable = true;
        try {
            await pool.execute('SELECT * FROM user_warnings LIMIT 1');
        } catch (err) {
            hasWarningsTable = false;
            // Try to create the table
            try {
                await pool.execute(`
                    CREATE TABLE IF NOT EXISTS user_warnings (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        restaurant_id INT NOT NULL,
                        admin_id INT NOT NULL,
                        warning_type ENUM('warning', 'ban', 'suspension') NOT NULL,
                        reason TEXT NOT NULL,
                        expires_at TIMESTAMP NULL,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_user_id (user_id),
                        INDEX idx_restaurant_id (restaurant_id),
                        INDEX idx_warning_type (warning_type),
                        INDEX idx_is_active (is_active)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);
                hasWarningsTable = true;
            } catch (createErr) {
                console.warn('Could not create user_warnings table:', createErr.message);
            }
        }

        if (!hasWarningsTable) {
            return res.json([]);
        }

        const [warnings] = await pool.execute(
            `SELECT uw.*, u.name as admin_name
             FROM user_warnings uw
             LEFT JOIN users u ON uw.admin_id = u.id
             WHERE uw.user_id = ? AND uw.is_active = TRUE
             ORDER BY uw.created_at DESC`,
            [req.params.id]
        );

        res.json(warnings.map((w) => ({
            id: w.id.toString(),
            warningType: w.warning_type,
            reason: w.reason,
            expiresAt: w.expires_at ? new Date(w.expires_at).getTime() : null,
            createdAt: new Date(w.created_at).getTime(),
            adminName: w.admin_name
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Warn/Ban/Suspend user
app.post('/api/admin/users/:id/warn', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { warningType, reason, expiresAt } = req.body;
        const restaurantId = req.params.id; // This is restaurant_id from frontend

        // Check if user_warnings table exists
        let hasWarningsTable = true;
        try {
            await pool.execute('SELECT * FROM user_warnings LIMIT 1');
        } catch (err) {
            hasWarningsTable = false;
            try {
                await pool.execute(`
                    CREATE TABLE IF NOT EXISTS user_warnings (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id INT NOT NULL,
                        restaurant_id INT NOT NULL,
                        admin_id INT NOT NULL,
                        warning_type ENUM('warning', 'ban', 'suspension') NOT NULL,
                        reason TEXT NOT NULL,
                        expires_at TIMESTAMP NULL,
                        is_active BOOLEAN DEFAULT TRUE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX idx_user_id (user_id),
                        INDEX idx_restaurant_id (restaurant_id),
                        INDEX idx_warning_type (warning_type),
                        INDEX idx_is_active (is_active)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);
                hasWarningsTable = true;
            } catch (createErr) {
                console.warn('Could not create user_warnings table:', createErr.message);
            }
        }

        if (!hasWarningsTable) {
            return res.status(500).json({ error: 'Warnings table not available' });
        }

        // Get user's user_id from restaurant_id
        const [users] = await pool.execute('SELECT id FROM users WHERE restaurant_id = ? AND role = "owner" LIMIT 1', [restaurantId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found for this restaurant' });
        }
        const userId = users[0].id;

        // If ban or suspension, update account status
        if (warningType === 'ban' || warningType === 'suspension') {
            await pool.execute(
                'UPDATE restaurants SET account_status = ? WHERE id = ?',
                ['suspended', restaurantId]
            );
        }

        // Create warning record
        const [result] = await pool.execute(
            'INSERT INTO user_warnings (user_id, restaurant_id, admin_id, warning_type, reason, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, restaurantId, req.user.id, warningType, reason, expiresAt || null]
        );

        // Log activity
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [restaurantId, userId, `User ${warningType === 'ban' ? 'Banned' : warningType === 'suspension' ? 'Suspended' : 'Warned'}`, reason]
            );
        } catch (logErr) {
            console.warn('Could not log warning activity:', logErr.message);
        }

        res.json({ success: true, id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Delete user
app.delete('/api/admin/users/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const restaurantId = req.params.id; // This is restaurant_id from frontend

        // Get user info before deletion for logging
        const [users] = await pool.execute(
            'SELECT id, name, email FROM users WHERE restaurant_id = ? AND role = "owner"',
            [restaurantId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        const userId = user.id;

        // Soft delete: Mark restaurant as deleted instead of actually deleting
        // This prevents users from logging in while preserving data for audit
        await pool.execute(
            'UPDATE restaurants SET account_status = ? WHERE id = ?',
            ['deleted', restaurantId]
        );
        
        // Also delete all users associated with this restaurant to prevent login
        await pool.execute('DELETE FROM users WHERE restaurant_id = ?', [restaurantId]);

        // Log activity
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, action, details) VALUES (?, ?, ?)',
                [restaurantId, 'User Deleted', `User ${user.name} (${user.email}) deleted by admin`]
            );
        } catch (logErr) {
            console.warn('Could not log deletion activity:', logErr.message);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Create user
app.post('/api/admin/users', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { name, email, password, plan } = req.body;

        if (!name || !email || !password || !plan) {
            return res.status(400).json({ error: 'Name, email, password, and plan are required' });
        }

        // Check if email already exists
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Create Restaurant
            const planLimits = {
                'free': 1,
                'basic': 3,
                'pro': -1
            };
            const maxScreens = planLimits[plan] || 1;

            const [restResult] = await connection.execute(
                'INSERT INTO restaurants (name, email, owner_name, plan, max_screens, account_status) VALUES (?, ?, ?, ?, ?, ?)',
                [`${name}'s Business`, email, name, plan, maxScreens, 'active']
            );
            const restaurantId = restResult.insertId;

            // Hash Password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create User
            const [userResult] = await connection.execute(
                'INSERT INTO users (name, restaurant_id, email, password, role, auth_method, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, restaurantId, email, hashedPassword, 'owner', 'local', true]
            );

            // Log activity
            try {
                await connection.execute(
                    'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                    [restaurantId, userResult.insertId, 'User Created by Admin', `Admin created user ${name} (${email}) with ${plan} plan`]
                );
            } catch (logErr) {
                console.warn('Could not log user creation activity:', logErr.message);
            }

            await connection.commit();

            res.json({
                success: true,
                userId: userResult.insertId,
                restaurantId: restaurantId
            });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Update user subscription/plan
app.put('/api/admin/users/:id/subscription', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { plan } = req.body;
        const restaurantId = req.params.id; // This is restaurant_id from frontend

        if (!plan || !['free', 'basic', 'pro'].includes(plan)) {
            return res.status(400).json({ error: 'Valid plan (free, basic, pro) is required' });
        }

        // Get user info
        const [users] = await pool.execute('SELECT id, name, email FROM users WHERE restaurant_id = ? AND role = "owner"', [restaurantId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = users[0].id;
        const userName = users[0].name;

        // Update plan and max_screens
        const planLimits = {
            'free': 1,
            'basic': 3,
            'pro': -1
        };
        const maxScreens = planLimits[plan] || 1;

        await pool.execute(
            'UPDATE restaurants SET plan = ?, max_screens = ? WHERE id = ?',
            [plan, maxScreens, restaurantId]
        );

        // Log activity
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [restaurantId, userId, 'Plan Updated', `Admin changed ${userName}'s plan to ${plan}`]
            );
        } catch (logErr) {
            console.warn('Could not log plan update activity:', logErr.message);
        }

        res.json({ success: true, plan, maxScreens });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Update account status
app.put('/api/admin/users/:id/status', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const restaurantId = req.params.id; // This is restaurant_id from frontend

        if (!status || !['active', 'suspended', 'expired'].includes(status)) {
            return res.status(400).json({ error: 'Valid status (active, suspended, expired) is required' });
        }

        // Get user info
        const [users] = await pool.execute('SELECT id FROM users WHERE restaurant_id = ? AND role = "owner"', [restaurantId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = users[0].id;

        await pool.execute(
            'UPDATE restaurants SET account_status = ? WHERE id = ?',
            [status, restaurantId]
        );

        // Log activity
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [restaurantId, userId, 'Status Updated', `Admin changed account status to ${status}`]
            );
        } catch (logErr) {
            console.warn('Could not log status update activity:', logErr.message);
        }

        res.json({ success: true, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User: Get own warnings and notifications
app.get('/api/users/me/warnings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const restaurantId = req.user?.restaurantId || req.user?.restaurant_id;
        
        if (!userId || !restaurantId) {
            return res.status(401).json({ error: 'User authentication data missing' });
        }

        // Check if user_warnings table exists
        let hasWarningsTable = true;
        try {
            await pool.execute('SELECT * FROM user_warnings LIMIT 1');
        } catch (err) {
            hasWarningsTable = false;
        }

        if (!hasWarningsTable) {
            return res.json([]);
        }

        // Get active warnings for this user
        const [warnings] = await pool.execute(
            `SELECT uw.*, u.name as admin_name
             FROM user_warnings uw
             LEFT JOIN users u ON uw.admin_id = u.id
             WHERE uw.user_id = ? AND uw.restaurant_id = ? AND uw.is_active = TRUE
             ORDER BY uw.created_at DESC`,
            [userId, restaurantId]
        );

        res.json(warnings.map((w) => ({
            id: w.id,
            warningType: w.warning_type,
            reason: w.reason,
            expiresAt: w.expires_at,
            createdAt: w.created_at,
            adminName: w.admin_name
        })));
    } catch (err) {
        console.error('Error fetching user warnings:', err);
        res.status(500).json({ error: err.message });
    }
});

// User: Submit upgrade request
app.post('/api/users/upgrade-request', authenticateToken, async (req, res) => {
    try {
        const { requestedPlan, currentPlan } = req.body;
        const userId = req.user.id;
        const restaurantId = req.user.restaurantId || req.user.restaurant_id;

        if (!requestedPlan || !['free', 'basic', 'pro'].includes(requestedPlan)) {
            return res.status(400).json({ error: 'Valid plan (free, basic, pro) is required' });
        }

        // Check if feature_requests table exists, create if not
        let hasTable = true;
        try {
            await pool.execute('SELECT * FROM feature_requests LIMIT 1');
        } catch (err) {
            hasTable = false;
            try {
                await pool.execute(`
                    CREATE TABLE IF NOT EXISTS feature_requests (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        restaurant_id INT NOT NULL,
                        user_id INT NOT NULL,
                        request_type ENUM('upgrade', 'feature') DEFAULT 'feature',
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        category VARCHAR(50),
                        requested_plan VARCHAR(50) NULL,
                        current_plan VARCHAR(50) NULL,
                        status ENUM('pending', 'reviewed', 'approved', 'rejected', 'completed') DEFAULT 'pending',
                        admin_notes TEXT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_restaurant_id (restaurant_id),
                        INDEX idx_user_id (user_id),
                        INDEX idx_status (status),
                        INDEX idx_request_type (request_type)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);
                hasTable = true;
            } catch (createErr) {
                console.warn('Could not create feature_requests table:', createErr.message);
            }
        }

        if (!hasTable) {
            return res.status(500).json({ error: 'Feature requests table not available' });
        }

        // Create upgrade request
        const [result] = await pool.execute(
            'INSERT INTO feature_requests (restaurant_id, user_id, request_type, title, description, requested_plan, current_plan, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                restaurantId,
                userId,
                'upgrade',
                `Upgrade to ${requestedPlan.charAt(0).toUpperCase() + requestedPlan.slice(1)} Plan`,
                `User requested upgrade from ${currentPlan || 'free'} to ${requestedPlan}`,
                requestedPlan,
                currentPlan || 'free',
                'pending'
            ]
        );

        // Log activity
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [restaurantId, userId, 'Upgrade Request', `Requested upgrade to ${requestedPlan} plan`]
            );
        } catch (logErr) {
            console.warn('Could not log upgrade request activity:', logErr.message);
        }

        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error('Error submitting upgrade request:', err);
        res.status(500).json({ error: err.message });
    }
});

// User: Submit feature request
app.post('/api/users/feature-request', authenticateToken, async (req, res) => {
    try {
        const { title, description, category, restaurantId: reqRestaurantId } = req.body;
        const userId = req.user.id;
        const restaurantId = reqRestaurantId || req.user.restaurant_id;

        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description are required' });
        }

        // Check if feature_requests table exists, create if not
        let hasTable = true;
        try {
            await pool.execute('SELECT * FROM feature_requests LIMIT 1');
        } catch (err) {
            hasTable = false;
            try {
                await pool.execute(`
                    CREATE TABLE IF NOT EXISTS feature_requests (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        restaurant_id INT NOT NULL,
                        user_id INT NOT NULL,
                        request_type ENUM('upgrade', 'feature') DEFAULT 'feature',
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        category VARCHAR(50),
                        requested_plan VARCHAR(50) NULL,
                        current_plan VARCHAR(50) NULL,
                        status ENUM('pending', 'reviewed', 'approved', 'rejected', 'completed') DEFAULT 'pending',
                        admin_notes TEXT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        INDEX idx_restaurant_id (restaurant_id),
                        INDEX idx_user_id (user_id),
                        INDEX idx_status (status),
                        INDEX idx_request_type (request_type)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);
                hasTable = true;
            } catch (createErr) {
                console.warn('Could not create feature_requests table:', createErr.message);
            }
        }

        if (!hasTable) {
            return res.status(500).json({ error: 'Feature requests table not available' });
        }

        // Create feature request
        const [result] = await pool.execute(
            'INSERT INTO feature_requests (restaurant_id, user_id, request_type, title, description, category, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [restaurantId, userId, 'feature', title, description, category || 'feature', 'pending']
        );

        // Log activity
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [restaurantId, userId, 'Feature Request', `Requested: ${title}`]
            );
        } catch (logErr) {
            console.warn('Could not log feature request activity:', logErr.message);
        }

        res.json({ success: true, id: result.insertId });
    } catch (err) {
        console.error('Error submitting feature request:', err);
        res.status(500).json({ error: err.message });
    }
});

// User: Refresh user data (plan, status, etc.)
app.get('/api/users/me/refresh', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const restaurantId = req.user?.restaurantId || req.user?.restaurant_id;
        
        if (!userId || !restaurantId) {
            return res.status(401).json({ error: 'User authentication data missing' });
        }

        // Get updated user and restaurant data
        const [users] = await pool.execute(
            `SELECT u.*, r.plan, r.account_status, r.max_screens, r.name as restaurant_name
             FROM users u
             JOIN restaurants r ON u.restaurant_id = r.id
             WHERE u.id = ? AND u.restaurant_id = ?`,
            [userId, restaurantId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = users[0];
        const user = {
            id: String(userData.id),
            name: userData.name,
            email: userData.email,
            role: userData.role,
            plan: userData.plan,
            restaurantId: String(userData.restaurant_id),
            accountStatus: userData.account_status,
            maxScreens: userData.max_screens,
            restaurantName: userData.restaurant_name,
            avatarUrl: userData.avatar_url || null,
            isVerified: userData.is_verified || false
        };

        res.json(user);
    } catch (err) {
        console.error('Error refreshing user data:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all admins
app.get('/api/admin/admins', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        // Get or create system restaurant for admins
        let [systemRestaurant] = await pool.execute('SELECT id FROM restaurants WHERE name = "System" LIMIT 1');
        let systemRestaurantId;
        
        if (systemRestaurant.length === 0) {
            // Create system restaurant
            const [result] = await pool.execute(
                'INSERT INTO restaurants (name, email, owner_name, plan, max_screens, account_status) VALUES (?, ?, ?, ?, ?, ?)',
                ['System', 'system@menupi.com', 'System', 'pro', -1, 'active']
            );
            systemRestaurantId = result.insertId;
        } else {
            systemRestaurantId = systemRestaurant[0].id;
        }
        
        // Query admins - handle missing columns gracefully
        let query = `SELECT u.id, u.name, u.email, u.restaurant_id`;
        let hasAvatarColumn = false;
        let hasCreatedAtColumn = true;
        
        // Check for created_at column
        try {
            await pool.execute('SELECT created_at FROM users LIMIT 1');
        } catch (err) {
            hasCreatedAtColumn = false;
        }
        
        if (hasCreatedAtColumn) {
            query += `, u.created_at`;
        }
        
        // Try to include avatar_url if it exists
        try {
            await pool.execute('SELECT avatar_url FROM users LIMIT 1');
            query += `, u.avatar_url`;
            hasAvatarColumn = true;
        } catch (err) {
            // Column doesn't exist, continue without it
        }
        
        query += ` FROM users u WHERE u.role = 'super_admin'`;
        if (hasCreatedAtColumn) {
            query += ` ORDER BY u.created_at DESC`;
        }
        
        const [admins] = await pool.execute(query);
        
        const result = admins.map((admin) => {
            try {
                let createdAt = Date.now();
                if (hasCreatedAtColumn && admin.created_at) {
                    const date = new Date(admin.created_at);
                    if (!isNaN(date.getTime())) {
                        createdAt = date.getTime();
                    }
                }
                
                const adminObj = {
                    id: admin.id ? admin.id.toString() : '',
                    name: admin.name || '',
                    email: admin.email || '',
                    createdAt: createdAt,
                    restaurantId: admin.restaurant_id || null
                };
                
                if (hasAvatarColumn && admin.avatar_url !== undefined) {
                    adminObj.avatarUrl = admin.avatar_url || null;
                } else {
                    adminObj.avatarUrl = null;
                }
                
                return adminObj;
            } catch (mapErr) {
                console.error('Error mapping admin:', mapErr, admin);
                return {
                    id: admin.id ? admin.id.toString() : '',
                    name: admin.name || '',
                    email: admin.email || '',
                    avatarUrl: null,
                    createdAt: Date.now(),
                    restaurantId: admin.restaurant_id || null
                };
            }
        });
        
        res.json(result);
    } catch (err) {
        console.error('Error in /api/admin/admins:', err);
        console.error('Error stack:', err.stack);
        console.error('Error code:', err.code);
        if (err.code === 'ER_USER_LIMIT_REACHED') {
            res.status(503).json({ error: 'Database connection limit reached. Please wait a moment and try again.' });
        } else {
            res.status(500).json({ error: err.message || 'Internal server error', details: process.env.NODE_ENV === 'development' ? err.stack : undefined });
        }
    }
});

// Admin: Create new admin
app.post('/api/admin/admins', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        
        // Check if email already exists
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Get or create system restaurant for admins
        let [systemRestaurant] = await pool.execute('SELECT id FROM restaurants WHERE name = "System" LIMIT 1');
        let systemRestaurantId;
        
        if (systemRestaurant.length === 0) {
            // Create system restaurant
            const [result] = await pool.execute(
                'INSERT INTO restaurants (name, email, owner_name, plan, max_screens, account_status) VALUES (?, ?, ?, ?, ?, ?)',
                ['System', 'system@menupi.com', 'System', 'pro', -1, 'active']
            );
            systemRestaurantId = result.insertId;
        } else {
            systemRestaurantId = systemRestaurant[0].id;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create super_admin user
        const [userResult] = await pool.execute(
            'INSERT INTO users (name, restaurant_id, email, password, role, auth_method, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, systemRestaurantId, email, hashedPassword, 'super_admin', 'local', true]
        );
        
        // Log activity
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [systemRestaurantId, userResult.insertId, 'Admin Created', `Admin ${req.user.name} created new admin ${name} (${email})`]
            );
        } catch (logErr) {
            console.warn('Could not log admin creation activity:', logErr.message);
        }
        
        res.json({
            success: true,
            userId: userResult.insertId,
            admin: {
                id: userResult.insertId.toString(),
                name,
                email,
                createdAt: Date.now()
            }
        });
    } catch (err) {
        console.error('Error in /api/admin/admins POST:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/restaurants', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const [restaurants] = await pool.execute(
            `SELECT r.*, u.name as owner_name, u.email as owner_email, u.avatar_url
             FROM restaurants r 
             LEFT JOIN users u ON r.id = u.restaurant_id AND u.role = 'owner'
             ORDER BY r.created_at DESC`
        );
        
        // Get statistics for each restaurant
        const result = await Promise.all(restaurants.map(async (r) => {
            const restaurantId = r.id;
            
            try {
                // Count screens - Convert BigInt to Number
                const [screenCountRows] = await pool.execute(
                    'SELECT COUNT(*) as count FROM screens WHERE restaurant_id = ?',
                    [restaurantId]
                );
                const screenCount = Number(screenCountRows[0]?.count) || 0;
                
                // Count media files - Convert BigInt to Number
                const [mediaCountRows] = await pool.execute(
                    'SELECT COUNT(*) as count FROM media WHERE restaurant_id = ?',
                    [restaurantId]
                );
                const mediaCount = Number(mediaCountRows[0]?.count) || 0;
                
                // Calculate storage usage
                const [storageRows] = await pool.execute(
                    'SELECT COALESCE(SUM(file_size_mb), 0) as total_mb FROM media WHERE restaurant_id = ?',
                    [restaurantId]
                );
                const storageMB = Number(storageRows[0]?.total_mb) || 0;
                
                // Get storage breakdown by type
                const [storageBreakdownRows] = await pool.execute(
                    `SELECT file_type, COALESCE(SUM(file_size_mb), 0) as total_mb, COUNT(*) as count
                     FROM media 
                     WHERE restaurant_id = ?
                     GROUP BY file_type`,
                    [restaurantId]
                );
                
                const storageBreakdown = storageBreakdownRows.reduce((acc, item) => {
                    acc[item.file_type] = {
                        totalMB: Number(item.total_mb) || 0,
                        count: Number(item.count) || 0
                    };
                    return acc;
                }, {});
                
                // Debug logging (remove in production)
                if (restaurantId === 1 || screenCount > 0 || mediaCount > 0) {
                    console.log(`Restaurant ${restaurantId} (${r.name}):`, {
                        screenCount,
                        mediaCount,
                        storageMB,
                        screenCountType: typeof screenCount,
                        screenCountRaw: screenCountRows[0]
                    });
                }
                
                return {
                    id: r.id.toString(),
                    name: r.name,
                    email: r.email,
                    ownerName: r.owner_name,
                    ownerEmail: r.owner_email,
                    avatarUrl: r.avatar_url,
                    plan: r.plan,
                    accountStatus: r.account_status,
                    createdAt: new Date(r.created_at).getTime(),
                    restaurantId: r.id, // Add restaurantId for frontend
                    stats: {
                        screenCount: screenCount,
                        mediaCount: mediaCount,
                        storageMB: storageMB,
                        storageBreakdown: storageBreakdown
                    }
                };
            } catch (err) {
                console.error(`Error fetching stats for restaurant ${restaurantId}:`, err);
                // Return default stats on error
                return {
                    id: r.id.toString(),
                    name: r.name,
                    email: r.email,
                    ownerName: r.owner_name,
                    ownerEmail: r.owner_email,
                    avatarUrl: r.avatar_url,
                    plan: r.plan,
                    accountStatus: r.account_status,
                    createdAt: new Date(r.created_at).getTime(),
                    restaurantId: r.id,
                    stats: {
                        screenCount: 0,
                        mediaCount: 0,
                        storageMB: 0,
                        storageBreakdown: {}
                    }
                };
            }
        }));
        
        res.json(result);
    } catch (err) {
        console.error('Error in /api/admin/restaurants:', err);
        if (err.code === 'ER_USER_LIMIT_REACHED') {
            res.status(503).json({ error: 'Database connection limit reached. Please wait a moment and try again.' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// ============================================
// COMPREHENSIVE ADMIN ENDPOINTS
// ============================================

// Admin: Activate/Suspend Restaurant
app.put('/api/admin/restaurants/:id/status', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const restaurantId = req.params.id;
        
        if (!['active', 'suspended', 'expired'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be active, suspended, or expired' });
        }
        
        await pool.execute(
            'UPDATE restaurants SET account_status = ? WHERE id = ?',
            [status, restaurantId]
        );
        
        // Log activity
        const adminUser = req.user;
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [restaurantId, adminUser.id, 'Restaurant Status Changed', `Admin ${adminUser.name} changed restaurant status to ${status}`]
            );
        } catch (logErr) {
            console.warn('Could not log activity:', logErr.message);
        }
        
        res.json({ success: true, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Delete Restaurant (Soft Delete)
app.delete('/api/admin/restaurants/:id', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const restaurantId = req.params.id;
        
        // Soft delete: Set status to 'deleted' instead of actually deleting
        await pool.execute(
            'UPDATE restaurants SET account_status = ? WHERE id = ?',
            ['deleted', restaurantId]
        );
        
        // Log activity
        const adminUser = req.user;
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [restaurantId, adminUser.id, 'Restaurant Deleted', `Admin ${adminUser.name} deleted restaurant`]
            );
        } catch (logErr) {
            console.warn('Could not log activity:', logErr.message);
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Update Plan Limits (Custom Limits)
app.put('/api/admin/restaurants/:id/limits', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { maxScreens, storageMB } = req.body;
        const restaurantId = req.params.id;
        
        const updates = [];
        const values = [];
        
        if (maxScreens !== undefined) {
            updates.push('max_screens = ?');
            values.push(maxScreens);
        }
        
        if (storageMB !== undefined) {
            // Note: This would require a new column in restaurants table
            // For now, we'll just update max_screens
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No updates provided' });
        }
        
        values.push(restaurantId);
        await pool.execute(
            `UPDATE restaurants SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        // Log activity
        const adminUser = req.user;
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [restaurantId, adminUser.id, 'Plan Limits Updated', `Admin ${adminUser.name} updated plan limits`]
            );
        } catch (logErr) {
            console.warn('Could not log activity:', logErr.message);
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Set Plan Expiry
app.put('/api/admin/restaurants/:id/expiry', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { expiresAt } = req.body;
        const restaurantId = req.params.id;
        
        // Note: This would require a plan_expires_at column in restaurants table
        // For now, we'll update account_status to 'expired' if expiresAt is in the past
        if (expiresAt) {
            const expiryDate = new Date(expiresAt);
            const now = new Date();
            if (expiryDate < now) {
                await pool.execute(
                    'UPDATE restaurants SET account_status = ? WHERE id = ?',
                    ['expired', restaurantId]
                );
            }
        }
        
        res.json({ success: true, expiresAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Reset User Password
app.post('/api/admin/users/:id/reset-password', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.params.id;
        
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );
        
        // Log activity
        const adminUser = req.user;
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [adminUser.restaurant_id, adminUser.id, 'Password Reset', `Admin ${adminUser.name} reset password for user ${userId}`]
            );
        } catch (logErr) {
            console.warn('Could not log activity:', logErr.message);
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Change Own Password (requires old password)
app.post('/api/admin/change-password', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const adminId = req.user.id;
        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Old password and new password are required' });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }
        
        // Get current admin password
        const [users] = await pool.execute(
            'SELECT password FROM users WHERE id = ? AND role = "super_admin"',
            [adminId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'Admin account not found' });
        }
        
        // Verify old password
        const passwordMatch = await bcrypt.compare(oldPassword, users[0].password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, adminId]
        );
        
        // Log activity
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [req.user.restaurantId || req.user.restaurant_id, adminId, 'Password Changed', `Admin ${req.user.name} changed their own password`]
            );
        } catch (logErr) {
            console.warn('Could not log activity:', logErr.message);
        }
        
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
        console.error('Error in /api/admin/change-password:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Forgot Password (send reset email)
app.post('/api/admin/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        // Find admin by email (must be super_admin)
        const [users] = await pool.execute(
            'SELECT id, name, email FROM users WHERE email = ? AND role = "super_admin"',
            [email]
        );
        
        // Don't reveal if email exists (security best practice)
        if (users.length === 0) {
            return res.json({ 
                success: true, 
                message: 'If an admin account exists with this email, a password reset link has been sent.' 
            });
        }
        
        const admin = users[0];
        
        // Generate reset token
        const resetToken = generateVerificationToken();
        const hashedToken = hashVerificationToken(resetToken);
        const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        
        // Check if password_reset_token column exists, if not add it
        try {
            await pool.execute('SELECT password_reset_token FROM users LIMIT 1');
        } catch (err) {
            try {
                await pool.execute('ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL');
                await pool.execute('ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMP NULL');
                await pool.execute('CREATE INDEX idx_password_reset_token ON users(password_reset_token)');
            } catch (alterErr) {
                console.warn('Could not add password reset columns:', alterErr.message);
            }
        }
        
        // Update user with reset token
        await pool.execute(
            'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
            [hashedToken, tokenExpires, admin.id]
        );
        
        // Generate reset link
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/admin/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
        
        // TODO: Send email with reset link
        // For now, log it (in production, use your email service)
        console.log(`Password reset link for admin ${admin.email}: ${resetLink}`);
        
        // In production, send email here using your email service
        // await sendEmail({
        //     to: admin.email,
        //     subject: 'Admin Password Reset Request',
        //     html: `Click here to reset your password: <a href="${resetLink}">${resetLink}</a>`
        // });
        
        res.json({ 
            success: true, 
            message: 'If an admin account exists with this email, a password reset link has been sent.',
            // In development, return the link for testing
            ...(process.env.NODE_ENV !== 'production' && { resetLink })
        });
    } catch (err) {
        console.error('Error in /api/admin/forgot-password:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Reset Password with Token
app.post('/api/admin/reset-password', async (req, res) => {
    try {
        const { token, email, newPassword } = req.body;
        
        if (!token || !email || !newPassword) {
            return res.status(400).json({ error: 'Token, email, and new password are required' });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        // Hash the token
        const hashedToken = hashVerificationToken(token);
        
        // Find admin with matching token
        const [users] = await pool.execute(
            'SELECT id, email, password_reset_expires FROM users WHERE email = ? AND role = "super_admin" AND password_reset_token = ?',
            [email, hashedToken]
        );
        
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        
        const admin = users[0];
        
        // Check if token has expired
        if (admin.password_reset_expires && new Date(admin.password_reset_expires) < new Date()) {
            return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password and clear reset token
        await pool.execute(
            'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
            [hashedPassword, admin.id]
        );
        
        // Get admin's restaurant_id for logging
        const [adminData] = await pool.execute('SELECT restaurant_id FROM users WHERE id = ?', [admin.id]);
        const restaurantId = adminData[0]?.restaurant_id || 0;
        
        // Log activity
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [restaurantId, admin.id, 'Password Reset', `Admin ${admin.email} reset password via forgot password link`]
            );
        } catch (logErr) {
            console.warn('Could not log activity:', logErr.message);
        }
        
        res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        console.error('Error in /api/admin/reset-password:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Update User Role
app.put('/api/admin/users/:id/role', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;
        
        if (!['owner', 'member', 'super_admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        await pool.execute(
            'UPDATE users SET role = ? WHERE id = ?',
            [role, userId]
        );
        
        // Log activity
        const adminUser = req.user;
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [adminUser.restaurant_id, adminUser.id, 'Role Updated', `Admin ${adminUser.name} changed user role to ${role}`]
            );
        } catch (logErr) {
            console.warn('Could not log activity:', logErr.message);
        }
        
        res.json({ success: true, role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get All Screens (Enhanced with Real Status)
app.get('/api/admin/screens', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const [screens] = await pool.execute(
            `SELECT s.*, 
                    COALESCE(s.code, s.screen_code) as code,
                    s.screen_code,
                    r.name as restaurant_name, 
                    r.email as restaurant_email
             FROM screens s
             LEFT JOIN restaurants r ON s.restaurant_id = r.id
             ORDER BY s.last_seen_at DESC, s.created_at DESC`
        );
        
        // Generate codes for screens that don't have them
        // Generate secure, non-guessable shortcode (Base32-like, excludes confusing chars)
        // Uses crypto.randomBytes for cryptographic randomness
        const generateCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Base32-like, excludes 0, O, I, 1
            let code = '';
            // Use crypto.randomBytes for better security than Math.random()
            const randomBytes = crypto.randomBytes(6);
            for (let i = 0; i < 6; i++) {
                code += chars[randomBytes[i] % chars.length];
            }
            return code;
        };
        
        for (const screen of screens) {
            if (!screen.code && !screen.screen_code) {
                // Screen has no code, generate one
                let newCode = generateCode();
                let codeExists = true;
                
                // Ensure code is unique
                while (codeExists) {
                    const [existing] = await pool.execute('SELECT id FROM screens WHERE code = ? OR screen_code = ?', [newCode, newCode]);
                    if (existing.length === 0) {
                        codeExists = false;
                    } else {
                        newCode = generateCode();
                    }
                }
                
                // Update screen with new code
                await pool.execute('UPDATE screens SET screen_code = ? WHERE id = ?', [newCode, screen.id]);
                screen.screen_code = newCode;
                screen.code = newCode;
            } else if (!screen.code && screen.screen_code) {
                // Has screen_code but not code alias
                screen.code = screen.screen_code;
            } else if (screen.code && !screen.screen_code) {
                // Has code but not screen_code, sync them
                await pool.execute('UPDATE screens SET screen_code = ? WHERE id = ?', [screen.code, screen.id]);
                screen.screen_code = screen.code;
            }
        }
        
        const now = Date.now();
        const TWO_MINUTES = 2 * 60 * 1000;
        
        const result = await Promise.all(screens.map(async (screen) => {
            const lastSeenAt = screen.last_seen_at ? new Date(screen.last_seen_at).getTime() : null;
            const timeSinceLastSeen = lastSeenAt ? (now - lastSeenAt) : Infinity;
            
            // Determine real status
            let status = 'offline';
            if (screen.is_disabled === 1 || screen.is_disabled === true) {
                status = 'disabled';
            } else if (screen.status === 'error') {
                status = 'error';
            } else if (timeSinceLastSeen < TWO_MINUTES) {
                // Check stored status from last ping
                if (screen.status === 'idle') {
                    status = 'idle';
                } else {
                    status = 'online';
                }
            }
            
            // Get recent activity count
            const [activityCount] = await pool.execute(
                'SELECT COUNT(*) as count FROM screen_activity_logs WHERE screen_id = ?',
                [screen.id]
            );
            
            // Get playlist count to determine if idle
            const [playlistCount] = await pool.execute(
                'SELECT COUNT(*) as count FROM screen_media WHERE screen_id = ?',
                [screen.id]
            );
            
            // Get screen code - try multiple sources
            const screenCode = screen.code || screen.screen_code || null;
            
            return {
                id: screen.id.toString(),
                name: screen.name,
                code: screenCode,
                screenCode: screenCode, // Also include as screenCode for compatibility
                restaurantId: screen.restaurant_id,
                restaurantName: screen.restaurant_name,
                restaurantEmail: screen.restaurant_email,
                lastSeenAt: lastSeenAt,
                status: status,
                isDisabled: screen.is_disabled === 1 || screen.is_disabled === true,
                playerVersion: screen.player_version || null,
                deviceBrowser: screen.device_browser || null,
                deviceOS: screen.device_os || null,
                screenResolution: screen.screen_resolution || null,
                screenOrientation: screen.screen_orientation || null,
                playlistCount: Number(playlistCount[0]?.count) || 0,
                activityCount: Number(activityCount[0]?.count) || 0,
                createdAt: new Date(screen.created_at).getTime()
            };
        }));
        
        res.json(result);
    } catch (err) {
        console.error('Error in /api/admin/screens:', err);
        if (err.code === 'ER_USER_LIMIT_REACHED') {
            res.status(503).json({ error: 'Database connection limit reached. Please wait a moment and try again.' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Admin: Disable Screen
app.put('/api/admin/screens/:id/disable', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const screenId = req.params.id;
        const { disabled } = req.body;
        const isDisabled = disabled !== undefined ? disabled : true;
        
        await pool.execute(
            'UPDATE screens SET is_disabled = ? WHERE id = ?',
            [isDisabled ? 1 : 0, screenId]
        );
        
        // Log activity
        await logScreenActivity(screenId, isDisabled ? 'disabled' : 'enabled', {
            admin: req.user.name,
            adminId: req.user.id
        });
        
        res.json({ success: true, disabled: isDisabled });
    } catch (err) {
        console.error('Error disabling screen:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Force Refresh Screen
app.post('/api/admin/screens/:id/refresh', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const screenId = req.params.id;
        
        await pool.execute(
            'UPDATE screens SET force_refresh = true WHERE id = ?',
            [screenId]
        );
        
        await logScreenActivity(screenId, 'force_refresh', {
            admin: req.user.name,
            adminId: req.user.id
        });
        
        res.json({ success: true, message: 'Screen will refresh on next heartbeat' });
    } catch (err) {
        console.error('Error forcing refresh:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Revoke Screen Pairing (Generate New Code)
app.post('/api/admin/screens/:id/revoke', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const screenId = req.params.id;
        
        // Generate new 6-character code
        // Generate secure, non-guessable shortcode (Base32-like, excludes confusing chars)
        // Uses crypto.randomBytes for cryptographic randomness
        const generateCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Base32-like, excludes 0, O, I, 1
            let code = '';
            // Use crypto.randomBytes for better security than Math.random()
            const randomBytes = crypto.randomBytes(6);
            for (let i = 0; i < 6; i++) {
                code += chars[randomBytes[i] % chars.length];
            }
            return code;
        };
        
        let newCode = generateCode();
        let codeExists = true;
        
        // Ensure code is unique - check both code and screen_code columns
        while (codeExists) {
            const [existingByCode] = await pool.execute('SELECT id FROM screens WHERE (code = ? OR screen_code = ?) AND id != ?', [newCode, newCode, screenId]);
            if (existingByCode.length === 0) {
                codeExists = false;
            } else {
                newCode = generateCode();
            }
        }
        
        // Update screen_code column (this is the actual column name in the database)
        await pool.execute('UPDATE screens SET screen_code = ?, updated_at = NOW() WHERE id = ?', [newCode, screenId]);
        
        // Also try to update code column if it exists (for backward compatibility)
        try {
            await pool.execute('UPDATE screens SET code = ? WHERE id = ?', [newCode, screenId]);
        } catch (err) {
            // Ignore if code column doesn't exist
            console.warn('Code column does not exist, using screen_code only:', err.message);
        }
        
        await logScreenActivity(screenId, 'code_revoked', {
            admin: req.user.name,
            adminId: req.user.id,
            newCode: newCode
        });
        
        res.json({ success: true, newCode: newCode });
    } catch (err) {
        console.error('Error revoking screen code:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get Screen Activity Log
app.get('/api/admin/screens/:id/activity', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const screenId = req.params.id;
        const limit = parseInt(req.query.limit) || 20;
        
        const [activities] = await pool.execute(
            'SELECT * FROM screen_activity_logs WHERE screen_id = ? ORDER BY created_at DESC LIMIT ?',
            [screenId, limit]
        );
        
        const result = activities.map(activity => ({
            id: activity.id,
            eventType: activity.event_type,
            eventDetails: activity.event_details ? JSON.parse(activity.event_details) : null,
            timestamp: new Date(activity.created_at).getTime()
        }));
        
        res.json(result);
    } catch (err) {
        console.error('Error fetching screen activity:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Detect Duplicate Screen Usage
app.get('/api/admin/screens/duplicates', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        // Find screens with multiple recent pings from different IPs or locations
        // This is a simplified version - in production, you'd track IP addresses
        const [screens] = await pool.execute(
            `SELECT s.id, s.code, s.name, s.last_seen_at, COUNT(DISTINCT DATE(s.last_seen_at)) as unique_days
             FROM screens s
             WHERE s.last_seen_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY s.id, s.code, s.name, s.last_seen_at
             HAVING unique_days > 1
             ORDER BY s.last_seen_at DESC`
        );
        
        res.json(screens.map(s => ({
            screenId: s.id.toString(),
            code: s.code,
            name: s.name,
            lastSeenAt: new Date(s.last_seen_at).getTime(),
            suspiciousDays: s.unique_days
        })));
    } catch (err) {
        console.error('Error detecting duplicates:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Clear Restaurant Storage
app.post('/api/admin/restaurants/:id/clear-storage', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const restaurantId = req.params.id;
        
        // Delete all media files for this restaurant
        const [mediaFiles] = await pool.execute(
            'SELECT id, file_path FROM media WHERE restaurant_id = ?',
            [restaurantId]
        );
        
        // Delete files from disk (if needed)
        // Note: This is a dangerous operation - should be logged
        await pool.execute(
            'DELETE FROM media WHERE restaurant_id = ?',
            [restaurantId]
        );
        
        // Log activity
        const adminUser = req.user;
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [restaurantId, adminUser.id, 'Storage Cleared', `Admin ${adminUser.name} cleared all storage for restaurant`]
            );
        } catch (logErr) {
            console.warn('Could not log activity:', logErr.message);
        }
        
        res.json({ success: true, deletedFiles: mediaFiles.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Disable Public Playback
app.put('/api/admin/restaurants/:id/playback', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { enabled } = req.body;
        const restaurantId = req.params.id;
        
        // Check if playback_enabled column exists, if not use account_status
        let hasPlaybackColumn = false;
        try {
            await pool.execute('SELECT playback_enabled FROM restaurants LIMIT 1');
            hasPlaybackColumn = true;
        } catch (err) {
            // Column doesn't exist, we'll use account_status
        }
        
        if (hasPlaybackColumn) {
            await pool.execute(
                'UPDATE restaurants SET playback_enabled = ? WHERE id = ?',
                [enabled ? 1 : 0, restaurantId]
            );
        } else {
            // Use account_status as fallback
            // If enabling, set to 'active', if disabling, set to 'suspended'
            const status = enabled ? 'active' : 'suspended';
            await pool.execute(
                'UPDATE restaurants SET account_status = ? WHERE id = ?',
                [status, restaurantId]
            );
        }
        
        // Log activity
        const adminUser = req.user;
        try {
            await pool.execute(
                'INSERT INTO activity_logs (restaurant_id, user_id, action, details) VALUES (?, ?, ?, ?)',
                [restaurantId, adminUser.id, 'Playback Control', `Admin ${adminUser.name} ${enabled ? 'enabled' : 'disabled'} public playback for restaurant`]
            );
        } catch (logErr) {
            console.warn('Could not log activity:', logErr.message);
        }
        
        res.json({ success: true, playbackEnabled: enabled });
    } catch (err) {
        console.error('Error updating playback status:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get System Health
app.get('/api/admin/health', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        // Check database connection
        let dbStatus = 'connected';
        try {
            await pool.execute('SELECT 1');
        } catch (err) {
            dbStatus = 'disconnected';
        }
        
        // Get active screens count
        const [activeScreensRows] = await pool.execute(
            'SELECT COUNT(*) as count FROM screens WHERE last_seen_at IS NOT NULL AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)'
        );
        const activeScreens = Number(activeScreensRows[0]?.count) || 0;
        
        // Get total screens
        const [totalScreensRows] = await pool.execute('SELECT COUNT(*) as count FROM screens');
        const totalScreens = Number(totalScreensRows[0]?.count) || 0;
        
        res.json({
            backend: 'online',
            database: dbStatus,
            activeScreens: activeScreens,
            totalScreens: totalScreens,
            timestamp: Date.now()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get All Users (Enhanced)
app.get('/api/admin/users/all', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        // Use a safe query that doesn't rely on optional columns
        // Only select columns that definitely exist in the users table
        const [users] = await pool.execute(
            `SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.restaurant_id,
                r.name as restaurant_name, 
                r.plan as restaurant_plan, 
                r.account_status as restaurant_status
             FROM users u
             LEFT JOIN restaurants r ON u.restaurant_id = r.id
             ORDER BY u.id DESC`
        );
        
        const result = users.map(user => ({
            id: user.id.toString(),
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'member',
            authMethod: 'local', // Default value
            isVerified: true, // Default value
            restaurantId: user.restaurant_id,
            restaurantName: user.restaurant_name || '',
            restaurantPlan: user.restaurant_plan || 'free',
            restaurantStatus: user.restaurant_status || 'active',
            createdAt: Date.now() // Default to current time if created_at doesn't exist
        }));
        
        res.json(result);
    } catch (err) {
        console.error('Error in /api/admin/users/all:', err);
        console.error('Error stack:', err.stack);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        if (err.code === 'ER_USER_LIMIT_REACHED') {
            res.status(503).json({ error: 'Database connection limit reached. Please wait a moment and try again.' });
        } else if (err.code === 'ER_BAD_FIELD_ERROR') {
            // If there's still a column error, try the most basic query
            try {
                const [users] = await pool.execute(
                    `SELECT 
                        u.id, 
                        u.name, 
                        u.email, 
                        u.role, 
                        u.restaurant_id
                     FROM users u
                     ORDER BY u.id DESC`
                );
                
                const result = users.map(user => ({
                    id: user.id.toString(),
                    name: user.name || '',
                    email: user.email || '',
                    role: user.role || 'member',
                    authMethod: 'local',
                    isVerified: true,
                    restaurantId: user.restaurant_id,
                    restaurantName: '',
                    restaurantPlan: 'free',
                    restaurantStatus: 'active',
                    createdAt: Date.now()
                }));
                
                res.json(result);
            } catch (retryErr) {
                console.error('Retry query also failed:', retryErr);
                res.status(500).json({ 
                    error: retryErr.message || 'Internal server error',
                    details: process.env.NODE_ENV === 'development' ? retryErr.stack : undefined
                });
            }
        } else {
            res.status(500).json({ 
                error: err.message || 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        }
    }
});

// Admin: Get all feature requests and upgrade requests
app.get('/api/admin/feature-requests', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        // Check if feature_requests table exists
        let hasTable = true;
        try {
            await pool.execute('SELECT * FROM feature_requests LIMIT 1');
        } catch (err) {
            hasTable = false;
        }

        if (!hasTable) {
            return res.json([]);
        }

        // Get all feature requests with user and restaurant info
        const [requests] = await pool.execute(
            `SELECT 
                fr.*,
                u.name as user_name,
                u.email as user_email,
                r.name as restaurant_name
             FROM feature_requests fr
             LEFT JOIN users u ON fr.user_id = u.id
             LEFT JOIN restaurants r ON fr.restaurant_id = r.id
             ORDER BY fr.created_at DESC`
        );

        res.json(requests.map((req) => ({
            id: req.id,
            restaurantId: req.restaurant_id,
            userId: req.user_id,
            userName: req.user_name,
            userEmail: req.user_email,
            restaurantName: req.restaurant_name,
            requestType: req.request_type,
            title: req.title,
            description: req.description,
            category: req.category,
            requestedPlan: req.requested_plan,
            currentPlan: req.current_plan,
            status: req.status,
            adminNotes: req.admin_notes,
            createdAt: req.created_at,
            updatedAt: req.updated_at
        })));
    } catch (err) {
        console.error('Error fetching feature requests:', err);
        res.status(500).json({ error: err.message });
    }
});

// Admin: Update feature request status
app.put('/api/admin/feature-requests/:id/status', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        const requestId = req.params.id;

        if (!status || !['pending', 'reviewed', 'approved', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Valid status is required' });
        }

        // Check if feature_requests table exists
        let hasTable = true;
        try {
            await pool.execute('SELECT * FROM feature_requests LIMIT 1');
        } catch (err) {
            hasTable = false;
        }

        if (!hasTable) {
            return res.status(404).json({ error: 'Feature requests table not found' });
        }

        // Update request status
        await pool.execute(
            'UPDATE feature_requests SET status = ?, admin_notes = ? WHERE id = ?',
            [status, adminNotes || null, requestId]
        );

        // If approved and it's an upgrade request, optionally auto-upgrade
        if (status === 'approved') {
            const [requests] = await pool.execute(
                'SELECT * FROM feature_requests WHERE id = ?',
                [requestId]
            );
            if (requests.length > 0 && requests[0].request_type === 'upgrade' && requests[0].requested_plan) {
                // Auto-upgrade the user
                const planLimits = {
                    'free': 1,
                    'basic': 3,
                    'pro': -1
                };
                const maxScreens = planLimits[requests[0].requested_plan] || 1;
                await pool.execute(
                    'UPDATE restaurants SET plan = ?, max_screens = ? WHERE id = ?',
                    [requests[0].requested_plan, maxScreens, requests[0].restaurant_id]
                );
                // Trigger user update event
                // Note: This will be handled by the frontend refresh
            }
        }

        res.json({ success: true, status });
    } catch (err) {
        console.error('Error updating feature request status:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// ADMIN EMAIL CONTROL ENDPOINTS
// ============================================

// Create email_settings and email_logs tables if they don't exist
const initEmailTables = async () => {
    try {
        // Email Settings Table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS email_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                smtp_enabled BOOLEAN DEFAULT true,
                smtp_host VARCHAR(255) DEFAULT 'smtp.gmail.com',
                smtp_port INT DEFAULT 587,
                smtp_encryption VARCHAR(10) DEFAULT 'TLS',
                smtp_user VARCHAR(255) DEFAULT '',
                smtp_pass VARCHAR(255) DEFAULT '',
                from_name VARCHAR(255) DEFAULT 'MENUPI',
                from_email VARCHAR(255) DEFAULT 'support@menupi.com',
                reply_to VARCHAR(255) DEFAULT 'support@menupi.com',
                support_email VARCHAR(255) DEFAULT 'support@menupi.com',
                last_successful_send TIMESTAMP NULL,
                last_failure_reason TEXT NULL,
                email_queue_status VARCHAR(20) DEFAULT 'idle',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Email Type Toggles Table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS email_type_toggles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email_type VARCHAR(50) UNIQUE NOT NULL,
                enabled BOOLEAN DEFAULT true,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Initialize email type toggles if empty
        const [existing] = await pool.execute('SELECT COUNT(*) as count FROM email_type_toggles');
        if (existing[0].count === 0) {
            const types = [
                'account_created', 'password_reset', 'user_invitation', 
                'plan_expiry_warning', 'account_suspended', 'account_reactivated',
                'plan_expired', 'plan_extended', 'plan_expiry_reminder'
            ];
            for (const type of types) {
                await pool.execute(
                    'INSERT INTO email_type_toggles (email_type, enabled) VALUES (?, ?) ON DUPLICATE KEY UPDATE enabled = enabled',
                    [type, true]
                );
            }
        }
        
        // Email Logs Table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS email_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email_type VARCHAR(50) NOT NULL,
                recipient VARCHAR(255) NOT NULL,
                status VARCHAR(20) NOT NULL,
                error_message TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_email_type (email_type),
                INDEX idx_recipient (recipient),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Initialize email settings if empty
        const [settingsCount] = await pool.execute('SELECT COUNT(*) as count FROM email_settings');
        if (settingsCount[0].count === 0) {
            await pool.execute(`
                INSERT INTO email_settings (smtp_enabled, smtp_host, smtp_port, smtp_encryption, from_name, from_email, reply_to, support_email)
                VALUES (true, 'smtp.gmail.com', 587, 'TLS', 'MENUPI', 'support@menupi.com', 'support@menupi.com', 'support@menupi.com')
            `);
        }
    } catch (err) {
        console.warn('Could not initialize email tables:', err.message);
    }
};

// Initialize email tables on server start
initEmailTables();

// GET Email Settings
app.get('/api/admin/email/settings', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const [settings] = await pool.execute('SELECT * FROM email_settings LIMIT 1');
        const [toggles] = await pool.execute('SELECT * FROM email_type_toggles');
        
        const emailTypes = {};
        toggles.forEach(t => {
            emailTypes[t.email_type] = t.enabled === 1 || t.enabled === true;
        });
        
        if (settings.length === 0) {
            return res.json({
                smtpEnabled: true,
                smtpHost: 'smtp.gmail.com',
                smtpPort: 587,
                smtpEncryption: 'TLS',
                smtpUser: '',
                smtpPass: '',
                fromName: 'MENUPI',
                fromEmail: 'support@menupi.com',
                replyTo: 'support@menupi.com',
                supportEmail: 'support@menupi.com',
                lastSuccessfulSend: null,
                lastFailureReason: null,
                emailQueueStatus: 'idle',
                emailTypes: emailTypes
            });
        }
        
        const s = settings[0];
        res.json({
            smtpEnabled: s.smtp_enabled === 1 || s.smtp_enabled === true,
            smtpHost: s.smtp_host || 'smtp.gmail.com',
            smtpPort: s.smtp_port || 587,
            smtpEncryption: s.smtp_encryption || 'TLS',
            smtpUser: s.smtp_user || '',
            smtpPass: '', // Never return password
            fromName: s.from_name || 'MENUPI',
            fromEmail: s.from_email || 'support@menupi.com',
            replyTo: s.reply_to || 'support@menupi.com',
            supportEmail: s.support_email || 'support@menupi.com',
            lastSuccessfulSend: s.last_successful_send ? new Date(s.last_successful_send).getTime() : null,
            lastFailureReason: s.last_failure_reason || null,
            emailQueueStatus: s.email_queue_status || 'idle',
            emailTypes: emailTypes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE Email Settings
app.put('/api/admin/email/settings', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const {
            smtpEnabled, smtpHost, smtpPort, smtpEncryption, smtpUser, smtpPass,
            fromName, fromEmail, replyTo, supportEmail
        } = req.body;
        
        const [existing] = await pool.execute('SELECT id FROM email_settings LIMIT 1');
        
        if (existing.length === 0) {
            await pool.execute(`
                INSERT INTO email_settings (smtp_enabled, smtp_host, smtp_port, smtp_encryption, smtp_user, smtp_pass, from_name, from_email, reply_to, support_email)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [smtpEnabled, smtpHost, smtpPort, smtpEncryption, smtpUser, smtpPass || '', fromName, fromEmail, replyTo, supportEmail]);
        } else {
            const updateFields = [];
            const updateValues = [];
            
            if (smtpEnabled !== undefined) { updateFields.push('smtp_enabled = ?'); updateValues.push(smtpEnabled); }
            if (smtpHost !== undefined) { updateFields.push('smtp_host = ?'); updateValues.push(smtpHost); }
            if (smtpPort !== undefined) { updateFields.push('smtp_port = ?'); updateValues.push(smtpPort); }
            if (smtpEncryption !== undefined) { updateFields.push('smtp_encryption = ?'); updateValues.push(smtpEncryption); }
            if (smtpUser !== undefined) { updateFields.push('smtp_user = ?'); updateValues.push(smtpUser); }
            if (smtpPass !== undefined && smtpPass !== '') { updateFields.push('smtp_pass = ?'); updateValues.push(smtpPass); }
            if (fromName !== undefined) { updateFields.push('from_name = ?'); updateValues.push(fromName); }
            if (fromEmail !== undefined) { updateFields.push('from_email = ?'); updateValues.push(fromEmail); }
            if (replyTo !== undefined) { updateFields.push('reply_to = ?'); updateValues.push(replyTo); }
            if (supportEmail !== undefined) { updateFields.push('support_email = ?'); updateValues.push(supportEmail); }
            
            if (updateFields.length > 0) {
                updateValues.push(existing[0].id);
                await pool.execute(
                    `UPDATE email_settings SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );
            }
        }
        
        res.json({ success: true, message: 'Email settings updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE Email Type Toggles
app.put('/api/admin/email/types', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { emailTypes } = req.body;
        
        for (const [type, enabled] of Object.entries(emailTypes)) {
            await pool.execute(
                'INSERT INTO email_type_toggles (email_type, enabled) VALUES (?, ?) ON DUPLICATE KEY UPDATE enabled = ?',
                [type, enabled, enabled]
            );
        }
        
        res.json({ success: true, message: 'Email type toggles updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TEST SMTP Connection
app.post('/api/admin/email/test', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const [settings] = await pool.execute('SELECT * FROM email_settings LIMIT 1');
        
        if (settings.length === 0) {
            return res.status(400).json({ error: 'SMTP settings not configured' });
        }
        
        const s = settings[0];
        
        if (!s.smtp_enabled) {
            return res.status(400).json({ error: 'SMTP is disabled' });
        }
        
        // For now, just log the test (in production, use nodemailer to actually test)
        console.log('SMTP Test Request:', {
            host: s.smtp_host,
            port: s.smtp_port,
            encryption: s.smtp_encryption,
            user: s.smtp_user
        });
        
        // Update last successful send (simulated)
        await pool.execute(
            'UPDATE email_settings SET last_successful_send = NOW(), last_failure_reason = NULL WHERE id = ?',
            [settings[0].id]
        );
        
        // Log email
        const adminEmail = req.user.email;
        await pool.execute(
            'INSERT INTO email_logs (email_type, recipient, status) VALUES (?, ?, ?)',
            ['test', adminEmail, 'sent']
        );
        
        res.json({ 
            success: true, 
            message: 'SMTP test email sent successfully (simulated)',
            note: 'In production, this will send an actual test email using nodemailer'
        });
    } catch (err) {
        // Update last failure
        try {
            const [settings] = await pool.execute('SELECT id FROM email_settings LIMIT 1');
            if (settings.length > 0) {
                await pool.execute(
                    'UPDATE email_settings SET last_failure_reason = ? WHERE id = ?',
                    [err.message, settings[0].id]
                );
            }
        } catch (updateErr) {
            console.error('Failed to update failure reason:', updateErr);
        }
        
        res.status(500).json({ error: err.message });
    }
});

// GET Email Logs
app.get('/api/admin/email/logs', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const [logs] = await pool.execute(
            'SELECT * FROM email_logs ORDER BY created_at DESC LIMIT ?',
            [limit]
        );
        
        res.json(logs.map(log => ({
            id: log.id,
            emailType: log.email_type,
            recipient: log.recipient,
            status: log.status,
            errorMessage: log.error_message,
            timestamp: new Date(log.created_at).getTime()
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SEND Email (Admin Trigger)
app.post('/api/admin/email/send', authenticateToken, authenticateAdmin, async (req, res) => {
    try {
        const { emailType, recipient, subject, body } = req.body;
        
        // Check if email type is enabled
        const [toggle] = await pool.execute(
            'SELECT enabled FROM email_type_toggles WHERE email_type = ?',
            [emailType]
        );
        
        if (toggle.length === 0 || !toggle[0].enabled) {
            return res.status(400).json({ error: `Email type ${emailType} is disabled` });
        }
        
        // Check SMTP settings
        const [settings] = await pool.execute('SELECT smtp_enabled FROM email_settings LIMIT 1');
        if (settings.length === 0 || !settings[0].smtp_enabled) {
            return res.status(400).json({ error: 'SMTP is disabled' });
        }
        
        // For now, just log (in production, use nodemailer)
        console.log('Email Send Request:', { emailType, recipient, subject });
        
        // Update last successful send
        await pool.execute(
            'UPDATE email_settings SET last_successful_send = NOW(), last_failure_reason = NULL WHERE id = ?',
            [settings[0].id]
        );
        
        // Log email
        await pool.execute(
            'INSERT INTO email_logs (email_type, recipient, status) VALUES (?, ?, ?)',
            [emailType, recipient, 'sent']
        );
        
        res.json({ 
            success: true, 
            message: 'Email sent successfully (simulated)',
            note: 'In production, this will send an actual email using nodemailer'
        });
    } catch (err) {
        // Log failure
        try {
            await pool.execute(
                'INSERT INTO email_logs (email_type, recipient, status, error_message) VALUES (?, ?, ?, ?)',
                [req.body.emailType || 'unknown', req.body.recipient || 'unknown', 'failed', err.message]
            );
        } catch (logErr) {
            console.error('Failed to log email error:', logErr);
        }
        
        res.status(500).json({ error: err.message });
    }
});

// Initialize screen metadata and activity log tables
const initScreenTables = async () => {
    try {
        // Ensure last_seen_at column exists
        try {
            await pool.execute('SELECT last_seen_at FROM screens LIMIT 1');
        } catch (err) {
            await pool.execute('ALTER TABLE screens ADD COLUMN last_seen_at TIMESTAMP NULL AFTER updated_at');
            console.log('Added last_seen_at column to screens table');
        }
        
        // Add metadata columns to screens table
        try {
            await pool.execute('SELECT player_version FROM screens LIMIT 1');
        } catch (err) {
            await pool.execute(`
                ALTER TABLE screens 
                ADD COLUMN player_version VARCHAR(50) NULL,
                ADD COLUMN device_browser VARCHAR(100) NULL,
                ADD COLUMN device_os VARCHAR(100) NULL,
                ADD COLUMN screen_resolution VARCHAR(50) NULL,
                ADD COLUMN screen_orientation VARCHAR(20) NULL,
                ADD COLUMN is_disabled BOOLEAN DEFAULT false,
                ADD COLUMN force_refresh BOOLEAN DEFAULT false,
                ADD COLUMN status VARCHAR(20) DEFAULT 'offline'
            `);
            console.log('Added screen metadata columns');
        }
        
        // Create screen_activity_log table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS screen_activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                screen_id INT NOT NULL,
                event_type VARCHAR(50) NOT NULL,
                event_details TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_screen_id (screen_id),
                INDEX idx_event_type (event_type),
                INDEX idx_created_at (created_at),
                FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('Screen activity logs table ready');
    } catch (err) {
        console.warn('Could not initialize screen tables:', err.message);
    }
};

// Initialize on server start
initScreenTables();

// Helper function to log screen activity
const logScreenActivity = async (screenId, eventType, eventDetails = null) => {
    try {
        await pool.execute(
            'INSERT INTO screen_activity_logs (screen_id, event_type, event_details) VALUES (?, ?, ?)',
            [screenId, eventType, eventDetails ? JSON.stringify(eventDetails) : null]
        );
    } catch (err) {
        console.warn('Could not log screen activity:', err.message);
    }
};

// --- SCREEN PING (Heartbeat) ---
// This endpoint is called every 30-60 seconds by the public player
// Stores heartbeat, metadata, and determines real-time status

app.post('/api/screens/:id/ping', async (req, res) => {
    const screenId = req.params.id;
    try {
        const { 
            playerVersion, 
            browser, 
            os, 
            resolution, 
            orientation,
            playlistCount,
            hasError 
        } = req.body || {};
        
        // Get current screen state
        const [screens] = await pool.execute('SELECT * FROM screens WHERE id = ?', [screenId]);
        if (screens.length === 0) {
            return res.status(404).json({ error: 'Screen not found' });
        }
        
        const screen = screens[0];
        
        // Check if screen is disabled
        if (screen.is_disabled === 1 || screen.is_disabled === true) {
            return res.status(403).json({ error: 'Screen is disabled' });
        }
        
        // Determine status based on conditions
        let status = 'online';
        if (hasError) {
            status = 'error';
        } else if (!playlistCount || playlistCount === 0) {
            status = 'idle';
        }
        
        // Update screen with heartbeat and metadata
        await pool.execute(
            `UPDATE screens SET 
                last_seen_at = NOW(),
                player_version = ?,
                device_browser = ?,
                device_os = ?,
                screen_resolution = ?,
                screen_orientation = ?,
                status = ?,
                force_refresh = false
            WHERE id = ?`,
            [
                playerVersion || null,
                browser || null,
                os || null,
                resolution || null,
                orientation || null,
                status,
                screenId
            ]
        );
        
        // Log activity (only important state changes)
        const previousStatus = screen.status || 'offline';
        if (previousStatus !== status) {
            await logScreenActivity(screenId, status === 'error' ? 'error' : 'status_changed', {
                from: previousStatus,
                to: status
            });
        }
        
        // Check for force refresh flag
        const needsRefresh = screen.force_refresh === 1 || screen.force_refresh === true;
        
        // Check if request is from sendBeacon
        const contentType = req.get('Content-Type') || '';
        const isSendBeacon = contentType.includes('text/plain') || !req.body || Object.keys(req.body || {}).length === 0;
        
        if (isSendBeacon) {
            res.status(204).send();
        } else {
            res.json({ 
                success: true, 
                timestamp: Date.now(),
                needsRefresh: needsRefresh
            });
        }
    } catch (err) {
        console.error('Ping error:', err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`MENUPI Digital Signage API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
