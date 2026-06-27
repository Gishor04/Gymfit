'use strict';
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();
const crypto = require('crypto');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ===========================
// MONGOOSE SCHEMAS & MODELS
// ===========================

const userSchema = new mongoose.Schema({
  name:                     { type: String, required: true, trim: true },
  email:                    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:                 { type: String, required: true },
  phone:                    { type: String, default: '' },
  role:                     { type: String, enum: ['member', 'admin'], default: 'member' },
  membershipPlan:           { type: String, default: null },
  isEmailVerified:          { type: Boolean, default: false },
  emailVerificationToken:   { type: String, default: null },
  emailVerificationExpires: { type: Date,   default: null },
  passwordResetToken:       { type: String, default: null },
  passwordResetExpires:     { type: Date,   default: null },
}, { timestamps: true });

const planSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  price:    { type: Number, required: true },
  popular:  { type: Boolean, default: false },
  features: [String],
}, { timestamps: true });

const serviceSchema = new mongoose.Schema({
  icon:     String,
  title:    { type: String, required: true },
  desc:     String,
  duration: String,
}, { timestamps: true });

const trainerSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  role:      String,
  exp:       String,
  specialty: String,
  rating:    { type: Number, default: 5 },
  clients:   { type: Number, default: 0 },
  image:     String,
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  content:   String,
  author:    String,
  category:  String,
  published: { type: Boolean, default: false },
}, { timestamps: true });

const contactSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  phone:   String,
  message: { type: String, required: true },
}, { timestamps: true });

const User    = mongoose.model('User',    userSchema);
const Plan    = mongoose.model('Plan',    planSchema);
const Service = mongoose.model('Service', serviceSchema);
const Trainer = mongoose.model('Trainer', trainerSchema);
const Post    = mongoose.model('Post',    postSchema);
const Contact = mongoose.model('Contact', contactSchema);

// ===========================
// HELPERS
// ===========================

const JWT_SECRET = process.env.JWT_SECRET || 'gymfit-secret-change-in-production';

const signToken = (payload, expiresIn) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn });

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const createMailTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass || user === 'your-email@gmail.com') return null;
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
};

const sendEmail = async (to, subject, html) => {
  const transporter = createMailTransporter();
  if (!transporter) {
    console.log(`[EMAIL-DEV] To: ${to} | Subject: ${subject}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'GymFit <noreply@gymfit.com>',
    to, subject, html,
  });
};

const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173/Gymfit';

// ===========================
// AUTH MIDDLEWARE
// ===========================

const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ message: 'Authentication required' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const adminOnly = (req, res, next) => {
  protect(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required' });
    next();
  });
};

// ===========================
// AUTH ROUTES
// ===========================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, membershipPlan } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });
    if (!validateEmail(email))
      return res.status(400).json({ message: 'Invalid email address' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ message: 'An account with that email already exists' });

    const hashed             = await bcrypt.hash(password, 12);
    const verificationToken  = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      phone: phone || '',
      membershipPlan: membershipPlan || null,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpiry,
    });

    const verifyUrl = `${frontendUrl()}/verify-email/${verificationToken}`;
    await sendEmail(
      email,
      'Verify Your GymFit Email',
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
         <h2 style="color:#e53e3e">Welcome to GymFit, ${name}!</h2>
         <p>Click the button below to verify your email and activate your account.</p>
         <a href="${verifyUrl}"
            style="display:inline-block;background:#e53e3e;color:#fff;padding:12px 28px;
                   border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">
           Verify My Email
         </a>
         <p style="color:#888;font-size:13px">This link expires in 24 hours. If you did not register, ignore this email.</p>
       </div>`
    );

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login  (members only)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase(), role: 'member' });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isEmailVerified)
      return res.status(403).json({ message: 'Please verify your email before logging in' });

    const token = signToken(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_EXPIRES_IN || '7d'
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        membershipPlan: user.membershipPlan,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/admin-login  (admins only)
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid admin credentials' });

    const token = signToken(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_ADMIN_EXPIRES_IN || '8h'
    );

    res.json({
      message: 'Admin login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -emailVerificationToken -passwordResetToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/verify-email/:token
app.get('/api/auth/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      emailVerificationToken: req.params.token,
      emailVerificationExpires: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: 'Invalid or expired verification link' });

    user.isEmailVerified          = true;
    user.emailVerificationToken   = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
});

