import mongoose, { Document, Schema, Types } from 'mongoose';

export type EnrollmentStatus = 'active' | 'completed' | 'dropped';

export interface IEnrollment extends Document {
  studentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;
  droppedAt?: Date;
  history: { action: string; timestamp: Date; note?: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    droppedAt: { type: Date },
    history: [
      {
        action: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

enrollmentSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });
enrollmentSchema.index({ status: 1 });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', enrollmentSchema);
