import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { Enrollment } from '../models/Enrollment';
import { Subject } from '../models/Subject';
import { ApiError } from '../utils/apiError';

export const enroll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, subjectId } = req.body;
  const existing = await Enrollment.findOne({ studentId, subjectId, status: 'active' });
  if (existing) throw new ApiError(409, 'Already enrolled');

  const enrollment = await Enrollment.create({
    studentId,
    subjectId,
    history: [{ action: 'enrolled', note: 'Initial enrollment' }],
  });

  await Subject.findByIdAndUpdate(subjectId, { $addToSet: { studentIds: studentId } });

  const populated = await Enrollment.findById(enrollment._id)
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName' } })
    .populate('subjectId', 'name code');
  res.status(201).json({ success: true, data: populated });
});

export const removeEnrollment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) throw new ApiError(404, 'Enrollment not found');

  enrollment.status = 'dropped';
  enrollment.droppedAt = new Date();
  enrollment.history.push({ action: 'dropped', timestamp: new Date(), note: req.body.note });
  await enrollment.save();

  await Subject.findByIdAndUpdate(enrollment.subjectId, {
    $pull: { studentIds: enrollment.studentId },
  });

  res.json({ success: true, data: enrollment });
});

export const getEnrollments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, subjectId, status } = req.query;
  const filter: Record<string, unknown> = {};
  if (studentId) filter.studentId = studentId;
  if (subjectId) filter.subjectId = subjectId;
  if (status) filter.status = status;

  const enrollments = await Enrollment.find(filter)
    .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName email' } })
    .populate('subjectId', 'name code department')
    .sort({ enrolledAt: -1 });
  res.json({ success: true, data: enrollments });
});

export const getEnrollmentHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate('studentId')
    .populate('subjectId', 'name code');
  if (!enrollment) throw new ApiError(404, 'Enrollment not found');
  res.json({ success: true, data: enrollment.history });
});
