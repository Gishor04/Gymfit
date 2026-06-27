require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');
const mongoose   = require('mongoose');
const nodemailer = require('nodemailer');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcryptjs');
const crypto     = require('crypto');

// â”€â”€ Auth constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const JWT_SECRET   = process.env.JWT_SECRET || 'gymfit-dev-secret-change-in-production';
const JWT_EXPIRES  = '7d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// â”€â”€ MongoDB connection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gymfit';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('[db] âœ“ MongoDB connected â†’', MONGO_URI);
    seedAll();
  })
  .catch(err => {
    console.error('[db] âœ— MongoDB connection failed:', err.message);
    console.error('     Make sure MongoDB is running (check MongoDB Compass / mongod service)');
    process.exit(1);
  });

// â”€â”€ Schema / toJSON helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const jsonTransform = {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};
const mkOpts = () => ({ timestamps: true, toJSON: jsonTransform });

// â”€â”€ Models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Service = mongoose.model('Service', new mongoose.Schema({
  icon:     { type: String, default: 'ðŸ‹ï¸', trim: true },
  title:    { type: String, required: true, trim: true },
  desc:     { type: String, required: true, trim: true },
  duration: { type: String, default: '',    trim: true },
}, mkOpts()));

const Trainer = mongoose.model('Trainer', new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  role:      { type: String, required: true, trim: true },
  specialty: { type: String, default: '',   trim: true },
  exp:       { type: String, default: '',   trim: true },
  rating:    { type: Number, default: 5.0 },
  clients:   { type: Number, default: 0 },
}, mkOpts()));

const Plan = mongoose.model('Plan', new mongoose.Schema({
  name:     { type: String,   required: true, trim: true },
  price:    { type: Number,   required: true },
  popular:  { type: Boolean,  default: false },
  features: { type: [String], default: [] },
}, mkOpts()));

const Member = mongoose.model('Member', new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, trim: true, lowercase: true, unique: true },
  phone:          { type: String, default: '', trim: true },
  membershipPlan: { type: String, default: 'Basic' },
  status:         { type: String, default: 'active' },
  notes:          { type: String, default: '', trim: true },
  joinDate:       { type: Date,   default: Date.now },
}, mkOpts()));

const Post = mongoose.model('Post', new mongoose.Schema({
  title:     { type: String,  required: true, trim: true },
  content:   { type: String,  required: true, trim: true },
  author:    { type: String,  default: 'GymFit Team', trim: true },
  category:  { type: String,  default: 'general' },
  published: { type: Boolean, default: false },
}, mkOpts()));

const Contact = mongoose.model('Contact', new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, trim: true, lowercase: true },
  phone:   { type: String, default: '', trim: true },
  message: { type: String, required: true, trim: true },
}, mkOpts()));

const User = mongoose.model('User', new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:       { type: String, required: true },
  role:           { type: String, enum: ['member', 'admin'], default: 'member' },
  membershipPlan: { type: String, default: 'Basic' },
  emailVerified:  { type: Boolean, default: false },
  verifyToken:    { type: String, default: null },
  resetToken:     { type: String, default: null },
  resetExpires:   { type: Date,   default: null },
}, mkOpts()));

// â”€â”€ Seed on first run â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const dataDir = path.join(__dirname, 'data');

async function seedCollection(Model, jsonName, defaults) {
  if (await Model.countDocuments() > 0) return;
  let rows = defaults;
  const jsonPath = path.join(dataDir, `${jsonName}.json`);
  if (fs.existsSync(jsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) {
        rows = parsed.map(({ id, ...rest }) => rest);
      }
    } catch {}
  }
  if (rows.length) {
    await Model.insertMany(rows, { ordered: false }).catch(() => {});
    console.log(`[seed] ${Model.modelName}: ${rows.length} document(s) inserted`);
  }
}

async function ensureAdmin() {
  try {
    const exists = await User.countDocuments({ role: 'admin' });
    if (exists > 0) return;
    const hashed = await bcrypt.hash('Admin@123', 12);
    await new User({
      name: 'GymFit Admin',
      email: 'admin@gymfit.com',
      password: hashed,
      role: 'admin',
      emailVerified: true,
    }).save();
    console.log('[auth] âœ“ Default admin created');
    console.log('       Email:    admin@gymfit.com');
    console.log('       Password: Admin@123');
    console.log('       âš   Change this password via the admin panel immediately!');
  } catch (err) {
    console.error('[auth] ensureAdmin failed:', err.message);
  }
}

