import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { Mark } from '../models/Mark';
import { Student } from '../models/Student';
import { Subject } from '../models/Subject';
import { ApiError } from '../utils/apiError';
import { notifyMarksPublished } from '../services/notificationService';

export const addMark = asyncHandler(async (req: AuthRequest, res: Response) => {
  const mark = await Mark.create({ ...req.body, enteredBy: req.user!.userId });
  res.status(201).json({ success: true, data: mark });
});

export const updateMark = asyncHandler(async (req: AuthRequest, res: Response) => {
  const mark = await Mark.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!mark) throw new ApiError(404, 'Mark not found');
  res.json({ success: true, data: mark });
});

export const getMarks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, subjectId, type, published } = req.query;
  const filter: Record<string, unknown> = {};
  if (studentId) filter.studentId = studentId;
  if (subjectId) filter.subjectId = subjectId;
  if (type) filter.type = type;
  if (published !== undefined) filter.published = published === 'true';
  if (req.user?.role === 'student') {
    filter.published = true;
  }

  const marks = await Mark.find(filter)
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName' } })
    .populate('subjectId', 'name code credits');
  res.json({ success: true, data: marks });
});

export const publishMarks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subjectId, studentIds } = req.body;
  const filter: Record<string, unknown> = { subjectId, published: false };
  if (studentIds?.length) filter.studentId = { $in: studentIds };

  await Mark.updateMany(filter, { published: true, publishedAt: new Date() });

  const students = await Student.find(studentIds ? { _id: { $in: studentIds } } : {}).populate('userId');
  const subject = await Subject.findById(subjectId);

  for (const student of students) {
    const populated = student as unknown as { userId?: { email: string; firstName: string; lastName: string } };
    const user = populated?.userId;
    if (user?.email && subject) {
      await notifyMarksPublished(user.email, `${user.firstName} ${user.lastName}`, subject.name);
    }
  }

  res.json({ success: true, message: 'Marks published and notifications sent' });
});

export const getStudentPerformance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId } = req.params;
  const marks = await Mark.find({ studentId, published: true });

  const bySubject: Record<string, { internal: number; exam: number; credits: number }> = {};
  for (const mark of marks) {
    const sid = mark.subjectId.toString();
    if (!bySubject[sid]) bySubject[sid] = { internal: 0, exam: 0, credits: 0 };
    const pct = (mark.score / mark.maxScore) * 100;
    if (mark.type === 'internal') bySubject[sid].internal += pct;
    else bySubject[sid].exam += pct;
  }

  const subjects = await Subject.find({ _id: { $in: Object.keys(bySubject) } });
  const subjectMap = Object.fromEntries(subjects.map((s) => [s._id.toString(), s]));

  const performance = Object.entries(bySubject).map(([sid, scores]) => {
    const subject = subjectMap[sid];
    const avg = (scores.internal + scores.exam) / 2;
    return {
      subjectId: sid,
      subjectName: subject?.name,
      code: subject?.code,
      credits: subject?.credits || 0,
      percentage: Math.round(avg * 100) / 100,
      gradePoint: avg >= 90 ? 10 : avg >= 80 ? 9 : avg >= 70 ? 8 : avg >= 60 ? 7 : avg >= 50 ? 6 : 5,
    };
  });

  const totalCredits = performance.reduce((s, p) => s + p.credits, 0);
  const gpa =
    totalCredits > 0
      ? performance.reduce((s, p) => s + p.gradePoint * p.credits, 0) / totalCredits
      : 0;

  res.json({
    success: true,
    data: { subjects: performance, gpa: Math.round(gpa * 100) / 100, overallPercentage: Math.round((gpa / 10) * 100) },
  });
});

export const getSubjectAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subjectId } = req.params;
  const analytics = await Mark.aggregate([
    { $match: { subjectId: subjectId, published: true } },
    {
      $group: {
        _id: '$studentId',
        avgScore: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } },
        count: { $sum: 1 },
      },
    },
    { $sort: { avgScore: -1 } },
  ]);
  res.json({ success: true, data: analytics });
});
