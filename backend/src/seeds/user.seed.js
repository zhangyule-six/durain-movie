import { config } from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

config();

const seedUsers = [
  {
    email: "emma.thompson@example.com",
    username: "emma_thompson",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    email: "olivia.miller@example.com",
    username: "olivia_miller",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    email: "sophia.davis@example.com",
    username: "sophia_davis",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/women/3.jpg",
  },
  {
    email: "ava.wilson@example.com",
    username: "ava_wilson",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/women/4.jpg",
  },
  {
    email: "isabella.brown@example.com",
    username: "isabella_brown",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/women/5.jpg",
  },
  {
    email: "mia.johnson@example.com",
    username: "mia_johnson",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/women/6.jpg",
  },
  {
    email: "charlotte.williams@example.com",
    username: "charlotte_williams",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/women/7.jpg",
  },
  {
    email: "amelia.garcia@example.com",
    username: "amelia_garcia",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/women/8.jpg",
  },

  // Male Users
  {
    email: "james.anderson@example.com",
    username: "james_anderson",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    email: "william.clark@example.com",
    username: "william_clark",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    email: "benjamin.taylor@example.com",
    username: "benjamin_taylor",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
  },
  {
    email: "lucas.moore@example.com",
    username: "lucas_moore",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/men/4.jpg",
  },
  {
    email: "henry.jackson@example.com",
    username: "henry_jackson",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/men/5.jpg",
  },
  {
    email: "alexander.martin@example.com",
    username: "alexander_martin",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/men/6.jpg",
  },
  {
    email: "daniel.rodriguez@example.com",
    username: "daniel_rodriguez",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/men/7.jpg",
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    const salt = await bcrypt.genSalt(10);
    const usersWithHashedPassword = await Promise.all(
      seedUsers.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, salt),
      })),
    );

    await User.insertMany(usersWithHashedPassword);
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

seedDatabase();
