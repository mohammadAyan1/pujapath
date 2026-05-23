import multer from "multer";
import path from "path";
import fs from "fs";

export const uploadImage = (folderName = "chat") => {
  const uploadPath = `uploads/${folderName}`;

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueName + path.extname(file.originalname));
    },
  });

  const fileFilter = (req, file, cb) => {
    // ✅ Chat allowed types
    const allowed = [
      // Images
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",

      // Videos
      "video/mp4",
      "video/webm",
      "video/quicktime", // .mov

      // Documents
      "application/pdf",
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/vnd.ms-excel", // .xls
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "text/plain", // .txt

      // Zip / Rar
      "application/zip",
      "application/x-zip-compressed",
      "application/vnd.rar",
      "application/x-rar-compressed",
    ];

    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("File type not allowed!"), false);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 }, // ✅ 100MB for chat
  });
};
