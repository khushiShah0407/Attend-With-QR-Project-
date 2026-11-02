import mongoose from 'mongoose';

const organizationInvitationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    role: {
      type: String,
      enum: ['ADMIN', 'FACULTY', 'TEACHER', 'STUDENT'],
      required: true,
    },
    tokenHash: { type: String, required: true, unique: true, select: false },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTING', 'ACCEPTED', 'REVOKED'],
      default: 'PENDING',
      required: true,
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

organizationInvitationSchema.index({ organizationId: 1, email: 1 }, { unique: true });
organizationInvitationSchema.index({ expiresAt: 1 });

export const OrganizationInvitation =
  mongoose.models.OrganizationInvitation ??
  mongoose.model('OrganizationInvitation', organizationInvitationSchema);
