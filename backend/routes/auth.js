const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middleware/auth');
const sendOtp = require('../utils/otp');

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      username,
      email,
      phone,
      password,
      isVerified: false
    });

    // Generate OTP
    const otp = generateOTP();
    user.otp = otp;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Send OTP via email - continue even if email fails
    let emailSent = true;
    let emailError = null;
    try {
      await sendOtp(email, otp);
    } catch (emailErr) {
      console.error('Email sending error:', emailErr.message);
      emailSent = false;
      emailError = emailErr.message;
    }

    // Create and return token
    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      },
      emailSent,
      emailError,
      manualOtp: !emailSent ? otp : undefined
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/verify
// @desc    Verify user with OTP
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Verify user
    user.isVerified = true;
    user.otp = undefined; // Clear OTP after verification
    await user.save();

    res.json({
      message: 'User verified successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create and send token
    const token = jwt.sign(
      { user: { id: user.id } },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/resend-otp
// @desc    Resend OTP for verification
// @access  Private
router.post('/resend-otp', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    user.otp = otp;
    await user.save();

    // Send OTP via email
    await sendOtp(user.email, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/auth/resend-otp-public
// @desc    Resend OTP for verification (no auth required, uses email)
// @access  Public
router.post('/resend-otp-public', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    user.otp = otp;
    await user.save();

    // Send OTP via email
    let emailSent = true;
    try {
      await sendOtp(user.email, otp);
    } catch (emailErr) {
      console.error('Email sending error:', emailErr.message);
      emailSent = false;
    }

    res.json({
      message: 'OTP sent successfully',
      emailSent,
      manualOtp: !emailSent ? otp : undefined
    });
  } catch (error) {
    console.error('Resend OTP public error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;