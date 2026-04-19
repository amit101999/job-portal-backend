const mongoose = require("mongoose");

/**
 * Reuse one connection across Vercel serverless invocations (warm lambdas).
 * Without this, connect() may never complete before handlers run when using app.listen().
 */
let cached = global.__mongooseJobPortal;

if (!cached) {
  cached = global.__mongooseJobPortal = { conn: null, promise: null };
}

const connectDb = async () => {
  const uri = process.env.MONGODB_URL;
  if (!uri) {
    throw new Error("MONGODB_URL is not set");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };
    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log("Connected to MongoDB");
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    console.error("Error connecting to MongoDB:", err.message);
    throw err;
  }
};

module.exports = connectDb;