import mongoose, { Document, Schema, Types } from 'mongoose';

export type MarkType = 'internal' | 'exam';

export interface IMark extends Document {
  studentId: Types.ObjectId;
  subjectId: Types.ObjectId;
  type: MarkType;
  title: string;
  score: number;
  maxScore: number;
  published: boolean;
  publishedAt?: Date;
  enteredBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const markSchema = new Schema<IMark>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    type: { type: String, enum: ['internal', 'exam'], required: true },
    title: { type: String, required: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1 },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

markSchema.index({ studentId: 1, subjectId: 1, type: 1 });

export const Mark = mongoose.model<IMark>('Mark', markSchema);
