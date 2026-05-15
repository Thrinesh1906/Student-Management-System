import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubject extends Document {
  code: string;
  name: string;
  description?: string;
  credits: number;
  department: string;
  teacherId: Types.ObjectId;
  studentIds: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    description: { type: String },
    credits: { type: Number, required: true, min: 1, max: 10 },
    department: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subjectSchema.index({ department: 1, teacherId: 1 });

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
