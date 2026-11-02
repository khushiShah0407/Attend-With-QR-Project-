import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      immutable: true,
    },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 16 },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

departmentSchema.index({ organizationId: 1, code: 1 }, { unique: true });
departmentSchema.index({ organizationId: 1, archivedAt: 1, name: 1 });

export const Department =
  mongoose.models.Department ?? mongoose.model('Department', departmentSchema);
