import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@durian.com";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123456";

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    const existing = await User.findOne({ email: ADMIN_EMAIL });

    if (existing) {
      if (existing.role === "admin") {
        console.log(`User "${existing.username}" is already an admin.`);
      } else {
        existing.role = "admin";
        await existing.save();
        console.log(
          `User "${existing.username}" has been promoted to admin.`,
        );
      }
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

      await User.create({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
      });
      console.log(
        `Admin user "${ADMIN_USERNAME}" created with email "${ADMIN_EMAIL}".`,
      );
    }
  } catch (err) {
    console.error("Seed admin failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Done.");
  }
}

seedAdmin();
