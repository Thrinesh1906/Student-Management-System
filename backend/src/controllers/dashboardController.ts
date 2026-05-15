import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { Student } from '../models/Student';
import { Subject } from '../models/Subject';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { Attendance } from '../models/Attendance';
import { Mark } from '../models/Mark';

export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [studentCount, teacherCount, subjectCount, enrollmentCount] = await Promise.all([
    Student.countDocuments(),
    User.countDocuments({ role: 'teacher', isActive: true }),
    Subject.countDocuments({ isActive: true }),
    Enrollment.countDocuments({ status: 'active' }),
  ]);

  const attendanceTrend = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
      },
    },
  ]);

  const departmentStats = await Student.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const performanceDistribution = await Mark.aggregate([
    { $match: { published: true } },
    {
      $group: {
        _id: '$studentId',
        avgPct: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } },
      },
    },
    {
      $bucket: {
        groupBy: '$avgPct',
        boundaries: [0, 50, 60, 70, 80, 90, 101],
        default: 'Other',
        output: { count: { $sum: 1 } },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      counts: { students: studentCount, teachers: teacherCount, subjects: subjectCount, enrollments: enrollmentCount },
      attendanceTrend,
      departmentStats: departmentStats.map((d) => ({ department: d._id, count: d.count })),
      performanceDistribution,
    },
  });
});