// POST /api/auth/resend-verification
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No account found with that email' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email is already verified' });

    const token  = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken   = token;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const url = `${frontendUrl()}/verify-email/${token}`;
    await sendEmail(user.email, 'Verify Your GymFit Email',
      `<p>Click to verify: <a href="${url}">Verify Email</a></p>`);

    res.json({ message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to resend verification email' });
  }
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken   = token;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      const resetUrl = `${frontendUrl()}/reset-password/${token}`;
      await sendEmail(
        user.email,
        'Reset Your GymFit Password',
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
           <h2 style="color:#e53e3e">Password Reset Request</h2>
           <p>Click the button below to reset your password. This link expires in 1 hour.</p>
           <a href="${resetUrl}"
              style="display:inline-block;background:#e53e3e;color:#fff;padding:12px 28px;
                     border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">
             Reset Password
           </a>
           <p style="color:#888;font-size:13px">If you did not request a password reset, ignore this email.</p>
         </div>`
      );
    }

    res.json({ message: 'If an account exists, a reset email has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password/:token
app.post('/api/auth/reset-password/:token', async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword)
      return res.status(400).json({ message: 'Password and confirmation are required' });
    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const user = await User.findOne({
      passwordResetToken: req.params.token,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: 'Invalid or expired reset link' });

    user.password          = await bcrypt.hash(password, 12);
    user.passwordResetToken   = null;
    user.passwordResetExpires = null;
    await user.save();

    await sendEmail(user.email, 'GymFit Password Changed',
      `<p>Your GymFit password was successfully changed. If you did not do this, contact support immediately.</p>`);

    res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Password reset failed' });
  }
});

// PUT /api/auth/update-profile
app.put('/api/auth/update-profile', protect, async (req, res) => {
  try {
    const { name, phone, membershipPlan } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, membershipPlan },
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -passwordResetToken');
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// PUT /api/auth/change-password
app.put('/api/auth/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!(await bcrypt.compare(currentPassword, user.password)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// ===========================
// ADMIN – MEMBER MANAGEMENT
// ===========================

app.get('/api/members', adminOnly, async (req, res) => {
  try {
    const members = await User.find({ role: 'member' })
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 });
    res.json(members);
  } catch (err) { res.status(500).json({ message: 'Failed to fetch members' }); }
});

app.post('/api/members', adminOnly, async (req, res) => {
  try {
    const { name, email, password, phone, membershipPlan } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });
    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name, email: email.toLowerCase(), password: hashed,
      phone, membershipPlan, isEmailVerified: true,
    });
    res.status(201).json({
      message: 'Member created',
      member: { id: user._id, name: user.name, email: user.email, phone: user.phone, membershipPlan: user.membershipPlan, createdAt: user.createdAt },
    });
  } catch (err) { res.status(500).json({ message: 'Failed to create member' }); }
});

app.get('/api/members/:id', adminOnly, async (req, res) => {
  try {
    const member = await User.findOne({ _id: req.params.id, role: 'member' })
      .select('-password -emailVerificationToken -passwordResetToken');
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json(member);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

app.put('/api/members/:id', adminOnly, async (req, res) => {
  try {
    const { name, email, phone, membershipPlan, isEmailVerified } = req.body;
    const member = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'member' },
      { name, email, phone, membershipPlan, isEmailVerified },
      { new: true }
    ).select('-password -emailVerificationToken -passwordResetToken');
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json({ message: 'Member updated', member });
  } catch (err) { res.status(500).json({ message: 'Update failed' }); }
});

app.delete('/api/members/:id', adminOnly, async (req, res) => {
  try {
    const member = await User.findOneAndDelete({ _id: req.params.id, role: 'member' });
    if (!member) return res.status(404).json({ message: 'Member not found' });
    res.json({ message: 'Member deleted' });
  } catch (err) { res.status(500).json({ message: 'Delete failed' }); }
});

// ===========================
// PLANS
// ===========================

app.get('/api/plans', async (req, res) => {
  try {
    res.json(await Plan.find().sort({ price: 1 }));
  } catch { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/plans', adminOnly, async (req, res) => {
  try {
    res.status(201).json(await Plan.create(req.body));
  } catch { res.status(500).json({ message: 'Failed to create plan' }); }
});

app.put('/api/plans/:id', adminOnly, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch { res.status(500).json({ message: 'Update failed' }); }
});

app.delete('/api/plans/:id', adminOnly, async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Plan deleted' });
  } catch { res.status(500).json({ message: 'Delete failed' }); }
});

// ===========================
// SERVICES
// ===========================

app.get('/api/services', async (req, res) => {
  try {
    res.json(await Service.find());
  } catch { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/services', adminOnly, async (req, res) => {
  try {
    res.status(201).json(await Service.create(req.body));
  } catch { res.status(500).json({ message: 'Failed to create service' }); }
});

app.put('/api/services/:id', adminOnly, async (req, res) => {
  try {
    const s = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!s) return res.status(404).json({ message: 'Service not found' });
    res.json(s);
  } catch { res.status(500).json({ message: 'Update failed' }); }
});

app.delete('/api/services/:id', adminOnly, async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted' });
  } catch { res.status(500).json({ message: 'Delete failed' }); }
});

// ===========================
// TRAINERS
// ===========================

app.get('/api/trainers', async (req, res) => {
  try {
    res.json(await Trainer.find());
  } catch { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/trainers', adminOnly, async (req, res) => {
  try {
    res.status(201).json(await Trainer.create(req.body));
  } catch { res.status(500).json({ message: 'Failed to create trainer' }); }
});

app.put('/api/trainers/:id', adminOnly, async (req, res) => {
  try {
    const t = await Trainer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!t) return res.status(404).json({ message: 'Trainer not found' });
    res.json(t);
  } catch { res.status(500).json({ message: 'Update failed' }); }
});

app.delete('/api/trainers/:id', adminOnly, async (req, res) => {
  try {
    await Trainer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trainer deleted' });
  } catch { res.status(500).json({ message: 'Delete failed' }); }
});

// ===========================
// POSTS / BLOG
// ===========================

app.get('/api/posts', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const isAdmin = auth ? (() => { try { return jwt.verify(auth.split(' ')[1], JWT_SECRET).role === 'admin'; } catch { return false; } })() : false;
    const filter = isAdmin ? {} : { published: true };
    res.json(await Post.find(filter).sort({ createdAt: -1 }));
  } catch { res.status(500).json({ message: 'Server error' }); }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/posts', adminOnly, async (req, res) => {
  try {
    res.status(201).json(await Post.create(req.body));
  } catch { res.status(500).json({ message: 'Failed to create post' }); }
});

app.put('/api/posts/:id', adminOnly, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch { res.status(500).json({ message: 'Update failed' }); }
});

app.delete('/api/posts/:id', adminOnly, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch { res.status(500).json({ message: 'Delete failed' }); }
});

// ===========================
// CONTACTS
// ===========================

app.get('/api/contacts', adminOnly, async (req, res) => {
  try {
    res.json(await Contact.find().sort({ createdAt: -1 }));
  } catch { res.status(500).json({ message: 'Server error' }); }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ message: 'Name, email, and message are required' });
    const contact = await Contact.create({ name, email, phone, message });
    res.status(201).json({ message: 'Message sent successfully!', contact });
  } catch { res.status(500).json({ message: 'Failed to send message' }); }
});

app.delete('/api/contacts/:id', adminOnly, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: 'Contact deleted' });
  } catch { res.status(500).json({ message: 'Delete failed' }); }
});

// ===========================
// ADMIN DASHBOARD STATS
// ===========================

app.get('/api/dashboard/stats', adminOnly, async (req, res) => {
  try {
    const [members, plans, services, trainers, posts, contacts] = await Promise.all([
      User.countDocuments({ role: 'member' }),
      Plan.countDocuments(),
      Service.countDocuments(),
      Trainer.countDocuments(),
      Post.countDocuments(),
      Contact.countDocuments(),
    ]);
    res.json({ members, plans, services, trainers, posts, contacts });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ===========================
// SEED INITIAL DATA & ADMIN
// ===========================

const seedAdmin = async () => {
  const existing = await User.findOne({ role: 'admin' });
  if (!existing) {
    await User.create({
      name:            process.env.ADMIN_NAME     || 'GymFit Admin',
      email:           process.env.ADMIN_EMAIL    || 'admin@gymfit.com',
      password:        await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12),
      role:            'admin',
      isEmailVerified: true,
    });
    console.log('Default admin account created');
  }
};

const seedData = async () => {
  if ((await Plan.countDocuments()) === 0) {
    await Plan.insertMany([
      { name: 'Basic',  price: 29, popular: false, features: ['Gym Access (Mon-Fri)', 'Locker Room', '2 Group Classes/month', 'Basic Equipment', 'App Access'] },
      { name: 'Pro',    price: 59, popular: true,  features: ['Unlimited Gym Access', 'All Group Classes', '2 Personal Sessions/month', 'Nutrition Guide', 'App Access', 'Guest Pass (2/month)'] },
      { name: 'Elite',  price: 99, popular: false, features: ['Everything in Pro', 'Unlimited Personal Training', 'Meal Planning', 'Priority Booking', 'Unlimited Guest Passes', 'Recovery Room Access'] },
    ]);
    console.log('Plans seeded');
  }
  if ((await Service.countDocuments()) === 0) {
    await Service.insertMany([
      { icon: '🏋️', title: 'Personal Training', desc: 'One-on-one sessions with certified trainers tailored to your goals.', duration: '60 min' },
      { icon: '🏃', title: 'Cardio Training',   desc: 'Boost stamina and heart health with expert-guided cardio programs.',  duration: '45 min' },
      { icon: '🧘', title: 'Yoga Classes',       desc: 'Relax your body and mind with daily yoga and meditation sessions.',   duration: '60 min' },
      { icon: '💪', title: 'Weight Training',    desc: 'Build strength and muscle with structured weight training plans.',    duration: '75 min' },
      { icon: '🥊', title: 'Boxing',             desc: 'High-energy boxing classes for fitness and stress relief.',           duration: '60 min' },
      { icon: '🤸', title: 'Group Classes',      desc: 'Fun and motivating group workout sessions for all fitness levels.',   duration: '50 min' },
    ]);
    console.log('Services seeded');
  }
  if ((await Trainer.countDocuments()) === 0) {
    await Trainer.insertMany([
      { name: 'Alex Johnson',  role: 'Strength Coach',     exp: '8 years',  specialty: 'Strength Training',    rating: 4.9, clients: 150 },
      { name: 'Sarah Williams',role: 'Yoga Instructor',    exp: '6 years',  specialty: 'Yoga & Mindfulness',   rating: 4.8, clients: 120 },
      { name: 'Mike Chen',     role: 'Boxing Coach',       exp: '10 years', specialty: 'Boxing & Cardio',      rating: 4.9, clients: 200 },
      { name: 'Emma Davis',    role: 'Cardio Specialist',  exp: '5 years',  specialty: 'Cardio & HIIT',        rating: 4.7, clients: 90  },
    ]);
    console.log('Trainers seeded');
  }
};

// ===========================
// START SERVER
// ===========================

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gymfit');
    console.log('MongoDB connected');
    await seedAdmin();
    await seedData();
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
};

start();
