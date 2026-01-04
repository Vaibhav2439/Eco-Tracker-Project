const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Email = require('../models/Email');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    // Check if email already exists
    let existingEmail = await Email.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ error: 'Email already in use' });

    // Create new User with name
    let user = new User({ name });
    await user.save();

    // Hash password and create Email record
    const hash = await bcrypt.hash(password, 10);
    const emailRecord = new Email({
      email: email.toLowerCase(),
      password: hash,
      userId: user._id
    });
    await emailRecord.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user._id, name: user.name, email: emailRecord.email, success: true } });
  } catch (err) {
    console.error('auth.register error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    // Find email record
    const emailRecord = await Email.findOne({ email: email.toLowerCase() }).populate('userId');
    if (!emailRecord) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, emailRecord.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const user = emailRecord.userId;
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user._id, name: user.name, email: emailRecord.email } });
  } catch (err) {
    console.error('auth.login error', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Server error' });
  }
};
