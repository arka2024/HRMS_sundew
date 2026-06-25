import mongoose from 'mongoose';

const associateManagerMappingSchema = new mongoose.Schema(
  {
    associateEmployeeNumber: { type: String, required: true, unique: true },
    associateName: { type: String, required: true },
    managerEmployeeNumber: { type: String, required: true },
    managerName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const AssociateManagerMapping = mongoose.model('AssociateManagerMapping', associateManagerMappingSchema);
