import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
      index: true,
    },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

organizationSchema.index({ ownerUserId: 1, status: 1 });

export const Organization =
  mongoose.models.Organization ?? mongoose.model('Organization', organizationSchema);
