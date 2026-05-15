import mongoose, { Document, Schema, Types } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface IAttendance extends Document {
  studentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  markedBy: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, subjectId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ subjectId: 1, date: -1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
