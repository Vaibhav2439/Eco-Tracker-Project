// =================== ENV & IMPORTS ===================
require('dotenv').config();

const path = require('path');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');
const session = require('express-session');
const passport = require('../config/passport');
const config = require('./config');

// =================== MODELS ===================
let Activity = null;
let User = null;
let Message = null;

try { Activity = require('./models/Activity.model'); } catch (e) { Activity = null; }
try { User = require('./models/User.model'); } catch (e) { User = null; }
try { Message = require('./models/Message'); } catch (e) { Message = null; }

// =================== APP & SOCKET ===================
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

// =================== MIDDLEWARE ===================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =================== SESSION ===================
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// =================== PASSPORT ===================
app.use(passport.initialize());
app.use(passport.session());

// =================== EJS ===================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', '..', 'views'));

// =================== STATIC FILES ===================
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// =================== MAILER ===================
let transporter = null;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('📧 Email transporter created');
  } catch (e) {
    console.log('⚠️ Email transporter error:', e.message);
    transporter = null;
  }
} else {
  console.log('📧 Email not configured (missing credentials)');
}

// =================== SAFE ROUTE LOADER ===================
function extractRouter(mod) {
  if (!mod) return null;
  if (typeof mod === 'function' || (mod.use && typeof mod.use === 'function')) return mod;
  if (mod.default && (typeof mod.default === 'function' || (mod.default.use && typeof mod.default.use === 'function'))) return mod.default;
  return null;
}

function tryRegister(modulePath, mountPath, passIo = false) {
  try {
    const mod = require(modulePath);
    const candidate = extractRouter(mod);
    if (!candidate) throw new Error('No usable router export');

    if (typeof candidate === 'function') {
      const maybeRouter = passIo ? candidate(io) : candidate();
      app.use(mountPath, maybeRouter || candidate);
    } else {
      app.use(mountPath, candidate);
    }
    console.log(`✅ Mounted ${modulePath} → ${mountPath}`);
  } catch (e) {
    console.log(`⚠️ Failed to mount ${modulePath}:`, e.message);
  }
}

// =================== START SERVER ===================
async function startServer() {
  const PORT = process.env.PORT || (config && config.PORT) || 3000;

  // ===== MongoDB Connection for Atlas =====
  if (config && config.MONGO_URI) {
    try {
      console.log('🔄 Connecting to MongoDB Atlas...');
      
      await mongoose.connect(config.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 60000, // Increased timeout to 60 seconds
        socketTimeoutMS: 60000, // Increased socket timeout to 60 seconds
        family: 4
      });
      
      console.log('✅ Connected to MongoDB Atlas');
      // Disable Mongoose buffering completely
// After mongoose.connect(), add this:
console.log('✅ MongoDB connected');

// CRITICAL FIX: Wait for connection to be fully ready
await new Promise(resolve => setTimeout(resolve, 3000));

// Verify connection works
try {
  await mongoose.connection.db.admin().ping();
  console.log('✅ Database is ready for queries');
} catch (e) {
  console.log('⚠️ Database not ready yet, but continuing...');
}
      console.log('📊 Database:', mongoose.connection.name);
      console.log('🌐 Host:', mongoose.connection.host);
      
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
      });
      
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB Atlas:', error.message);
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check if your IP address is whitelisted in Atlas');
      console.log('2. Verify username and password are correct');
      console.log('3. Make sure the connection string is exactly correct');
      console.log('4. Check if you\'re using the right database name\n');
      process.exit(1);
    }
  } else {
    console.error('❌ MONGO_URI not found in config');
    process.exit(1);
  }

  // ===== API ROUTES =====
  tryRegister('./routes/activities.route', '/api/activities', true);
  tryRegister('./routes/leaderboard.route', '/api/leaderboard', false);
  
  // Mount auth routes directly
  const authRoutes = require('./routes/auth.route');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth route mounted at /api/auth');

  // ===== HEALTH CHECK =====
  app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date() }));

  // ===== TEST ROUTE FOR DEBUGGING =====
  app.get('/api/test', (req, res) => {
    res.json({ 
      message: 'Server is working!',
      googleConfigured: !!process.env.GOOGLE_CLIENT_ID,
      mongodbConnected: mongoose.connection.readyState === 1
    });
  });

  // ===== DEBUG ROUTE TO CHECK USERS =====
  app.get('/api/debug/users', async (req, res) => {
    try {
      const users = await User.find({});
      const emails = await Email.find({});
      res.json({
        users: users.map(u => ({ 
          id: u._id, 
          name: u.name, 
          email: u.email, 
          provider: u.authProvider,
          hasGoogleId: !!u.googleId 
        })),
        emails: emails.map(e => ({ 
          email: e.email, 
          hasPassword: !!e.password, 
          userId: e.userId 
        }))
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== STATIC PAGES =====
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
  });

  app.get('/feature', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'feature.html'));
  });

  app.get('/activity-tracking', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'activity-tracking', 'activityTracking.html'));
  });

  app.get('/auth.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'auth.html'));
  });

  app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'dashboard.html'));
  });
   app.get('/3dearth', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', '3dearth.html'));
  });
  app.get('/Gamified Challenge', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'GM.html'));
  });
   app.get('/work', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'work.html'));
  });

  // =================== CARBON CALCULATOR ===================
  // =================== CARBON CALCULATOR ===================
