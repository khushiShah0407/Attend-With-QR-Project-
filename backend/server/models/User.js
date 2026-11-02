import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['STUDENT'], default: 'STUDENT', immutable: true },
    status: { type: String, enum: ['ACTIVE', 'DEACTIVATED'], default: 'ACTIVE' },
    emailVerifiedAt: { type: Date, default: null },
    phone: { type: String, trim: true, maxlength: 16, default: '' },
    institutionName: { type: String, trim: true, maxlength: 160, default: '' },
    department: { type: String, trim: true, maxlength: 120, default: '' },
    program: { type: String, trim: true, maxlength: 120, default: '' },
    enrollmentNumber: { type: String, trim: true, uppercase: true, maxlength: 32, default: '' },
  },
  { timestamps: true }
);

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);
