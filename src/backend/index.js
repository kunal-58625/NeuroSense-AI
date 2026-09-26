import express from "express";
import multer from "multer";
import fs from "fs-extra";
import path from "path";

const app = express();
const upload = multer({ dest: "temp/" });

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const subjectId = req.body.subjectId || "Unknown";

    const uploadDir = path.join("ChordsRecordings", subjectId);

    await fs.ensureDir(uploadDir);

    const newPath = path.join(uploadDir, req.file.originalname);

    await fs.move(req.file.path, newPath);

    console.log("✅ Saved:", newPath);

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Upload failed");
  }
});

app.listen(5000, () => console.log("🚀 Server running on 5000"));