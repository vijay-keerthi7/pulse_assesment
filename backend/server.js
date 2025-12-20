require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const authRoutes = require("./routes/Auth.js");
const videoRoutes = require("./routes/Video.js");
const port = process.env.PORT || 5000;
const dbUrl = process.env.MONGO_URL;
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.set("socketio", io);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Logging
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});


app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);

app.get("/test", (req, res) => res.send("Backend is working!"));
io.on("connection", () => console.log("Client connected"));

mongoose.connect(dbUrl)
  .then(() => console.log("MongoDB connected"))
  .catch(console.error);


  server.listen(port, () => console.log("Server running on port 5000"));
