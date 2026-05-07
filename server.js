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


const mongoose = require('mongoose');
const os = require('os');

// ============================================================
// HEALTH CHECK TELEMETRY DASHBOARD
// ============================================================
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    const dbColor = mongoose.connection.readyState === 1 ? 'text-emerald-400' : 'text-rose-500';
    const dbIndicator = mongoose.connection.readyState === 1 ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50';

    const systemInfo = {
        success:     true,
        message:     'IIIT Ranchi Faculty Feedback System — API is running',
        version:     '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database:    dbStatus,
        uptime:      os.uptime(),
        memory: {
            free:  `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
            total: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
            usage: `${((1 - os.freemem() / os.totalmem()) * 100).toFixed(1)}%`
        },
        loadAverage: os.loadavg(),
        timestamp:   new Date().toISOString()
    };

    // If browser visits, render a beautiful cybernetic health dashboard
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
        res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="dark">
    <title>IIIT Ranchi — System Health Status</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #030712;
            --card-bg: rgba(15, 23, 42, 0.7);
            --border: rgba(255, 255, 255, 0.08);
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
            --brand: #6366f1;
            --brand-glow: rgba(99, 102, 241, 0.15);
            --emerald: #10b981;
            --rose: #ef4444;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background: radial-gradient(circle at center, #0b0f19 0%, #030712 100%);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            overflow-x: hidden;
        }

        .container {
            width: 100%;
            max-width: 900px;
            position: relative;
        }

        .aurora-1 {
            position: absolute;
            top: -100px;
            left: -100px;
            width: 300px;
            height: 300px;
            border-radius: 50%;
            background: rgba(99, 102, 241, 0.1);
            filter: blur(80px);
            pointer-events: none;
        }

        .aurora-2 {
            position: absolute;
            bottom: -100px;
            right: -100px;
            width: 300px;
            height: 300px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.1);
            filter: blur(80px);
            pointer-events: none;
        }

        .dashboard {
            background: var(--card-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 2.5rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            position: relative;
            overflow: hidden;
        }

        .header {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 1.5rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--border);
        }

        @media (max-width: 640px) {
            .header {
                flex-direction: column;
                align-items: flex-start;
            }
            .header-right {
                align-items: flex-start !important;
            }
        }

        .logo-section {
            display: flex;
            align-items: center;
            gap: 1.25rem;
        }

        /* Spinning Atom Ring Visualizer */
        .atom-logo {
            position: relative;
            width: 64px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .ring-1 {
            position: absolute;
            inset: 0;
            border: 1px dashed rgba(99, 102, 241, 0.3);
            border-radius: 50%;
            animation: orbit-cw 15s linear infinite;
        }

        .ring-2 {
            position: absolute;
            inset: 8px;
            border: 1px dotted rgba(16, 185, 129, 0.4);
            border-radius: 50%;
            animation: orbit-ccw 8s linear infinite;
        }

        .nucleus {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.5);
        }

        .nucleus span {
            font-size: 9px;
            font-weight: 800;
            color: #030712;
        }

        .title-area h1 {
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: -0.025em;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .badge-node {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.05em;
            background: rgba(99, 102, 241, 0.1);
            color: #818cf8;
            border: 1px solid rgba(99, 102, 241, 0.2);
            padding: 2px 8px;
            border-radius: 9999px;
        }

        .title-area p {
            font-size: 13px;
            color: var(--text-secondary);
            margin-top: 4px;
        }

        .header-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0.5rem;
        }

        .active-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(16, 185, 129, 0.1);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.2);
            padding: 6px 14px;
            border-radius: 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 700;
        }

        .pulse-dot {
            position: relative;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--emerald);
            box-shadow: 0 0 8px var(--emerald);
        }

        .pulse-dot::after {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 2px solid var(--emerald);
            animation: pulse-ring 1.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
        }

        .meta-info {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-muted);
        }

        /* Diagnostic Core Cards Grid */
        .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            padding: 2rem 0;
        }

        @media (max-width: 800px) {
            .grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 480px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }

        .card {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.25rem;
            transition: all 0.2s ease-in-out;
        }

        .card:hover {
            border-color: rgba(99, 102, 241, 0.3);
            background: rgba(255, 255, 255, 0.03);
            transform: translateY(-2px);
        }

        .card-icon {
            font-size: 1.5rem;
            margin-bottom: 0.75rem;
            display: block;
        }

        .card-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
        }

        .card-value {
            font-size: 1.25rem;
            font-weight: 700;
            margin-top: 4px;
            color: #fff;
        }

        .text-emerald {
            color: var(--emerald) !important;
        }

        .text-rose {
            color: var(--rose) !important;
        }

        .text-indigo {
            color: #818cf8 !important;
        }

        .font-mono-val {
            font-family: 'JetBrains Mono', monospace;
        }

        .card-sub {
            font-size: 10px;
            color: var(--text-muted);
            margin-top: 4px;
            display: block;
        }

        /* Diagnostic stream section */
        .diagnostic-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0.75rem;
        }

        .diagnostic-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
        }

        .refresh-btn {
            background: none;
            border: none;
            color: var(--brand);
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            transition: opacity 0.2s;
        }

        .refresh-btn:hover {
            opacity: 0.8;
            text-decoration: underline;
        }

        .terminal {
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1rem;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #cbd5e1;
            max-height: 150px;
            overflow-y: auto;
            line-height: 1.5;
        }

        .log-entry {
            margin-bottom: 4px;
        }

        .log-time {
            color: var(--text-muted);
        }

        .log-info {
            color: #34d399;
            font-weight: 700;
        }

        .log-debug {
            color: #60a5fa;
            font-weight: 700;
        }

        .log-white {
            color: #f1f5f9;
        }

        /* Animations */
        @keyframes orbit-cw {
            100% { transform: rotate(360deg); }
        }

        @keyframes orbit-ccw {
            100% { transform: rotate(-360deg); }
        }

        @keyframes pulse-ring {
            0% { transform: scale(0.33); opacity: 1; }
            80%, 100% { opacity: 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="aurora-1"></div>
        <div class="aurora-2"></div>

        <div class="dashboard">
            <!-- Header Section -->
            <div class="header">
                <div class="logo-section">
                    <div class="atom-logo">
                        <div class="ring-1"></div>
                        <div class="ring-2"></div>
                        <div class="nucleus">
                            <span>IT</span>
                        </div>
                    </div>
                    <div class="title-area">
                        <h1>
                            IIIT Ranchi <span class="badge-node">API Server</span>
                        </h1>
                        <p>Platform operations, database connectivity, and telemetry metrics dashboard.</p>
                    </div>
                </div>
                <div class="header-right">
                    <div class="active-badge">
                        <div class="pulse-dot"></div>
                        API ACTIVE
                    </div>
                    <span class="meta-info">v${systemInfo.version} — ${systemInfo.environment}</span>
                </div>
            </div>

            <!-- Diagnostic Cards Grid -->
            <div class="grid">
                <!-- Database status -->
                <div class="card">
                    <span class="card-icon">🗄️</span>
                    <h3 class="card-title">Database</h3>
                    <p class="card-value ${mongoose.connection.readyState === 1 ? 'text-emerald' : 'text-rose'}">${dbStatus}</p>
                    <span class="card-sub font-mono-val">Mongoose socket</span>
                </div>

                <!-- RAM Usage -->
                <div class="card">
                    <span class="card-icon">🧠</span>
                    <h3 class="card-title">RAM Usage</h3>
                    <p class="card-value font-mono-val">${systemInfo.memory.usage}</p>
                    <span class="card-sub font-mono-val">${systemInfo.memory.free} Free of ${systemInfo.memory.total}</span>
                </div>

                <!-- CPU Load average -->
                <div class="card">
                    <span class="card-icon">⚡</span>
                    <h3 class="card-title">Load Avg</h3>
                    <p class="card-value text-indigo font-mono-val">${systemInfo.loadAverage[0].toFixed(2)}</p>
                    <span class="card-sub font-mono-val">1m load index</span>
                </div>

                <!-- Server uptime -->
                <div class="card">
                    <span class="card-icon">⏱️</span>
                    <h3 class="card-title">Uptime</h3>
                    <p class="card-value text-emerald font-mono-val" id="uptime-val">${Math.floor(systemInfo.uptime)}s</p>
                    <span class="card-sub font-mono-val">Service duration</span>
                </div>
            </div>

            <!-- Terminal Diagnostic Logs -->
            <div class="diagnostic-section">
                <div class="diagnostic-header">
                    <span class="diagnostic-title">Diagnostic Stream</span>
                    <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh Telemetry</button>
                </div>
                <div class="terminal">
                    <div class="log-entry">
                        <span class="log-time">[${new Date().toISOString()}]</span>
                        <span class="log-info">INFO</span>: Telemetry stream initialized successfully.
                    </div>
                    <div class="log-entry">
                        <span class="log-time">[${new Date().toISOString()}]</span>
                        <span class="log-info">INFO</span>: MongoDB session link: <span class="log-white font-mono-val">${dbStatus}</span>
                    </div>
                    <div class="log-entry">
                        <span class="log-time">[${new Date().toISOString()}]</span>
                        <span class="log-info">INFO</span>: Active CPU cores: <span class="log-white font-mono-val">${os.arch()}</span> on <span class="log-white">${os.platform()}</span>
                    </div>
                    <div class="log-entry">
                        <span class="log-time">[${new Date().toISOString()}]</span>
                        <span class="log-debug">DEBUG</span>: Express request route completed with code HTTP 200 OK.
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Live Uptime Script -->
    <script>
        let uptimeSec = ${Math.floor(systemInfo.uptime)};
        setInterval(() => {
            uptimeSec++;
            const days = Math.floor(uptimeSec / (3600*24));
            const hours = Math.floor((uptimeSec % (3600*24)) / 3600);
            const minutes = Math.floor((uptimeSec % 3600) / 60);
            const seconds = uptimeSec % 60;
            
            let display = '';
            if (days > 0) display += days + 'd ';
            if (hours > 0) display += hours + 'h ';
            if (minutes > 0) display += minutes + 'm ';
            display += seconds + 's';
            
            document.getElementById('uptime-val').innerText = display;
        }, 1000);
    </script>
</body>
</html>
        `);
    } else {
        res.status(200).json(systemInfo);
    }
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