async function seedAll() {
  await seedCollection(Service, 'services', [
    { icon: 'ðŸ‹ï¸', title: 'Personal Training', desc: 'One-on-one sessions tailored to your specific goals and fitness level.', duration: '60 min' },
    { icon: 'ðŸƒ', title: 'Cardio',             desc: 'High-energy cardio workouts to burn fat and boost stamina.', duration: '45 min' },
    { icon: 'ðŸ§˜', title: 'Yoga',               desc: 'Improve flexibility, balance, and mindfulness with expert guidance.', duration: '60 min' },
    { icon: 'ðŸ’ª', title: 'Weight Training',    desc: 'Build strength and muscle with guided lifting sessions.', duration: '60 min' },
    { icon: 'ðŸ¥Š', title: 'Boxing',             desc: 'High-intensity boxing classes for all skill levels.', duration: '50 min' },
    { icon: 'ðŸ¤¸', title: 'Group Classes',      desc: 'Fun, motivating group fitness classes for everyone.', duration: '45 min' },
  ]);
  await seedCollection(Trainer, 'trainers', [
    { name: 'Alex Johnson',   role: 'Head Trainer',       specialty: 'Strength & Conditioning', exp: '8 years', rating: 4.9, clients: 150 },
    { name: 'Sarah Williams', role: 'Yoga Instructor',    specialty: 'Yoga & Mindfulness',      exp: '6 years', rating: 4.8, clients: 120 },
    { name: 'Mike Chen',      role: 'Cardio Specialist',  specialty: 'HIIT & Cardio',           exp: '5 years', rating: 4.7, clients: 90  },
    { name: 'Emma Davis',     role: 'Nutrition Coach',    specialty: 'Nutrition & Wellness',    exp: '7 years', rating: 4.9, clients: 110 },
  ]);
  await seedCollection(Plan, 'plans', [
    { name: 'Basic', price: 29, popular: false, features: ['Gym Access', 'Locker Room', 'Basic Equipment', 'Mobile App'] },
    { name: 'Pro',   price: 59, popular: true,  features: ['Everything in Basic', 'All Group Classes', '1 Personal Trainer Session/mo', 'Nutrition Guide', 'Guest Pass'] },
    { name: 'Elite', price: 99, popular: false, features: ['Everything in Pro', 'Unlimited Personal Training', 'Priority Booking', 'Spa Access', 'Dedicated Coach'] },
  ]);
  await seedCollection(Member,  'members',  []);
  await seedCollection(Post,    'posts',    []);
  await seedCollection(Contact, 'contacts', []);
  await ensureAdmin();
}

// â”€â”€ Email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS &&
    !process.env.EMAIL_PASS.includes('your_16_char')) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  transporter.verify(err => {
    if (err) console.error('[email] âœ— SMTP failed:', err.message);
    else     console.log('[email] âœ“ Gmail SMTP ready');
  });
} else {
  console.warn('[email] âš   Email not configured (set EMAIL_USER + EMAIL_PASS in .env)');
}

const buildEmailHtml = ({ name, email, phone, message, createdAt }) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1);">
<tr><td style="background:#111;padding:28px 32px;">
  <p style="margin:0;font-size:22px;font-weight:800;color:#f5a623;">ðŸ’ª GymFit</p>
  <p style="margin:6px 0 0;color:#888;font-size:13px;">New Contact Form Submission</p>
</td></tr>
<tr><td style="background:#fff;padding:32px;">
  <p style="margin:0 0 24px;font-size:17px;font-weight:700;color:#111;">You have a new message</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;width:100px;">Name</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:14px;font-weight:600;">${name}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;">Email</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;"><a href="mailto:${email}" style="color:#f5a623;">${email}</a></td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#888;font-size:13px;">Phone</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:14px;">${phone || 'Not provided'}</td></tr>
    <tr><td style="padding:14px 0 0;color:#888;font-size:13px;vertical-align:top;">Message</td>
        <td style="padding:14px 0 0;color:#333;font-size:14px;line-height:1.7;">${message.replace(/\n/g, '<br/>')}</td></tr>
  </table>
  <div style="margin-top:28px;padding:16px;background:#f9f9f9;border-radius:8px;">
    <a href="mailto:${email}?subject=Re: Your GymFit Enquiry"
       style="display:inline-block;padding:11px 24px;background:#f5a623;color:#111;text-decoration:none;border-radius:6px;font-weight:700;font-size:13px;">
      âœ‰ Reply to ${name}
    </a>
  </div>
