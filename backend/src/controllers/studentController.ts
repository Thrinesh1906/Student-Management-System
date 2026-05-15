import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { Student } from '../models/Student';
import { User } from '../models/User';
import { ApiError } from '../utils/apiError';
import * as authService from '../services/authService';

export const createStudent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, firstName, lastName, studentId, department, year, semester, ...rest } = req.body;

  const user = await authService.registerUser({
    email,
    password,
    firstName,
    lastName,
    role: 'student',
  });

  const student = await Student.create({
    userId: user._id,
    studentId,
    department,
    year,
    semester,
    ...rest,
  });

  const populated = await Student.findById(student._id).populate('userId', 'email firstName lastName');
  res.status(201).json({ success: true, data: populated });
});

export const getStudents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, department, year, page = '1', limit = '20' } = req.query;
  const filter: Record<string, unknown> = {};
  if (department) filter.department = department;
  if (year) filter.year = parseInt(year as string, 10);

  let query = Student.find(filter).populate('userId', 'email firstName lastName isActive');

  if (search) {
    const users = await User.find({
      $or: [
        { firstName: new RegExp(search as string, 'i') },
        { lastName: new RegExp(search as string, 'i') },
        { email: new RegExp(search as string, 'i') },
      ],
    }).select('_id');
    query = Student.find({
      ...filter,
      $or: [{ studentId: new RegExp(search as string, 'i') }, { userId: { $in: users.map((u) => u._id) } }],
    }).populate('userId', 'email firstName lastName isActive');
  }

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const [students, total] = await Promise.all([
    query.skip((pageNum - 1) * limitNum).limit(limitNum).sort({ createdAt: -1 }),
    Student.countDocuments(filter),
  ]);

  res.json({ success: true, data: students, pagination: { page: pageNum, limit: limitNum, total } });
});

export const getStudent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const student = await Student.findById(req.params.id).populate('userId', 'email firstName lastName role');
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

export const updateStudent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
    'userId',
    'email firstName lastName'
  );
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

export const getMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const student = await Student.findOne({ userId: req.user!.userId }).populate(
    'userId',
    'email firstName lastName role'
  );
  if (!student) throw new ApiError(404, 'Student profile not found');
  res.json({ success: true, data: student });
});

export const deleteStudent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  await User.findByIdAndUpdate(student.userId, { isActive: false });
  await Student.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Student deleted' });
});