// =================== CARBON CALCULATOR ===================
// // =================== CARBON CALCULATOR ===================
app.get('/carbon-calculator', (req, res) => res.render('index'));
app.post('/calculate', (req, res) => {
    const { travelType, distance, electricity, foodType, foodQuantity, foodUnit } = req.body;
    
    console.log('Calculating for:', { travelType, distance, electricity, foodType, foodQuantity, foodUnit });
    
    // Travel emission factors (kg CO2 per km)
    const travelFactors = { 
        car: 0.21,    // 0.21 kg CO2 per km
        bus: 0.105,   // 0.105 kg CO2 per km
        bike: 0.02,   // Small factor for manufacturing
        walk: 0       // 0 kg CO2 per km
    };

    // Food emission factors (kg CO2 per kg/litre of food)
    const foodFactors = {
        dairy: 2.5,        // Dairy products
        plant: 0.8,        // Plant-based food
        chicken: 3.5,      // Chicken
        packaged: 2.0,     // Packaged food
        beverages: 0.5     // Beverages (per litre)
    };

    // Calculate travel
    const travel = Number(distance) * (travelFactors[travelType] || 0);
    
    // Calculate energy
    const energy = Number(electricity) * 0.233; // kg CO2 per kWh
    
    // Calculate food with proper error handling
    let quantity = 0;
    let foodFoot = 0;
    
    if (foodType && foodType !== '') {
        quantity = parseFloat(foodQuantity);
        if (isNaN(quantity) || quantity < 0) {
            quantity = 0.5; // Default value
        }
        
        const factor = foodFactors[foodType] || 1.5;
        foodFoot = quantity * factor;
    }

    const totalFootprint = (travel + energy + foodFoot).toFixed(2);

    console.log('Results:', { travel, energy, foodFoot, totalFootprint });

    // PASS ALL VARIABLES to result.ejs
    res.render('result', {
        totalFootprint,
        travel: travel.toFixed(2),
        electricity: energy.toFixed(2),
        food: foodFoot.toFixed(2),
        foodType: foodType || 'Not selected',
        quantity: quantity.toFixed(2),
        foodUnit: foodUnit || 'kg'
    });
}); 
// =================== RECOMMENDATIONS PAGE ===================
app.get('/recommendations', (req, res) => {
    const fp = parseFloat(req.query.fp) || 0;
    
    console.log('Generating recommendations for footprint:', fp);
    
    // Generate recommendations based on footprint value
    let recommendations = [];
    
    if (fp < 10) {
        recommendations = [
            "Great job! Your carbon footprint is already low — keep using sustainable transport.",
            "Try switching to LED bulbs and maintaining energy-efficient habits.",
            "Consider sharing your eco-friendly habits with friends!"
        ];
    } else if (fp < 20) {
        recommendations = [
            "Consider using public transport 2–3 times a week instead of driving.",
            "Reduce meat intake by 20–30% to lower emissions.",
            "Unplug electronics when not in use to save energy."
        ];
    } else if (fp < 30) {
        recommendations = [
            "Try carpooling or combining trips to reduce fuel consumption.",
            "Switch to energy-efficient appliances and LED lighting.",
            "Incorporate more plant-based meals into your diet."
        ];
    } else {
        recommendations = [
            "High footprint detected — consider shifting to a greener commute.",
            "Use energy-efficient appliances and track your electricity usage.",
            "Try a weekly vegetarian day to reduce food-related emissions.",
            "Consider offsetting your carbon footprint through tree planting."
        ];
    }
    
    // Add food-specific recommendations
    recommendations.push("Choose locally sourced foods to reduce transport emissions.");
    recommendations.push("Reduce food waste by planning meals and storing food properly.");
    
    res.render('recommendations', { 
        fp: fp.toFixed(2),
        recommendations: recommendations,
        rec: recommendations // For backward compatibility
    });
});
// =================== CONTACT API ===================
  app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ success: false, msg: 'All fields required' });

    try {
      if (Message) await Message.create({ name, email, message });

      if (transporter) {
        try {
          await transporter.sendMail({
            from: `"EcoTrack Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: '📩 New Contact Message - EcoTrack',
            html: `<h3>New Message</h3><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Message:</b> ${message}</p>`
          });
          console.log('📧 Contact email sent successfully');
        } catch (emailError) {
          console.error('❌ Failed to send email:', emailError.message);
          // Still return success even if email fails (message saved to DB)
        }
      }
      
      res.json({ success: true, msg: 'Message sent successfully' });
    } catch (error) {
      console.error('Contact Error:', error);
      res.status(500).json({ success: false, msg: 'Server error' });
    }
  });

  // =================== SOCKET.IO ===================
  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    socket.on('getRecent', async (limit = 100) => {
      if (!Activity) return socket.emit('recent', []);
      const recent = await Activity.find({}).sort({ createdAt: -1 }).limit(limit);
      socket.emit('recent', recent);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  // =================== ERROR HANDLING ===================
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // =================== LISTEN ===================
  server.listen(PORT, () => {
    console.log(`🔥 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email ${transporter ? 'configured' : 'not configured'}`);
    console.log(`🔑 Google OAuth ${process.env.GOOGLE_CLIENT_ID ? 'configured' : 'NOT configured ⚠️'}`);
    console.log(`🍃 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n📋 Test these URLs:`);
    console.log(`→ http://localhost:${PORT}/api/test`);
    console.log(`→ http://localhost:${PORT}/api/auth/google`);
    console.log(`→ http://localhost:${PORT}/auth.html`);
  });
}

startServer().catch(err => {
  console.error('💥 Server failed to start:', err);
  process.exit(1);
});