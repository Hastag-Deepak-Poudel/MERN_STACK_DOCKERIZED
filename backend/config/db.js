import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();


const MONGODB_URI =
  `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}` +
  `@mongodb:27017/${process.env.MONGO_DB}?authSource=admin`;

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DB connected");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};


