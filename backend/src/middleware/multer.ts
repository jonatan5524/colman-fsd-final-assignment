import multer from "multer";
import path from "path";
import fs from "fs";

export const baseUploadDir = path.join(__dirname, "../../uploads");

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload directory based on the route
    let subDir = "other";
    if (req.originalUrl.includes("/posts")) {
      subDir = "posts";
    } else if (req.originalUrl.includes("/users")) {
      subDir = "profiles";
    }

    const uploadDir = path.join(baseUploadDir, subDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let prefix = "file";
    if (req.originalUrl.includes("/posts")) {
      prefix = "post";
    } else if (req.originalUrl.includes("/users")) {
      prefix = "profile";
    }
    cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter - only images
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