</td></tr>
<tr><td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;">
  <p style="margin:0;font-size:12px;color:#aaa;">Received: ${new Date(createdAt).toLocaleString()} Â· GymFit</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

const buildVerifyEmailHtml = (name, verifyUrl) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1);">
<tr><td style="background:#111;padding:28px 32px;text-align:center;">
  <p style="margin:0;font-size:24px;font-weight:800;color:#f5a623;">ðŸ’ª GymFit</p>
  <p style="margin:8px 0 0;color:#aaa;font-size:13px;">Verify your email address</p>
</td></tr>
<tr><td style="background:#fff;padding:40px 32px;text-align:center;">
  <p style="font-size:18px;font-weight:700;color:#111;margin:0 0 12px;">Hi ${name}! ðŸ‘‹</p>
  <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 32px;">
    Thanks for joining GymFit! Click the button below to verify your email address and activate your account.
  </p>
  <a href="${verifyUrl}"
     style="display:inline-block;padding:14px 36px;background:#f5a623;color:#111;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
    âœ“ Verify Email Address
  </a>
  <p style="color:#aaa;font-size:12px;margin:28px 0 0;">
    This link expires in 24 hours. If you did not create an account, you can ignore this email.
  </p>
</td></tr>
<tr><td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;text-align:center;">
  <p style="margin:0;font-size:12px;color:#bbb;">GymFit Â· Your Fitness Journey Starts Here</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

const buildResetEmailHtml = (name, resetUrl) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.1);">
<tr><td style="background:#111;padding:28px 32px;text-align:center;">
  <p style="margin:0;font-size:24px;font-weight:800;color:#f5a623;">ðŸ’ª GymFit</p>
  <p style="margin:8px 0 0;color:#aaa;font-size:13px;">Password Reset Request</p>
</td></tr>
<tr><td style="background:#fff;padding:40px 32px;text-align:center;">
  <p style="font-size:18px;font-weight:700;color:#111;margin:0 0 12px;">Hi ${name},</p>
  <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 32px;">
    We received a request to reset your GymFit password. Click the button below to set a new password.
    This link will expire in <strong>1 hour</strong>.
  </p>
  <a href="${resetUrl}"
     style="display:inline-block;padding:14px 36px;background:#f5a623;color:#111;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
    Reset My Password
  </a>
  <p style="color:#aaa;font-size:12px;margin:28px 0 0;">
    If you did not request a password reset, you can safely ignore this email.
    Your password will not be changed.
  </p>
</td></tr>
<tr><td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;text-align:center;">
  <p style="margin:0;font-size:12px;color:#bbb;">GymFit Â· Your Fitness Journey Starts Here</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

// â”€â”€ Express app â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const app  = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  ...(process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')
    ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// â”€â”€ Auth middleware â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Token invalid or expired.' });
  }
}

function requireAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, error: 'Admin access required.' });
    next();
  });
}

// â”€â”€ Auth Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Register (member)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim())    return res.status(400).json({ success: false, error: 'Name is required.' });
  if (!email?.trim())   return res.status(400).json({ success: false, error: 'Email is required.' });
  if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ success: false, error: 'Invalid email address.' });
  if (!password || password.length < 8)
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, error: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 12);
    const autoVerify = !transporter;
    const verToken   = autoVerify ? null : crypto.randomBytes(32).toString('hex');

    const user = await new User({
      name: name.trim(), email: email.trim(),
      password: hashed, role: 'member',
      emailVerified: autoVerify,
      verifyToken: verToken,
    }).save();

    if (transporter && verToken) {
      const verifyUrl = `${FRONTEND_URL}/#/verify-email/${verToken}`;
      transporter.sendMail({
        from:    `"GymFit" <${process.env.EMAIL_USER}>`,
        to:      user.email,
        subject: 'Verify your GymFit account',
        html:    buildVerifyEmailHtml(user.name, verifyUrl),
      }).catch(err => console.error('[email] verify send failed:', err.message));
    }

    console.log(`[auth] registered: ${user.name} <${user.email}>`);
    logActivity('member_registered', 'auth', `${user.name} registered a new account`, user, { email: user.email, plan: user.membershipPlan });
    res.status(201).json({
      success: true,
      message: autoVerify
        ? 'Account created! You can now log in.'
        : 'Account created! Please check your email to verify your account.',
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

// Verify email via token
app.get('/api/auth/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({ verifyToken: req.params.token });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid or expired verification link.' });
    user.emailVerified = true;
    user.verifyToken   = null;
    await user.save();
    res.json({ success: true, message: 'Email verified! You can now log in.' });
  } catch {
    res.status(500).json({ success: false, error: 'Verification failed. Please try again.' });
  }
});

