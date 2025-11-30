// server.js - Main Backend File
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/admin_dashboard')
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB Error:', err));

// =====================
// SCHEMAS & MODELS
// =====================

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'User'], default: 'User' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  joinDate: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  activeUsers: { type: Number, default: 0 },
  newSignups: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
});

const Analytics = mongoose.model('Analytics', analyticsSchema);

// =====================
// MIDDLEWARE
// =====================

// Verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// =====================
// AUTH ROUTES
// =====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'User',
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// =====================
// USER MANAGEMENT ROUTES
// =====================

// Get all users (Admin only)
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single user
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user
app.put('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email, role, status } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// =====================
// ANALYTICS ROUTES
// =====================

// Get dashboard metrics
app.get('/api/analytics/metrics', authenticateToken, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'Active' });

    // New signups in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newSignups = await User.countDocuments({ joinDate: { $gte: thirtyDaysAgo } });

    const recentAnalytics = await Analytics.find().sort({ date: -1 }).limit(30);

    const totalSales = recentAnalytics.reduce((sum, item) => sum + item.sales, 0);
    const totalRevenue = recentAnalytics.reduce((sum, item) => sum + item.revenue, 0);

    const growthRate =
      totalUsers > 0 ? ((newSignups / totalUsers) * 100).toFixed(1) : 0;

    res.json({
      totalUsers,
      activeUsers,
      newSignups,
      totalSales,
      totalRevenue,
      growthRate,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get chart data
app.get('/api/analytics/charts', authenticateToken, async (req, res) => {
  try {
    const analytics = await Analytics.find().sort({ date: -1 }).limit(6);

    const chartData = analytics.reverse().map((item) => ({
      date: item.date.toLocaleDateString('en-US', { month: 'short' }),
      sales: item.sales,
      users: item.activeUsers,
      revenue: item.revenue,
    }));

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add analytics data (for demo/testing)
app.post('/api/analytics', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { activeUsers, newSignups, sales, revenue } = req.body;

    const analytics = new Analytics({
      activeUsers,
      newSignups,
      sales,
      revenue,
    });

    await analytics.save();
    res.status(201).json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// =====================
// SEED ROUTE (GET & POST)
// =====================

const seedDatabase = async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      return res.json({
        message:
          'Database already seeded! Use admin@example.com / admin123 to login.',
      });
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);

    const admin = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'Admin',
      status: 'Active',
    });
    await admin.save();

    // Create sample users
    for (let i = 1; i <= 10; i++) {
      const userPassword = await bcrypt.hash('user123', salt);
      const user = new User({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        password: userPassword,
        role: 'User',
        status: i % 3 === 0 ? 'Inactive' : 'Active',
      });
      await user.save();
    }

    // Create sample analytics data
    for (let i = 0; i < 6; i++) {
      const analytics = new Analytics({
        date: new Date(2024, i, 1),
        activeUsers: 200 + Math.floor(Math.random() * 200),
        newSignups: 50 + Math.floor(Math.random() * 100),
        sales: 3000 + Math.floor(Math.random() * 3000),
        revenue: 30000 + Math.floor(Math.random() * 30000),
      });
      await analytics.save();
    }

    res.json({
      message:
        'Database seeded successfully! Login with admin@example.com / admin123',
    });
  } catch (error) {
    res.status(500).json({ message: 'Seed error', error: error.message });
  }
};

// Support both GET and POST so your api.http works
app.get('/api/seed', seedDatabase);
app.post('/api/seed', seedDatabase);

// =====================
// HEALTH CHECK
// =====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// =====================
// START SERVER
// =====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
