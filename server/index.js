require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const setsRoutes = require('./routes/sets');

// Initialize passport config
require('./config/passport');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware - CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://questly-eight-smoky.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Initialize Passport
app.use(passport.initialize());
// Increase payload limit for large study sets (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sets', setsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
