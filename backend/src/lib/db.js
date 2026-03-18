import mongoose from "mongoose";

let cached = global.__durianMongoConnection;
if (!cached) {
  cached = global.__durianMongoConnection = {
    promise: null,
  };
}

export const connectDB = async () => {
  if (mongoose.connection?.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI 未配置");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri)
      .then((conn) => {
        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn.connection;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  return await cached.promise;
};
