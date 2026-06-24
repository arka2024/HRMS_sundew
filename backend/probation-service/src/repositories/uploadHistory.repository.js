import { UploadHistory } from '../models/UploadHistory.js';

export async function addUploadHistory(entry) {
  const upload = new UploadHistory(entry);
  return upload.save();
}

export async function getUploadHistoryByManager(managerId) {
  const query = managerId ? { managerId } : {};
  return UploadHistory.find(query).sort({ createdAt: -1 }).exec();
}
