import mongoose from 'mongoose';
import { MONGO_URI } from './env.js';

export async function connectDb() {
  if (!MONGO_URI || MONGO_URI.includes('<db_password>') || MONGO_URI.includes('PASSWORD') || MONGO_URI.includes('${')) {
    throw new Error(
      'MONGO_URI is not configured correctly in backend/probation-service/.env. Replace <db_password> with your actual MongoDB password.',
    );
  }

  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}
