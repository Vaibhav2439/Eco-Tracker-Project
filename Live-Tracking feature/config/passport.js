const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../backend/models/User.model');
const Email = require('../../models/Email');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleEmail = profile.emails[0].value.toLowerCase();

        // 1. Already has a Google account?
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // 2. Email registered locally? Link Google to existing account
        const emailRecord = await Email.findOne({ email: googleEmail });
        if (emailRecord) {
          user = await User.findById(emailRecord.userId);
          if (user) {
            user.googleId = profile.id;
            user.avatar = profile.photos[0]?.value || user.avatar;
            user.authProvider = 'both';
            await user.save();
            return done(null, user);
          }
        }

        // 3. Brand new user — create via Google
        user = new User({
          name: profile.displayName,
          email: googleEmail,
          googleId: profile.id,
          avatar: profile.photos[0]?.value,
          authProvider: 'google',
          points: 0
        });
        await user.save();
        return done(null, user);

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;