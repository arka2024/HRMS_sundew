import mongoose from 'mongoose';

const uploadHistorySchema = new mongoose.Schema(
  {
    managerId: { type: String, required: true, trim: true },
    uploadedBy: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    successCount: { type: Number, required: true, min: 0 },
    failedCount: { type: Number, required: true, min: 0 },
    errors: [
      {
        row: { type: Number, required: true, min: 1 },
        employeeNumber: { type: String, trim: true },
        reason: { type: String, required: true, trim: true },
      },
    ],
  },
  { timestamps: true },
);

export const UploadHistory = mongoose.model('UploadHistory', uploadHistorySchema);
