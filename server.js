import express from "express";
import multer from "multer";
import fs from "fs-extra";
import path from "path";
import cors from "cors";

const app = express();

// ✅ allow frontend requests
app.use(cors());

// temp upload folder
const upload = multer({ dest: "temp/" });

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("📥 Upload API called");

    const subjectId = req.body.subjectId || "Unknown";
    console.log("Subject ID:", subjectId);

    if (!req.file) {
      console.log("❌ No file received");
      return res.status(400).send("No file");
    }

    const uploadDir = path.join("ChordsRecordings", subjectId);

    await fs.ensureDir(uploadDir);

    const newPath = path.join(uploadDir, req.file.originalname);

    await fs.move(req.file.path, newPath);

    console.log("✅ Saved:", newPath);

    res.send({ success: true });
  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).send("Upload failed");
  }
});