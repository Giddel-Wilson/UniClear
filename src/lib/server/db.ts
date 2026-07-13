// src/lib/server/db.ts
import mongoose from 'mongoose';

// Reuse connection across serverless invocations (Vercel warm starts)
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: typeof mongoose | null;
}

let cached = global._mongooseConn;

export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI env var is required — add it to your .env file');
  }

  if (cached && mongoose.connection.readyState === 1) {
    return cached;
  }

  const conn = await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  global._mongooseConn = conn;
  cached = conn;
  return conn;
}
