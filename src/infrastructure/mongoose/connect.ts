import mongoose from 'mongoose';

export async function connectMongo(uri: string): Promise<void> {
  await mongoose.connect(uri);
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
