import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { Subject } from '../models/Subject';
import { ApiError } from '../utils/apiError';

export const createSubject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const subject = await Subject.create(req.body);
  const populated = await Subject.findById(subject._id)
    .populate('teacherId', 'firstName lastName email')
    .populate('studentIds');
  res.status(201).json({ success: true, data: populated });
});

export const getSubjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { department, teacherId } = req.query;
  const filter: Record<string, unknown> = { isActive: true };
  if (department) filter.department = department;
  if (teacherId) filter.teacherId = teacherId;
  if (req.user?.role === 'teacher') filter.teacherId = req.user.userId;

  const subjects = await Subject.find(filter)
    .populate('teacherId', 'firstName lastName email')
    .populate({ path: 'studentIds', populate: { path: 'userId', select: 'firstName lastName' } });
  res.json({ success: true, data: subjects });
});

export const getSubject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const subject = await Subject.findById(req.params.id)
    .populate('teacherId', 'firstName lastName email')
    .populate({ path: 'studentIds', populate: { path: 'userId', select: 'firstName lastName email' } });
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json({ success: true, data: subject });
});

export const updateSubject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
    'teacherId',
    'firstName lastName email'
  );
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json({ success: true, data: subject });
});

export const assignTeacher = asyncHandler(async (req: AuthRequest, res: Response) => {
  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    { teacherId: req.body.teacherId },
    { new: true }
  ).populate('teacherId', 'firstName lastName email');
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json({ success: true, data: subject });
});

export const assignStudents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentIds } = req.body;
  const subject = await Subject.findByIdAndUpdate(req.params.id, { studentIds }, { new: true }).populate(
    'studentIds'
  );
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json({ success: true, data: subject });
});

export const deleteSubject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!subject) throw new ApiError(404, 'Subject not found');
  res.json({ success: true, message: 'Subject deactivated' });
});