// Member login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim()) return res.status(400).json({ success: false, error: 'Email is required.' });
  if (!password)      return res.status(400).json({ success: false, error: 'Password is required.' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });

    if (!user.emailVerified)
      return res.status(401).json({ success: false, error: 'Please verify your email before logging in. Check your inbox.' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET, { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, membershipPlan: user.membershipPlan, token },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
});

// Admin login (separate endpoint, admin role only)
app.post('/api/auth/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email?.trim()) return res.status(400).json({ success: false, error: 'Email is required.' });
  if (!password)      return res.status(400).json({ success: false, error: 'Password is required.' });

  try {
    const user = await User.findOne({ email: email.toLowerCase(), role: 'admin' });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ success: false, error: 'Invalid admin credentials.' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET, { expiresIn: JWT_EXPIRES }
    );

    console.log(`[auth] admin login: ${user.email}`);
    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, token },
    });
  } catch {
    res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
});

// Get current authenticated user
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -verifyToken -resetToken -resetExpires');
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Forgot password â€” always responds success to prevent email enumeration
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email?.trim()) return res.status(400).json({ success: false, error: 'Email is required.' });

  res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !transporter) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken   = resetToken;
    user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${FRONTEND_URL}/#/reset-password/${resetToken}`;
    transporter.sendMail({
      from:    `"GymFit" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: 'Reset your GymFit password',
      html:    buildResetEmailHtml(user.name, resetUrl),
    }).catch(err => console.error('[email] reset send failed:', err.message));
  } catch (err) {
    console.error('[auth] forgot-password error:', err.message);
  }
});

// Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token)    return res.status(400).json({ success: false, error: 'Reset token is required.' });
  if (!password || password.length < 8)
    return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });

  try {
    const user = await User.findOne({ resetToken: token, resetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, error: 'Reset link is invalid or has expired.' });

    user.password    = await bcrypt.hash(password, 12);
    user.resetToken  = null;
    user.resetExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch {
    res.status(500).json({ success: false, error: 'Password reset failed. Please try again.' });
  }
});

// â”€â”€ Health â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

// â”€â”€ Services CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get('/api/services', async (_req, res) => {
  try {
    const data = await Service.find().sort({ createdAt: 1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/services', requireAdmin, async (req, res) => {
  const { icon, title, desc, duration } = req.body;
  if (!title?.trim()) return res.status(400).json({ success: false, error: 'Title is required.' });
  if (!desc?.trim())  return res.status(400).json({ success: false, error: 'Description is required.' });
  try {
    const item = await new Service({ icon: icon?.trim() || 'ðŸ‹ï¸', title: title.trim(), desc: desc.trim(), duration: duration?.trim() || '' }).save();
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/services/:id', requireAdmin, async (req, res) => {
  const { icon, title, desc, duration } = req.body;
  if (!title?.trim()) return res.status(400).json({ success: false, error: 'Title is required.' });
  if (!desc?.trim())  return res.status(400).json({ success: false, error: 'Description is required.' });
  try {
    const item = await Service.findByIdAndUpdate(req.params.id,
      { icon: icon?.trim() || 'ðŸ‹ï¸', title: title.trim(), desc: desc.trim(), duration: duration?.trim() || '' },
      { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, error: 'Service not found.' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/services/:id', requireAdmin, async (req, res) => {
  try {
    const item = await Service.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Service not found.' });
    res.json({ success: true, message: 'Service deleted.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// â”€â”€ Trainers CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get('/api/trainers', async (_req, res) => {
  try {
    const data = await Trainer.find().sort({ createdAt: 1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/trainers', requireAdmin, async (req, res) => {
  const { name, role, specialty, exp, rating, clients } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, error: 'Name is required.' });
  if (!role?.trim()) return res.status(400).json({ success: false, error: 'Role is required.' });
  try {
    const item = await new Trainer({
      name: name.trim(), role: role.trim(),
      specialty: specialty?.trim() || '', exp: exp?.trim() || '',
      rating: parseFloat(rating) || 5.0, clients: parseInt(clients) || 0,
    }).save();
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/trainers/:id', requireAdmin, async (req, res) => {
  const { name, role, specialty, exp, rating, clients } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, error: 'Name is required.' });
  if (!role?.trim()) return res.status(400).json({ success: false, error: 'Role is required.' });
  try {
    const item = await Trainer.findByIdAndUpdate(req.params.id,
      { name: name.trim(), role: role.trim(),
        specialty: specialty?.trim() || '', exp: exp?.trim() || '',
        rating: parseFloat(rating) || 5.0, clients: parseInt(clients) || 0 },
      { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, error: 'Trainer not found.' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/trainers/:id', requireAdmin, async (req, res) => {
  try {
    const item = await Trainer.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Trainer not found.' });
    res.json({ success: true, message: 'Trainer deleted.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// â”€â”€ Membership Plans CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get('/api/membership', async (_req, res) => {
  try {
    const data = await Plan.find().sort({ price: 1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/membership', requireAdmin, async (req, res) => {
  const { name, price, popular, features } = req.body;
  if (!name?.trim())           return res.status(400).json({ success: false, error: 'Plan name is required.' });
  if (price === undefined || price === '') return res.status(400).json({ success: false, error: 'Price is required.' });
  try {
    const item = await new Plan({
      name: name.trim(), price: parseFloat(price),
      popular: popular === true, features: Array.isArray(features) ? features : [],
    }).save();
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/membership/:id', requireAdmin, async (req, res) => {
  const { name, price, popular, features } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, error: 'Plan name is required.' });
  try {
    const item = await Plan.findByIdAndUpdate(req.params.id,
      { name: name.trim(), price: parseFloat(price),
        popular: popular === true, features: Array.isArray(features) ? features : [] },
      { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, error: 'Plan not found.' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/membership/:id', requireAdmin, async (req, res) => {
  try {
    const item = await Plan.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Plan not found.' });
    res.json({ success: true, message: 'Plan deleted.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// â”€â”€ Members CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get('/api/members', requireAdmin, async (_req, res) => {
  try {
    const data = await Member.find().sort({ joinDate: -1 });
    res.json({ success: true, total: data.length, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/members', requireAdmin, async (req, res) => {
  const { name, email, phone, membershipPlan, status, notes } = req.body;
  if (!name?.trim())  return res.status(400).json({ success: false, error: 'Name is required.' });
  if (!email?.trim()) return res.status(400).json({ success: false, error: 'Email is required.' });
  if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ success: false, error: 'Invalid email address.' });
  try {
    const member = await new Member({
      name: name.trim(), email: email.trim().toLowerCase(),
      phone: phone?.trim() || '', membershipPlan: membershipPlan || 'Basic',
      status: status || 'active', notes: notes?.trim() || '',
    }).save();
    console.log(`[member] created: ${name} <${email}>`);
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, error: 'A member with this email already exists.' });
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/members/:id', requireAdmin, async (req, res) => {
  const { name, email, phone, membershipPlan, status, notes } = req.body;
  if (!name?.trim())  return res.status(400).json({ success: false, error: 'Name is required.' });
  if (!email?.trim()) return res.status(400).json({ success: false, error: 'Email is required.' });
  if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ success: false, error: 'Invalid email address.' });
  try {
    const dupe = await Member.findOne({ email: email.trim().toLowerCase(), _id: { $ne: req.params.id } });
    if (dupe) return res.status(400).json({ success: false, error: 'Another member with this email already exists.' });
    const member = await Member.findByIdAndUpdate(req.params.id,
      { name: name.trim(), email: email.trim().toLowerCase(), phone: phone?.trim() || '',
        membershipPlan: membershipPlan || 'Basic', status: status || 'active', notes: notes?.trim() || '' },
      { new: true, runValidators: true });
    if (!member) return res.status(404).json({ success: false, error: 'Member not found.' });
    console.log(`[member] updated: ${name}`);
    res.json({ success: true, data: member });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/members/:id', requireAdmin, async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, error: 'Member not found.' });
    console.log(`[member] deleted: ${member.name}`);
    res.json({ success: true, message: 'Member deleted.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// â”€â”€ Posts CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.get('/api/posts', async (req, res) => {
  try {
    const filter = req.query.published === 'true' ? { published: true } : {};
    const data = await Post.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, total: data.length, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/posts', requireAdmin, async (req, res) => {
  const { title, content, author, category, published } = req.body;
  if (!title?.trim())   return res.status(400).json({ success: false, error: 'Title is required.' });
  if (!content?.trim()) return res.status(400).json({ success: false, error: 'Content is required.' });
  try {
    const post = await new Post({
      title: title.trim(), content: content.trim(),
      author: author?.trim() || 'GymFit Team',
      category: category || 'general', published: published === true,
    }).save();
    console.log(`[post] created: "${title}"`);
    res.status(201).json({ success: true, data: post });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/posts/:id', requireAdmin, async (req, res) => {
  const { title, content, author, category, published } = req.body;
  if (!title?.trim())   return res.status(400).json({ success: false, error: 'Title is required.' });
  if (!content?.trim()) return res.status(400).json({ success: false, error: 'Content is required.' });
  try {
    const post = await Post.findByIdAndUpdate(req.params.id,
      { title: title.trim(), content: content.trim(),
        author: author?.trim() || 'GymFit Team',
        category: category || 'general',
        ...(published !== undefined && { published }) },
      { new: true, runValidators: true });
    if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });
    console.log(`[post] updated: "${title}"`);
    res.json({ success: true, data: post });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.patch('/api/posts/:id/publish', requireAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });
    post.published = !post.published;
    await post.save();
    res.json({ success: true, data: post });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/posts/:id', requireAdmin, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });
    console.log(`[post] deleted: "${post.title}"`);
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// â”€â”€ Contact form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name?.trim())    return res.status(400).json({ success: false, error: 'Name is required.' });
  if (!email?.trim())   return res.status(400).json({ success: false, error: 'Email is required.' });
  if (!/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ success: false, error: 'Invalid email address.' });
  if (!message?.trim()) return res.status(400).json({ success: false, error: 'Message is required.' });

  let saved;
  try {
    saved = await new Contact({
      name: name.trim(), email: email.trim(),
      phone: phone?.trim() || '', message: message.trim(),
    }).save();
    console.log(`[contact] saved: ${saved.name} <${saved.email}>`);
    logActivity('contact_sent', 'contact', `${saved.name} sent a contact message`, { name: saved.name, email: saved.email }, { contactId: saved.id });
  } catch (err) {
    console.error('[contact] save error:', err);
    return res.status(500).json({ success: false, error: 'Server error. Please try again later.' });
  }

  if (transporter) {
    const mailOptions = {
      from:    `"GymFit Website" <${process.env.EMAIL_USER}>`,
      to:      process.env.EMAIL_TO || process.env.EMAIL_USER,
      replyTo: saved.email,
      subject: `New message from ${saved.name} â€” GymFit`,
      html:    buildEmailHtml({ ...saved.toObject(), createdAt: saved.createdAt }),
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.error('[email] send failed:', err.message);
      else     console.log('[email] sent:', info.messageId);
    });
  }

  res.json({ success: true, message: 'Message sent! We will get back to you within 24 hours.' });
});

app.get('/api/admin/contacts', requireAdmin, async (_req, res) => {
  try {
    const data = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, total: data.length, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// â”€â”€ Start â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


// ═══════════════════════════════════════════════════════════════════════════
// MEMBER FEATURE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

// ── New models ──────────────────────────────────────────────────────────────

const MemberPost = mongoose.model('MemberPost', new mongoose.Schema({
  title:      { type: String, required: true, trim: true },
  content:    { type: String, required: true, trim: true },
  imageUrl:   { type: String, default: '' },
  authorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  category:   { type: String, default: 'general' },
  status:     { type: String, enum: ['draft', 'published'], default: 'published' },
}, mkOpts()));

const Announcement = mongoose.model('Announcement', new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  content:   { type: String, required: true, trim: true },
  priority:  { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
  published: { type: Boolean, default: true },
}, mkOpts()));

// ── ActivityLog model ────────────────────────────────────────────────────────

const ActivityLog = mongoose.model('ActivityLog', new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userName:    { type: String, default: '' },
  userEmail:   { type: String, default: '' },
  action:      { type: String, required: true }, // e.g. 'post_created'
  category:    { type: String, default: 'general' }, // post|profile|contact|auth
  description: { type: String, default: '' },
  metadata:    { type: mongoose.Schema.Types.Mixed, default: {} },
}, mkOpts()));

async function logActivity(action, category, description, user, metadata = {}) {
  try {
    await new ActivityLog({
      userId:    user?.id || user?._id || null,
      userName:  user?.name  || '',
      userEmail: user?.email || '',
      action, category, description, metadata,
    }).save();
  } catch (e) { console.error('[activity] log error:', e.message); }
}

// ── Profile update ───────────────────────────────────────────────────────────

app.put('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, bio, avatarColor } = req.body;
    const updates = {};
    if (name?.trim()) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone?.trim() || '';
    if (bio  !== undefined) updates.bio  = bio?.trim()  || '';
    if (avatarColor) updates.avatarColor = avatarColor;
    const user = await User.findByIdAndUpdate(
      req.user.id, { $set: updates }, { new: true }
    ).select('-password -verifyToken -resetToken -resetExpires');
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    logActivity('profile_updated', 'profile', `${user.name} updated their profile`, user, { fields: Object.keys(updates) });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Change password ──────────────────────────────────────────────────────────

app.put('/api/auth/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, error: 'Both passwords are required.' });
    if (newPassword.length < 8)
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters.' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    if (!(await bcrypt.compare(currentPassword, user.password)))
      return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Member (community) posts ─────────────────────────────────────────────────

app.get('/api/community', async (_req, res) => {
  try {
    const data = await MemberPost.find({ status: 'published' }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/member/posts', verifyToken, async (req, res) => {
  try {
    const data = await MemberPost.find({ authorId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/member/posts', verifyToken, async (req, res) => {
  try {
    const { title, content, imageUrl, category, status } = req.body;
    if (!title?.trim())   return res.status(400).json({ success: false, error: 'Title is required.' });
    if (!content?.trim()) return res.status(400).json({ success: false, error: 'Content is required.' });
    const post = await new MemberPost({
      title: title.trim(), content: content.trim(),
      imageUrl: imageUrl?.trim() || '',
      authorId: req.user.id, authorName: req.user.name,
      category: category || 'general',
      status: status || 'published',
    }).save();
    logActivity('post_created', 'post', `${req.user.name} created post "${post.title}"`, req.user, { postId: post.id, title: post.title, category: post.category, status: post.status });
    res.status(201).json({ success: true, data: post });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/member/posts/:id', verifyToken, async (req, res) => {
  try {
    const post = await MemberPost.findOne({ _id: req.params.id, authorId: req.user.id });
    if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });
    const { title, content, imageUrl, category, status } = req.body;
    if (title?.trim())   post.title   = title.trim();
    if (content?.trim()) post.content = content.trim();
    if (imageUrl !== undefined) post.imageUrl = imageUrl?.trim() || '';
    if (category) post.category = category;
    if (status)   post.status   = status;
    await post.save();
    logActivity('post_updated', 'post', `${req.user.name} updated post "${post.title}"`, req.user, { postId: post.id, title: post.title });
    res.json({ success: true, data: post });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/member/posts/:id', verifyToken, async (req, res) => {
  try {
    const post = await MemberPost.findOneAndDelete({ _id: req.params.id, authorId: req.user.id });
    if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });
    logActivity('post_deleted', 'post', `${req.user.name} deleted post "${post.title}"`, req.user, { postId: post.id, title: post.title });
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Announcements ─────────────────────────────────────────────────────────────

app.get('/api/announcements', async (_req, res) => {
  try {
    const data = await Announcement.find({ published: true }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/announcements', requireAdmin, async (req, res) => {
  try {
    const { title, content, priority } = req.body;
    if (!title?.trim() || !content?.trim())
      return res.status(400).json({ success: false, error: 'Title and content are required.' });
    const a = await new Announcement({
      title: title.trim(), content: content.trim(), priority: priority || 'normal',
    }).save();
    res.status(201).json({ success: true, data: a });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.get('/api/admin/announcements', requireAdmin, async (_req, res) => {
  try {
    const data = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/announcements/:id', requireAdmin, async (req, res) => {
  try {
    const a = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!a) return res.status(404).json({ success: false, error: 'Not found.' });
    res.json({ success: true, data: a });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/announcements/:id', requireAdmin, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Member contact history ────────────────────────────────────────────────────

app.get('/api/member/contacts', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    const data = await Contact.find({ email: user.email }).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Notifications (announcements + published posts) ───────────────────────────

app.get('/api/member/notifications', verifyToken, async (req, res) => {
  try {
    const [announcements, posts] = await Promise.all([
      Announcement.find({ published: true }).sort({ createdAt: -1 }).limit(10),
      Post.find({ published: true }).sort({ createdAt: -1 }).limit(5),
    ]);
    const notifications = [
      ...announcements.map(a => ({
        id: a.id, type: 'announcement',
        title: a.title,
        message: a.content.length > 120 ? a.content.slice(0, 120) + '...' : a.content,
        priority: a.priority, createdAt: a.createdAt,
      })),
      ...posts.map(p => ({
        id: p.id, type: 'news',
        title: p.title,
        message: p.content.length > 120 ? p.content.slice(0, 120) + '...' : p.content,
        priority: 'normal', createdAt: p.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 15);
    res.json({ success: true, data: notifications });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Gym overview (public) ─────────────────────────────────────────────────────

app.get('/api/gym/overview', async (_req, res) => {
  try {
    const [services, trainers, plans] = await Promise.all([
      Service.find(), Trainer.find(), Plan.find(),
    ]);
    res.json({ success: true, data: { services, trainers, plans } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Admin: registered users (User model, not Member model) ───────────────────

app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    const users = await User.find({ role: 'member' })
      .select('-password -verifyToken -resetToken -resetExpires')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Admin: member posts (full CRUD over all MemberPost records) ───────────────

app.get('/api/admin/member-posts', requireAdmin, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    const filter = {};
    if (status   && status   !== 'all') filter.status   = status;
    if (category && category !== 'all') filter.category = category;
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ title: re }, { content: re }, { authorName: re }];
    }
    const data = await MemberPost.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.put('/api/admin/member-posts/:id', requireAdmin, async (req, res) => {
  try {
    const { title, content, imageUrl, category, status } = req.body;
    const post = await MemberPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });
    if (title?.trim())    post.title    = title.trim();
    if (content?.trim())  post.content  = content.trim();
    if (imageUrl !== undefined) post.imageUrl = imageUrl?.trim() || '';
    if (category) post.category = category;
    if (status)   post.status   = status;
    await post.save();
    logActivity('post_admin_edited', 'post', `Admin edited post "${post.title}" by ${post.authorName}`, req.user, { postId: post.id });
    res.json({ success: true, data: post });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.delete('/api/admin/member-posts/:id', requireAdmin, async (req, res) => {
  try {
    const post = await MemberPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, error: 'Post not found.' });
    logActivity('post_admin_deleted', 'post', `Admin deleted post "${post.title}" by ${post.authorName}`, req.user, { postId: post.id });
    res.json({ success: true, message: 'Post deleted.' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Admin: activity log ───────────────────────────────────────────────────────

app.get('/api/admin/activity', requireAdmin, async (req, res) => {
  try {
    const { category, limit = 50, page = 1 } = req.query;
    const filter = category && category !== 'all' ? { category } : {};
    const skip   = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ActivityLog.countDocuments(filter),
    ]);
    res.json({ success: true, data, total, page: Number(page), limit: Number(limit) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Admin: dashboard stats ────────────────────────────────────────────────────

app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
  try {
    const [members, registeredUsers, adminPosts, memberPosts, contacts, recentActivity] = await Promise.all([
      Member.countDocuments(),
      User.countDocuments({ role: 'member' }),
      Post.countDocuments({ published: true }),
      MemberPost.countDocuments(),
      Contact.countDocuments(),
      ActivityLog.find().sort({ createdAt: -1 }).limit(8),
    ]);
    res.json({ success: true, data: { members, registeredUsers, adminPosts, memberPosts, contacts, recentActivity } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`\nðŸ’ª  GymFit API Server`);
  console.log(`âœ…  Running   â†’ http://localhost:${PORT}`);
  console.log(`ðŸƒ  Database  â†’ ${MONGO_URI}`);
  console.log(`ðŸ“‹  Health    â†’ http://localhost:${PORT}/api/health`);
  console.log(`ðŸ”  Auth      â†’ http://localhost:${PORT}/api/auth/login`);
  console.log(`ðŸ‘¥  Members   â†’ http://localhost:${PORT}/api/members`);
  console.log(`ðŸ“  Posts     â†’ http://localhost:${PORT}/api/posts`);
  console.log(`ðŸ“§  Contacts  â†’ http://localhost:${PORT}/api/admin/contacts\n`);
});

