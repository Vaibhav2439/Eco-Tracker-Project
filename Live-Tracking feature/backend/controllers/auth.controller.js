const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User.model');
const Email = require('../../../models/Email');
const mongoose = require('mongoose'); 

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// ── Google OAuth Strategy Setup ──────────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google profile received:', profile.id, profile.emails[0].value);
      
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.log('⏳ MongoDB not connected. Waiting...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (mongoose.connection.readyState !== 1) {
          return done(new Error('Database connection unavailable'), null);
        }
      }
      
      const googleEmail = profile.emails[0].value.toLowerCase();
      
      // Check if user exists by googleId or email in User model
      let user = await User.findOne({ 
        $or: [
          { googleId: profile.id },
          { email: googleEmail }
        ]
      }).maxTimeMS(5000);
      
      if (user) {
        console.log('Found existing user:', user.email);
        
        // Link Google ID if not already linked
        if (!user.googleId) {
          user.googleId = profile.id;
          user.avatar = profile.photos[0]?.value;
          user.authProvider = 'both';
          await user.save();
          console.log('Linked Google account to existing user');
        }
        
        return done(null, user);
      }

      // Check Email model for existing email (backward compatibility)
      try {
        const emailRecord = await Email.findOne({ email: googleEmail }).maxTimeMS(5000);
        if (emailRecord) {
          console.log('Found email record, linking to user');
          user = await User.findById(emailRecord.userId).maxTimeMS(5000);
          if (user) {
            user.googleId = profile.id;
            user.avatar = profile.photos[0]?.value;
            user.authProvider = 'both';
            await user.save();
            console.log('Linked Google account to existing user from email record');
            return done(null, user);
          }
        }
      } catch (err) {
        console.log('Email query timed out, proceeding with new user creation');
      }

      // Create new user
      console.log('✅ Creating NEW user from Google profile');
      user = new User({
        name: profile.displayName,
        email: googleEmail,
        googleId: profile.id,
        avatar: profile.photos[0]?.value,
        authProvider: 'google',
        points: 0
      });
      
      await user.save();
      console.log('✅ NEW USER CREATED:', user.email);

      // Try to create email record (optional, with retry)
      try {
        const newEmailRecord = new Email({
          email: googleEmail,
          userId: user._id,
          password: null
        });
        await newEmailRecord.save();
        console.log('Email record created for Google user');
      } catch (emailError) {
        console.log('Email record creation skipped:', emailError.message);
      }
      
      return done(null, user);

    } catch (err) {
      console.error('Google Strategy Error:', err);
      return done(err, null);
    }
  }
));

// ── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    console.log('🔍 Registration attempt for email:', email.toLowerCase());

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected. State:', mongoose.connection.readyState);
      
      // Wait a moment and retry
      console.log('⏳ Waiting for MongoDB connection...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection unavailable. Please try again.' });
      }
      console.log('✅ MongoDB connected after waiting');
    }

    // Check if email already exists in User model first
    console.log('🔍 Checking User model for existing email...');
    let existingUser = await User.findOne({ email: email.toLowerCase() })
      .maxTimeMS(5000)
      .catch(err => {
        console.error('❌ User query error:', err.message);
        return null;
      });
      
    if (existingUser) {
      console.log('❌ Email already exists in User model:', email);
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Check Email model (with timeout handling)
    console.log('🔍 Checking Email model for existing email...');
    try {
      let existingEmail = await Email.findOne({ email: email.toLowerCase() })
        .maxTimeMS(5000);
        
      if (existingEmail) {
        console.log('❌ Email already exists in Email model:', email);
        return res.status(400).json({ error: 'Email already in use' });
      }
    } catch (err) {
      // If timeout occurs, assume email is available (optimistic approach)
      console.log('⚠️ Email query timed out, proceeding optimistically');
    }

    console.log('✅ Proceeding with user creation...');

    // Hash password
    const hash = await bcrypt.hash(password, 10);
    
    // Create new User WITH PASSWORD
    let user = new User({ 
      name,
      email: email.toLowerCase(),
      password: hash, // IMPORTANT: Save password to User model
      authProvider: 'local',
      points: 0
    });
    
    await user.save();
    console.log('✅ User created in User model with password');

    // Create Email record with retry logic
    console.log('🔍 Creating Email record...');
    let emailRecord = null;
    let retries = 3;
    let emailCreated = false;
    
    while (retries > 0 && !emailCreated) {
      try {
        emailRecord = new Email({
          email: email.toLowerCase(),
          password: hash, // Also save to Email model for backward compatibility
          userId: user._id
        });
        
        await emailRecord.save({ maxTimeMS: 5000 });
        console.log('✅ Email record created');
        emailCreated = true;
        break;
      } catch (err) {
        retries--;
        console.log(`⚠️ Email creation failed (${retries} retries left):`, err.message);
        
        if (retries === 0) {
          console.log('❌ All retries failed for Email creation');
          // User is already created, we'll continue without email record
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('✅ Registration successful for:', email);
    
    return res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        points: user.points || 0,
        success: true 
      } 
    });
    
  } catch (err) {
    console.error('❌ auth.register error', err?.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('🔍 Login attempt for email:', email.toLowerCase());

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected. State:', mongoose.connection.readyState);
      
      // Wait a moment and retry
      console.log('⏳ Waiting for MongoDB connection...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection unavailable. Please try again.' });
      }
      console.log('✅ MongoDB connected after waiting');
    }

    // Try to find user directly in User model first (faster, less prone to timeout)
    console.log('🔍 Checking User model directly...');
    let user = await User.findOne({ email: email.toLowerCase() }).maxTimeMS(5000);
    
    if (user) {
      console.log('✅ User found in User model');
      
      // Check if this is a Google account (no password)
      if (!user.password) {
        console.log('ℹ️ User exists but uses Google login:', email);
        return res.status(400).json({ 
          error: 'This email uses Google Sign-In. Please click "Continue with Google" to login.' 
        });
      }
      
      // Verify password
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        console.log('❌ Password mismatch for user:', email);
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      
      console.log('✅ Login successful for:', user.email);
      
      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          points: user.points || 0
        }
      });
    }

    // If not found in User model, try Email model (for backward compatibility)
    console.log('🔍 User not found in User model, checking Email model...');
    
    // Find email record with timeout and error handling
    let emailRecord = null;
    try {
      emailRecord = await Email.findOne({ email: email.toLowerCase() })
        .maxTimeMS(5000)
        .populate('userId');
    } catch (err) {
      console.error('❌ Email query error:', err.message);
      return res.status(500).json({ error: 'Database query timed out. Please try again.' });
    }

    if (!emailRecord) {
      console.log('❌ No account found for email:', email.toLowerCase());
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Email record found');

    // Check if this is a Google-only account (password is null)
    if (!emailRecord.password) {
      console.log('ℹ️ Email record exists but uses Google login:', email);
      return res.status(400).json({ 
        error: 'This email uses Google Sign-In. Please click "Continue with Google" to login.' 
      });
    }

    // Verify password
    const match = await bcrypt.compare(password, emailRecord.password);
    if (!match) {
      console.log('❌ Password mismatch for email record:', email);
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const userFromEmail = emailRecord.userId;
    if (!userFromEmail) {
      console.log('❌ User ID not found in email record');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: userFromEmail._id }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('✅ Login successful for email record:', userFromEmail.email);
    
    return res.json({ 
      token, 
      user: { 
        id: userFromEmail._id, 
        name: userFromEmail.name, 
        email: emailRecord.email,
        points: userFromEmail.points || 0
      } 
    });
  } catch (err) {
    console.error('❌ auth.login error', err?.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// ── Google Auth — Step 1: Redirect to Google ──────────────────────────────────
exports.googleAuth = (req, res, next) => {
  console.log('Google auth initiated');
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })(req, res, next);
};

// ── Google Auth — Step 2: Handle Google Callback ─────────────────────────────
exports.googleCallback = async (req, res) => {
  console.log('Google auth callback triggered');
  
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err) {
      console.error('Google auth error:', err.message);
      return res.redirect('/auth.html?error=google_failed');
    }
    
    if (!user) {
      console.error('No user returned from Google');
      return res.redirect('/auth.html?error=no_user');
    }

    try {
      console.log('✅ User authenticated successfully:', user.email);
      
      // Generate JWT token
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      
      // Prepare user data for frontend
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
        points: user.points || 0,
        authProvider: user.authProvider || 'google'
      };
      
      console.log('Generated JWT token for user:', user.email);
      
      // Encode user data for URL
      const encodedUser = encodeURIComponent(JSON.stringify(userData));
      
      // Redirect to frontend with token and user data
      res.redirect(`/auth.html?token=${token}&user=${encodedUser}`);
      
    } catch (error) {
      console.error('Error in Google callback:', error);
      res.redirect('/auth.html?error=server_error');
    }
  })(req, res);
};