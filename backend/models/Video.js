const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: String,
    filename: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["processing", "safe", "flagged"], default: "processing" },
    progress: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema);
