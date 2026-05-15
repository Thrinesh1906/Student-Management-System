import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStudent extends Document {
  userId: Types.ObjectId;
  studentId: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  address?: string;
  department: string;
  year: number;
  semester: number;
  enrollmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    studentId: { type: String, required: true, unique: true, uppercase: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phone: { type: String },
    address: { type: String },
    department: { type: String, required: true },
    year: { type: Number, required: true, min: 1, max: 6 },
    semester: { type: Number, required: true, min: 1, max: 12 },
    enrollmentDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

studentSchema.index({ department: 1, year: 1 });
studentSchema.index({ studentId: 'text' });

export const Student = mongoose.model<IStudent>('Student', studentSchema);
