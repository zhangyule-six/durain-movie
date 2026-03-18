import http from "http";
import app from "./app.js";
import { connectDB } from "./lib/db.js";

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log("server is running on port " + PORT);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

