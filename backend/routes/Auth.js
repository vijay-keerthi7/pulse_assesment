const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Video = require("../models/Video"); 
const { auth, allowRoles } = require("../middleware/Auth"); 

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });

    if (await User.findOne({ email })) return res.status(409).json({ message: "User exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role: role || "user" 
    });

    res.status(201).json({ message: "User registered", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

   
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});



// Get all users (Admin only)
router.get("/users", auth, allowRoles("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Hide passwords for security
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Could not fetch users" });
  }
});


router.delete("/users/:id", auth, allowRoles("admin"), async (req, res) => {
  try {
    const userIdToDelete = req.params.id;

  
    if (userIdToDelete === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    await User.findByIdAndDelete(userIdToDelete);
    
    
    await Video.deleteMany({ uploadedBy: userIdToDelete }); 
    
    res.json({ message: "User and their videos deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting user" });
  }
});

module.exports = router;