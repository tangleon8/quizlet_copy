const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if no OAuth provider is used
      return !this.googleId;
    },
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  // OAuth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Find or create user from OAuth profile
userSchema.statics.findOrCreateFromOAuth = async function(profile, provider) {
  const providerIdField = `${provider}Id`;

  // Try to find by provider ID first
  let user = await this.findOne({ [providerIdField]: profile.id });

  if (user) {
    return user;
  }

  // Try to find by email (link accounts)
  user = await this.findOne({ email: profile.email });

  if (user) {
    // Link the OAuth account to existing user
    user[providerIdField] = profile.id;
    if (profile.avatar && !user.avatar) {
      user.avatar = profile.avatar;
    }
    user.emailVerified = true;
    await user.save();
    return user;
  }

  // Create new user
  user = new this({
    email: profile.email,
    name: profile.name,
    [providerIdField]: profile.id,
    avatar: profile.avatar,
    emailVerified: true
  });

  await user.save();
  return user;
};

module.exports = mongoose.model('User', userSchema);
