const jwt = require("jsonwebtoken");


exports.auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = (authHeader && authHeader.split(" ")[1]) || req.query.token;

  // Add this log to see exactly what is arriving
  console.log("Token Received:", token); 

  if (!token || token === "undefined" || token === "null") {
    return res.status(401).json({ message: "No valid token provided" });
  }

  try {
    const secret = process.env.JWT_SECRET || "SECRET_KEY";
    req.user = jwt.verify(token, secret);
    next();
  } catch (err) {
    console.error("JWT Auth Error:", err.message);
    return res.status(403).json({ message: "Malformed or invalid token" });
  }
};

// RBAC middleware
exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "User role not identified" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied: Requires ${roles.join(" or ")} role` });
    }
    next();
  };
};