/// <reference path="./types/express.d.ts" />
import dotenv from "dotenv";
import path from "path";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import profileRoutes from "./routes/profileRoutes";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/authRoutes";
import postsRouter from "./routes/posts";
import commentsRouter from "./routes/comments";
import aiRoutes from "./routes/aiRoutes";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const app = express();
const PORT = process.env.PORT || 3000;

// Request logging (skip in test environment)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "uploads" directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);
app.use("/api/ai", aiRoutes);

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({ message: "Internal server error" });
});

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log("Connected to MongoDB");
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(
        `Swagger docs available at http://localhost:${PORT}/api-docs`,
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
