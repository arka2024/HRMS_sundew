import mongoose from 'mongoose';

const evaluationUnlockRequestSchema = new mongoose.Schema(
  {
    employeeNumber: { type: String, required: true },
    employeeName: { type: String, required: true },
    evaluationYear: { type: String, required: true },
    evaluationMonth: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    requestedBy: { type: String, required: true }, // Manager ID or name
    requestedDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Rejected'], 
      default: 'Pending' 
    },
    approvedBy: { type: String, default: null }, // HR name
    approvedDate: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

export const EvaluationUnlockRequest = mongoose.model('EvaluationUnlockRequest', evaluationUnlockRequestSchema);
