const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Video = require("../models/Video");
const { auth, allowRoles } = require("../middleware/Auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } 
});

router.post("/upload", auth, allowRoles("editor", "admin"), upload.single("video"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No video file uploaded" });

    const video = await Video.create({
      title: req.body.title || "Untitled",
      filename: req.file.filename,
      uploadedBy: req.user.id,
      status: "processing",
      progress: 0
    });

    const io = req.app.get("socketio");

    
    let progress = 0;
    const interval = setInterval(async () => {
      progress += 25;
      
      await Video.findByIdAndUpdate(video._id, { progress });
      io.emit("processing-update", { videoId: video._id, progress });

      if (progress >= 100) {
        clearInterval(interval);
       
        const isSafe = Math.random() > 0.2; 
        const finalStatus = isSafe ? "safe" : "flagged";

        await Video.findByIdAndUpdate(video._id, { status: finalStatus });
        io.emit("processing-complete", { videoId: video._id, status: finalStatus });
      }
    }, 2000);

    res.status(201).json(video);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});


router.get("/", auth, async (req, res) => {
  try {
    let filter = {};

   
    if (req.user.role === "editor") {
      filter.uploadedBy = req.user.id;
    } else if (req.user.role === "user") {
    
      filter.status = "safe"; 
    }
  

    const videos = await Video.find(filter).sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: "Error fetching videos" });
  }
});


router.get("/:id", auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    
    if (video.status === "flagged" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Video flagged as unsafe" });
    }

    const videoPath = path.join(__dirname, "../uploads", video.filename);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: "Physical file not found" });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
     
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 10 ** 6, fileSize - 1);

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "video/mp4",
      });
      file.pipe(res);
    } else {
     
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      });
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Streaming error" });
  }
});


router.delete("/:id", auth, allowRoles("editor", "admin"), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    
    if (req.user.role === "editor" && video.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this video" });
    }

   
    const videoPath = path.join(__dirname, "../uploads", video.filename);
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);

   
    await Video.findByIdAndDelete(req.params.id);

    res.json({ message: "Video deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});



router.put("/:id", auth, allowRoles("editor", "admin"), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    
    if (req.user.role === "editor" && video.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updates = { title: req.body.title };
    if (req.user.role === "admin" && req.body.status) {
      updates.status = req.body.status;
    }

    const updatedVideo = await Video.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updatedVideo);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

router.delete("/:id", auth, allowRoles("editor", "admin"), async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    if (req.user.role === "editor" && video.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const filePath = path.join(__dirname, "../uploads", video.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: "Video removed" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});


module.exports = router;