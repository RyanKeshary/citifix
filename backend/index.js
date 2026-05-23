const express = require("express");
const cors = require("cors");
const path = require("node:path");
const fs = require("node:fs");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const leaderboardRoutes = require("./routes/leaderboard");
const adminRoutes = require("./routes/admin");

const app = express();
const frontendDistPath = path.join(__dirname, "..", "dist");
const hasFrontendBuild = fs.existsSync(frontendDistPath);

app.use(cors());
app.use(express.json());

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/admin", adminRoutes);


if (hasFrontendBuild) {
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Backend running successfully");
  });
}
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
