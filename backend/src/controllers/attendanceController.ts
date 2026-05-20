import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { Attendance } from '../models/Attendance';
import { Student } from '../models/Student';
import { Subject } from '../models/Subject';
import { notifyAttendanceAlert } from '../services/notificationService';

export const markAttendance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, subjectId, date, status, notes } = req.body;
  const attendance = await Attendance.findOneAndUpdate(
    { studentId, subjectId, date: new Date(date) },
    { status, notes, markedBy: req.user!.userId },
    { upsert: true, new: true }
  );
  res.status(201).json({ success: true, data: attendance });
});

export const bulkMarkAttendance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subjectId, date, records } = req.body;
  const results = await Promise.all(
    records.map((r: { studentId: string; status: string; notes?: string }) =>
      Attendance.findOneAndUpdate(
        { studentId: r.studentId, subjectId, date: new Date(date) },
        { status: r.status, notes: r.notes, markedBy: req.user!.userId },
        { upsert: true, new: true }
      )
    )
  );
  res.json({ success: true, data: results });
});

export const getAttendance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, subjectId, from, to } = req.query;
  const filter: Record<string, unknown> = {};
  if (studentId) filter.studentId = studentId;
  if (subjectId) filter.subjectId = subjectId;
  if (from || to) {
    filter.date = {};
    if (from) (filter.date as Record<string, Date>).$gte = new Date(from as string);
    if (to) (filter.date as Record<string, Date>).$lte = new Date(to as string);
  }

  const records = await Attendance.find(filter)
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName' } })
    .populate('subjectId', 'name code')
    .sort({ date: -1 });
  res.json({ success: true, data: records });
});

export const getAttendanceAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, subjectId } = req.query;
  const match: Record<string, unknown> = {};
  if (studentId) match.studentId = studentId;
  if (subjectId) match.subjectId = subjectId;

  const stats = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: { studentId: '$studentId', subjectId: '$subjectId' },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
      },
    },
    {
      $project: {
        studentId: '$_id.studentId',
        subjectId: '$_id.subjectId',
        total: 1,
        present: 1,
        absent: 1,
        percentage: {
          $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 2],
        },
      },
    },
  ]);

  res.json({ success: true, data: stats });
});

export const exportAttendanceReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subjectId, from, to } = req.query;
  const filter: Record<string, unknown> = { subjectId };
  if (from || to) {
    filter.date = {};
    if (from) (filter.date as Record<string, Date>).$gte = new Date(from as string);
    if (to) (filter.date as Record<string, Date>).$lte = new Date(to as string);
  }

  const records = await Attendance.find(filter)
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName' } })
    .sort({ date: 1 });

  const csv = [
    'Date,Student,Status,Notes',
    ...records.map((r) => {
      const student = r.studentId as { userId?: { firstName: string; lastName: string } };
      const name = student?.userId ? `${student.userId.firstName} ${student.userId.lastName}` : '';
      return `${new Date(r.date).toISOString().split('T')[0]},${name},${r.status},${r.notes || ''}`;
    }),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
  res.send(csv);
});

export const checkLowAttendance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const threshold = parseInt((req.query.threshold as string) || '75', 10);
  const analytics = await Attendance.aggregate([
    {
      $group: {
        _id: { studentId: '$studentId', subjectId: '$subjectId' },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
      },
    },
    {
      $project: {
        percentage: { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
        studentId: '$_id.studentId',
        subjectId: '$_id.subjectId',
      },
    },
    { $match: { percentage: { $lt: threshold } } },
  ]);

  for (const item of analytics) {
    const student = await Student.findById(item.studentId).populate('userId');
    const subject = await Subject.findById(item.subjectId);
    const populated = student as unknown as { userId?: { email: string; firstName: string; lastName: string } };
    const user = populated?.userId;
    if (user?.email && subject) {
      await notifyAttendanceAlert(
        user.email,
        `${user.firstName} ${user.lastName}`,
        subject.name,
        Math.round(item.percentage)
      );
    }
  }

  res.json({ success: true, data: analytics, alertsSent: analytics.length });
});
