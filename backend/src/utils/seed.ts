import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { config } from '../config';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Subject } from '../models/Subject';
import { Enrollment } from '../models/Enrollment';
import { Attendance } from '../models/Attendance';
import { Mark } from '../models/Mark';
import { hashPassword } from '../services/authService';

async function seed() {
  await mongoose.connect(config.mongodbUri);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Subject.deleteMany({}),
    Enrollment.deleteMany({}),
    Attendance.deleteMany({}),
    Mark.deleteMany({}),
  ]);

  await User.create({
    email: 'admin@sms.local',
    password: await hashPassword('Admin@123'),
    firstName: 'System',
    lastName: 'Admin',
    role: 'admin',
  });

  const teacher1 = await User.create({
    email: 'teacher1@sms.local',
    password: await hashPassword('Teacher@123'),
    firstName: 'John',
    lastName: 'Smith',
    role: 'teacher',
  });

  const teacher2 = await User.create({
    email: 'teacher2@sms.local',
    password: await hashPassword('Teacher@123'),
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'teacher',
  });

  const students = [];
  for (let i = 1; i <= 5; i++) {
    const user = await User.create({
      email: `student${i}@sms.local`,
      password: await hashPassword('Student@123'),
      firstName: `Student`,
      lastName: `${i}`,
      role: 'student',
    });
    const student = await Student.create({
      userId: user._id,
      studentId: `STU2024${String(i).padStart(3, '0')}`,
      department: i <= 3 ? 'Computer Science' : 'Electronics',
      year: 2,
      semester: 3,
      phone: `+1234567890${i}`,
    });
    students.push(student);
  }

  const subjects = await Subject.insertMany([
    {
      code: 'CS101',
      name: 'Data Structures',
      credits: 4,
      department: 'Computer Science',
      teacherId: teacher1._id,
      studentIds: students.slice(0, 3).map((s) => s._id),
    },
    {
      code: 'CS201',
      name: 'Database Systems',
      credits: 3,
      department: 'Computer Science',
      teacherId: teacher1._id,
      studentIds: students.slice(0, 4).map((s) => s._id),
    },
    {
      code: 'EL101',
      name: 'Circuit Theory',
      credits: 4,
      department: 'Electronics',
      teacherId: teacher2._id,
      studentIds: students.slice(3).map((s) => s._id),
    },
  ]);

  for (const student of students.slice(0, 3)) {
    await Enrollment.create({
      studentId: student._id,
      subjectId: subjects[0]._id,
      history: [{ action: 'enrolled' }],
    });
  }

  const today = new Date();
  for (let d = 0; d < 10; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    for (const student of students.slice(0, 3)) {
      await Attendance.create({
        studentId: student._id,
        subjectId: subjects[0]._id,
        date,
        status: d % 3 === 0 ? 'absent' : 'present',
        markedBy: teacher1._id,
      });
    }
  }

  for (const student of students.slice(0, 3)) {
    await Mark.create({
      studentId: student._id,
      subjectId: subjects[0]._id,
      type: 'internal',
      title: 'Mid-term',
      score: 35 + Math.floor(Math.random() * 15),
      maxScore: 50,
      published: true,
      publishedAt: new Date(),
      enteredBy: teacher1._id,
    });
    await Mark.create({
      studentId: student._id,
      subjectId: subjects[0]._id,
      type: 'exam',
      title: 'Final Exam',
      score: 60 + Math.floor(Math.random() * 30),
      maxScore: 100,
      published: true,
      publishedAt: new Date(),
      enteredBy: teacher1._id,
    });
  }

  console.log('\n=== Seed completed ===');
  console.log('Admin:    admin@sms.local / Admin@123');
  console.log('Teacher:  teacher1@sms.local / Teacher@123');
  console.log('Student:  student1@sms.local / Student@123');
  console.log(`Created: ${students.length} students, ${subjects.length} subjects`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
