import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      immutable: true,
    },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    type: {
      type: String,
      required: true,
      enum: ['HOLIDAY', 'SEMESTER', 'EXAM', 'VACATION', 'EVENT', 'TIMETABLE_CHANGE', 'DEADLINE'],
    },
    dayType: {
      type: String,
      required: true,
      enum: ['FULL_HOLIDAY', 'PARTIAL_HOLIDAY', 'SPECIAL_WORKING_DAY', 'INFORMATIONAL'],
      default: 'INFORMATIONAL',
    },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    timezone: { type: String, required: true, maxlength: 64, default: 'Asia/Kolkata' },
    status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

calendarEventSchema.index({ organizationId: 1, archivedAt: 1, status: 1, startAt: 1 });
calendarEventSchema.index({ organizationId: 1, archivedAt: 1, endAt: 1 });

export const CalendarEvent =
  mongoose.models.CalendarEvent ?? mongoose.model('CalendarEvent', calendarEventSchema);
