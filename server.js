require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB  = require('./config/db');
const passport   = require('./config/passport');

// ============================================================
// CONNECT TO DATABASE
// ============================================================
connectDB();

const app = express();
app.set('trust proxy', true); // Trust the reverse proxy (Render) to correctly resolve HTTPS redirects

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(helmet());                   // Set secure HTTP headers
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:4200',
    'http://localhost:3000'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl)
        if (!origin) return callback(null, true);
        
        // Dynamically allow any verified Vercel preview or production deployment (.vercel.app)
        const isVercel = /\.vercel\.app$/.test(origin);
        if (allowedOrigins.indexOf(origin) !== -1 || isVercel) {
            return callback(null, true);
        } else {
            const errorMsg = `The CORS policy for this site does not allow access from origin: ${origin}`;
            return callback(new Error(errorMsg), false);
        }
    },
    credentials: true                // Allow cookies across origins
}));

// ============================================================
// BODY PARSERS
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());             // Parse HTTP-only JWT cookies

// ============================================================
// PASSPORT INIT (no sessions — stateless JWT only)
// ============================================================
app.use(passport.initialize());

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/admin',   require('./routes/admin'));
app.use('/api/student', require('./routes/student'));
app.use('/api/faculty', require('./routes/faculty'));


// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
    res.status(200).json({
        success:     true,
        message:     'IIIT Ranchi Faculty Feedback System — API is running',
        version:     '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp:   new Date().toISOString()
    });
});

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    console.error(`❌ [${new Date().toISOString()}] ${err.message}`);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: Object.values(err.errors).map(e => e.message).join(', ')
        });
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({ success: false, message: `${field} already exists` });
    }

    res.status(statusCode).json({
        success:   false,
        message:   err.message || 'Internal Server Error',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 IIIT Ranchi Feedback API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health\n`);
});
