import mongoose from 'mongoose';

const organizationMemberSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'FACULTY', 'TEACHER', 'STUDENT'],
      required: true,
    },
    status: { type: String, enum: ['ACTIVE', 'REVOKED'], default: 'ACTIVE' },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

organizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
organizationMemberSchema.index({ userId: 1, status: 1, organizationId: 1 });

export const OrganizationMember =
  mongoose.models.OrganizationMember ??
  mongoose.model('OrganizationMember', organizationMemberSchema);
