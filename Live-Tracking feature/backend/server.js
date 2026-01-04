// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const nodemailer = require('nodemailer');

const config = require('./config'); // optional - see config.js above

let Activity = null;
let User = null;
let Message = null;
try { Activity = require('./models/Activity.model'); } catch (e) { Activity = null; }
try { User = require('./models/User.model'); } catch (e) { User = null; }
try {
  Message = require('../../models/Message');
  console.log('Message model loaded (root models/Message.js)');
} catch (e) {
  Message = null;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET','POST'] } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'frontend')));
// also serve root public folder (home page + CSS)
app.use(express.static(path.join(__dirname, '..', '..', 'public')));

// Disable mongoose command buffering so operations fail fast instead of waiting to buffer
mongoose.set('bufferCommands', false);

// create nodemailer transporter if SMTP vars provided
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

    transporter
      .verify()
      .then(() => console.log('SMTP transporter verified'))
      .catch(err =>
        console.warn(
          'SMTP transporter verify failed:',
          err && err.message ? err.message : err
        )
      );
  } catch (err) {
    console.error(
      'Failed to create transporter:',
      err && err.message ? err.message : err
    );
    transporter = null;
  }
} else {
  console.log(
    'SMTP details not provided; emails will not be sent. Fill EMAIL_HOST/EMAIL_USER/EMAIL_PASS in .env to enable.'
  );
}

// helper to extract a usable router/middleware from a module export
function extractRouter(mod) {
  if (!mod) return null;
  if (typeof mod === 'function') return mod;
  if (mod.default && typeof mod.default === 'function') return mod.default;
  if (mod.router && (typeof mod.router === 'function' || (mod.router && typeof mod.router.use === 'function'))) return mod.router;
  if (mod.route && (typeof mod.route === 'function' || (mod.route && typeof mod.route.use === 'function'))) return mod.route;
  if (typeof mod === 'object' && (typeof mod.use === 'function' || typeof mod.handle === 'function')) return mod;
  return null;
}

function tryRegister(modulePath, mountPath, passIo = false) {
  try {
    const mod = require(modulePath);
    const candidate = extractRouter(mod);

    if (candidate) {
      if (typeof candidate === 'function') {
        try {
          const maybeRouter = passIo ? candidate(io) : candidate();
          const rtn = extractRouter(maybeRouter) || maybeRouter;
          if (rtn) {
            app.use(mountPath, rtn);
            console.log(`Mounted ${modulePath} => ${mountPath} (factory -> returned router)`);
            return;
          }
          app.use(mountPath, candidate);
          console.log(`Mounted ${modulePath} => ${mountPath} (function used as router)`);
          return;
        } catch (callErr) {
          app.use(mountPath, candidate);
          console.log(`Mounted ${modulePath} => ${mountPath} (function used directly)`);
          return;
        }
      }
      app.use(mountPath, candidate);
      console.log(`Mounted ${modulePath} => ${mountPath} (object router)`);
      return;
    }

    const fallback = mod && (mod.default || mod.router || mod.route || mod.app);
    if (fallback) {
      const r = extractRouter(fallback) || fallback;
      if (r) {
        app.use(mountPath, r);
        console.log(`Mounted ${modulePath} => ${mountPath} (fallback)`);
        return;
      }
    }

    throw new Error('No usable router found in module export');
  } catch (e) {
    console.error(`Failed to register route ${modulePath} at ${mountPath}:`, e && e.message ? e.message : e);
  }
}

// DATABASE connect & start server
async function startServer() {
  // prefer explicit environment variable so user can override config.js
  const PORT = process.env.PORT || (config && config.PORT) || 3000;

  if (config && config.MONGO_URI) {
    try {
      // better connect options, shorter server selection timeout for faster failure
      await mongoose.connect(config.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // fail fast if server unreachable
        connectTimeoutMS: 10000
      });
      console.log('MongoDB connected');

      try {
        if (User) {
          const count = await User.countDocuments().catch(() => 0);
          if (count === 0) {
            await User.insertMany([
              { name: 'Alex', points: 92 },
              { name: 'Maya', points: 88 },
              { name: 'Sam', points: 85 },
              { name: 'You', points: 80 }
            ]);
            console.log('Seeded users');
          }
        }
      } catch (e) {
        console.warn('Seeding users failed:', e && e.message ? e.message : e);
      }
    } catch (err) {
      console.error('MongoDB connection error (continuing without DB):', err && err.message ? err.message : err);
      // If connection fails, clear models that depend on mongoose to avoid buffered ops.
      Activity = null;
      User = null;
    }
  } else {
    console.warn('No MONGO_URI provided in config — running without MongoDB connection');
    Activity = null;
    User = null;
  }

  // Register routes AFTER trying to connect (so router factories can optionally expect io or DB)
  tryRegister('./routes/activities.route', '/api/activities', true);
  tryRegister('./routes/leaderboard.route', '/api/leaderboard', false);
  tryRegister('./routes/auth.route', '/api/auth', false);

  // health endpoint
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // serve home page
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'));
  });

  // serve feature page
  app.get('/feature', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'feature.html'));
  });
  //live tracking feature

  app.get('/activity-tracking', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'activity-tracking', 'activityTracking.html'));
  });

  // contact API (save to DB + send email)
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, message } = req.body || {};
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Please provide name, email and message.' });
      }

      // save to DB if model present
      let saved = null;
      if (Message) {
        try {
          saved = await Message.create({ name, email, message });
          console.log('Saved message id:', saved._id);
        } catch (dbErr) {
          console.error('DB save failed:', dbErr && dbErr.message ? dbErr.message : dbErr);
        }
      }

      // prepare email
      const fromName = process.env.FROM_NAME || 'Website';
      const fromEmail = process.env.FROM_EMAIL || process.env.EMAIL_USER || 'no-reply@example.com';

      const mailOptions = {
        from: `${fromName} <${fromEmail}>`,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER || 'you@example.com',
        subject: `New contact from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}\n\nSavedID: ${saved ? saved._id : 'not-saved'}`,
        html: `<p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Message:</strong><br/>${(message || '').replace(/\n/g, '<br/>')}</p>
               <p><em>SavedID: ${saved ? saved._id : 'not-saved'}</em></p>`
      };

      // send email if transporter configured
      if (transporter) {
        try {
          const info = await transporter.sendMail(mailOptions);
          console.log('Email sent:', info && (info.messageId || info.response) ? info.messageId || info.response : info);
        } catch (sendErr) {
          console.error('Failed to send email:', sendErr && sendErr.message ? sendErr.message : sendErr);
        }
      } else {
        console.log('No transporter configured; skipping email send.');
      }

      return res.json({ success: true, savedId: saved ? saved._id : null });
    } catch (err) {
      console.error('/api/contact unexpected error:', err && err.stack ? err.stack : err);
      return res.status(500).json({ error: 'Server error' });
    }
  });
  
  // socket handlers
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('getRecent', async (limit = 100) => {
      try {
        if (Activity && typeof Activity.find === 'function') {
          const recent = await Activity.find({}).sort({ createdAt: -1 }).limit(limit);
          socket.emit('recent', recent);
        } else {
          socket.emit('recent', []); // fallback
        }
      } catch (err) {
        console.error('getRecent error:', err && err.message ? err.message : err);
        socket.emit('recent', []);
      }
    });
    socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
  });

  server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

startServer().catch(err => {
  console.error('Failed to start server:', err && err.message ? err.message : err);
  process.exit(1);
});
