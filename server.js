// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
// middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Configure EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// load model
let Message = null;
try {
  Message = require('./models/Message');
  console.log('Message model loaded');
} catch (err) {
  console.warn('models/Message.js not found or has error. DB save will be disabled until fixed.');
  console.warn(err && err.message ? err.message : err);
}

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

// contact API
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: 'Please provide name, email and message.' });
    }

    // save to DB if model present
    let saved = null;
    if (Message) {
      try {
        saved = await Message.create({ name, email, message });
        console.log('Saved message id:', saved._id);
      } catch (dbErr) {
        console.error(
          'DB save failed:',
          dbErr && dbErr.message ? dbErr.message : dbErr
        );
      }
    }

    // prepare email
    const fromName = process.env.FROM_NAME || 'Website';
    const fromEmail =
      process.env.FROM_EMAIL ||
      process.env.EMAIL_USER ||
      'no-reply@example.com';

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER || 'you@example.com',
      subject: `New contact from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}\n\nSavedID: ${
        saved ? saved._id : 'not-saved'
      }`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong><br/>${(message || '')
               .replace(/\n/g, '<br/>')}</p>
             <p><em>SavedID: ${saved ? saved._id : 'not-saved'}</em></p>`
    };

    // send email if transporter configured
    if (transporter) {
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(
          'Email sent:',
          info && (info.messageId || info.response)
            ? info.messageId || info.response
            : info
        );
      } catch (sendErr) {
        console.error(
          'Failed to send email:',
          sendErr && sendErr.message ? sendErr.message : sendErr
        );
      }
    } else {
      console.log('No transporter configured; skipping email send.');
    }

    return res.json({ success: true, savedId: saved ? saved._id : null });
  } catch (err) {
    console.error(
      '/api/contact unexpected error:',
      err && err.stack ? err.stack : err
    );
    return res.status(500).json({ error: 'Server error' });
  }
});

// mount auth routes (file-backed simple auth for demo)
try {
  const authRouter = require('./routes/auth.route');
  app.use('/api/auth', authRouter);
  console.log('Mounted /api/auth routes');
} catch (err) {
  console.warn('Failed to mount /routes/auth.route:', err && err.message ? err.message : err);
}

// SPA fallback - serve index.ejs for any other routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/feature', (req, res) => {
  res.render('feature');
});

app.get('/activity-tracking', (req, res) => {
  res.render('activityTracking');
});

// start: connect to MongoDB (if configured) then listen
(async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('MongoDB connected');
    } catch (mongoErr) {
      console.error(
        'MongoDB connection failed:',
        mongoErr && mongoErr.message ? mongoErr.message : mongoErr
      );
    }
  } else {
    console.log('MONGODB_URI not set in .env; DB features disabled.');
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
