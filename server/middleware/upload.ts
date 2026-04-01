import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// ─── Storage destination ──────────────────────────────────────────────────────
// Files land in  <project-root>/server/public/uploads/crops/
// They are served as static files at  /uploads/crops/<filename>

// __dirname here = server/middleware/ — go up one level to reach server/public/
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads", "crops");

// Ensure the directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const timestamp = Date.now();
        const safeName = file.originalname
            .replace(/[^a-z0-9.]/gi, "_")
            .toLowerCase();
        cb(null, `${timestamp}_${safeName}`);
    },
});

// Accept only image files
const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
    }
};

// 5 MB limit
export const cropImageUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).single("image"); // form field name is "image"
