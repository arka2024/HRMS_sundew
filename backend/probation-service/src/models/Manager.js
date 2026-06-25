import mongoose from 'mongoose';

const managerSchema = new mongoose.Schema(
  {
    managerId: { type: String, required: true, unique: true, trim: true },
    managerName: { type: String, required: true, trim: true, minlength: 3 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    department: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

export const Manager = mongoose.model('Manager', managerSchema);
