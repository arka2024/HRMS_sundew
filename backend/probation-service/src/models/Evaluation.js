import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeNumber: { type: String, required: true },
    employeeName: { type: String, required: true },
    department: { type: String, required: true },
    project: { type: String, required: true },
    managerId: { type: String, required: true },
    evaluationMonth: { type: String, required: true },
    evaluationYear: { type: String, required: true },
    performanceScore: { type: Number, required: true, min: 0, max: 5 },
    attendanceScore: { type: Number, required: true, min: 0, max: 5 },
    productivityScore: { type: Number, required: true, min: 0, max: 5 },
    communicationScore: { type: Number, required: true, min: 0, max: 5 },
    learningScore: { type: Number, required: true, min: 0, max: 5 },
    collaborationScore: { type: Number, required: true, min: 0, max: 5 },
    overallScore: { type: Number, required: true, min: 0, max: 5 },
    rating: { type: String, default: '' },
    hrRemarks: { type: String, default: '' },
    evaluationStatus: { 
      type: String, 
      enum: ['Pending', 'In Review', 'Completed', 'Locked'], 
      default: 'Pending' 
    },
    lockedBy: { type: String, default: null },
    lockedDate: { type: Date, default: null },
    evaluationPeriod: { type: String, default: null },
  },
  { timestamps: true }
);

export const Evaluation = mongoose.model('Evaluation', evaluationSchema);
