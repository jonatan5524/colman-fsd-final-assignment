/// <reference path="./types/express.d.ts" />
import dotenv from "dotenv";
import path from "path";
import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import http from "http";
import https from "https";
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
    origin: true, // Reflects the request origin, allowing all origins
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

    if (process.env.NODE_ENV === "production") {
      const privateKey = fs.readFileSync(path.join(process.cwd(), "cert", "key.pem"), "utf8");
      const certificate = fs.readFileSync(path.join(process.cwd(), "cert", "cert.pem"), "utf8");
      const credentials = { key: privateKey, cert: certificate };

      const httpsServer = https.createServer(credentials, app);
      httpsServer.listen(PORT, () => {
        console.log(`HTTPS Server is running on port ${PORT}`);
        console.log(
          `Swagger docs available at https://localhost:${PORT}/api-docs`,
        );
      });
    } else {
      const httpServer = http.createServer(app);
      httpServer.listen(PORT, () => {
        console.log(`HTTP Server is running on port ${PORT}`);
        console.log(
          `Swagger docs available at http://localhost:${PORT}/api-docs`,
        );
      });
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
