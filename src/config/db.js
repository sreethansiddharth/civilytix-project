// import mongoose from 'mongoose';
// export const connectDB = async () => {
//   const uri = process.env.MONGODB_URI;
//   if (!uri) throw new Error('MONGODB_URI is missing');
//   await mongoose.connect(uri, { autoIndex: true });
//   console.log('MongoDB connected');
// };
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('MongoDB connected...');
//   } catch (err) {
//     console.error(err.message);
//     process.exit(1);
//   }
// };
// export default connectDB;
// src/config/db.js
import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing in .env");
  }
  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed", err.message);
    process.exit(1);
  }
};
export default connectDB;
