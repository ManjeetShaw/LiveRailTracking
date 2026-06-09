const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');    // bcrytptjs hashes pass

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true  // Remove accidental spaces
    },

    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
      // select: false = EXCLUDED from all queries by default
      // So User.find() never accidentally returns passwords
      // You must explicitly do User.find().select('+password') to get it
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' } //cloudinary ID for deletion
    },

    //gamification
    xp: { type: Number, default: 0 },

    rank: {
      type: String,
      enum: ['New Passenger', 'Regular Traveller', 'Frequent Flyer', 'Rail Enthusiast', 'Rail Veteran', 'Iron Road Legend'],
      default: 'New Passenger'
    },

    badges: [{
      name: { type: String },
      awardedAt: { type: Date, default: Date.now }
    }],

    savedTrains: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Train' }],

    followedpilots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pilot' }],

    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },

    notifications: {
      delayAlerts: { type: Boolean, default: true },
      pilotOnDuty: { type: Boolean, default: true },
      communityReplies: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false }
    },

    // Access Control 
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user'
      // user = normal registered user
      // moderator = can flag/hide posts
      // admin = full access
    },

    isVerified: { type: Boolean, default: false },
    // true after phone OTP verification

    isActive: { type: Boolean, default: true },
    // false = suspended. We don't delete accounts (breaks post history)

    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date }
  },
  { timestamps: true }
  // timestamps: true auto-adds createdAt and updatedAt fields
);

//  Pre-save hook: hash password before saving ─
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Instance method: compare passwords at login ─
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
  // Hashes candidatePassword and compares to stored hash
  // Returns true if match, false if not
  // We can't "decrypt" bcrypt — we can only compare
};

// ── Instance method: add XP and update rank ────
userSchema.methods.addXP = async function (points) {
  this.xp += points;

  // Auto-calculate rank from total XP
  if (this.xp >= 10000) this.rank = 'Iron Road Legend';
  else if (this.xp >= 5000) this.rank = 'Rail Veteran';
  else if (this.xp >= 2000) this.rank = 'Rail Enthusiast';
  else if (this.xp >= 800) this.rank = 'Frequent Flyer';
  else if (this.xp >= 200) this.rank = 'Regular Traveller';
  else this.rank = 'New Passenger';

  await this.save();
};

const User = mongoose.model('User', userSchema);
// mongoose.model('User', schema) → stored in 'users' collection
module.exports = User;
