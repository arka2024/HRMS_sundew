import mongoose from 'mongoose';

const probationExtensionSchema = new mongoose.Schema(
  {
    employeeNumber: { type: String, required: true },
    employeeName: { type: String, required: true },
    durationMonths: { type: Number, required: true, min: 1, max: 6 },
    reason: { type: String, required: true, trim: true },
    requestedBy: { type: String, required: true }, // Manager ID or name
    requestedDate: { type: Date, required: true },
    managerApproved: { type: Boolean, default: false },
    managerApprovedBy: { type: String, default: null },
    managerApprovedDate: { type: Date, default: null },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Rejected', 'Completed'], 
      default: 'Pending' 
    },
    approvedBy: { type: String, default: null }, // HR name
    approvedDate: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

export const ProbationExtension = mongoose.model('ProbationExtension', probationExtensionSchema);
