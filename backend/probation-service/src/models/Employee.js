import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    employeeNumber: { type: String, required: true, unique: true, trim: true },
    employeeName: { type: String, required: true, trim: true },
    dateOfJoining: { type: Date, required: true },
    totalHoursWorked: { type: Number, required: true, min: 0 },
    department: { type: String, required: true, trim: true },
    projectName: { type: String, required: true, trim: true },
    managerId: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Employee = mongoose.model('Employee', employeeSchema);
