require("dotenv").config({ path: "./.env" });
const express = require("express");
const cors = require("cors");
const path = require("path");
const sequelize = require("./config/database");
const { User, Playlist, Comment, SharedPlaylist, Like } = require("./models");

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-app.herokuapp.com"]
        : ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/playlists", require("./routes/playlists"));
app.use("/api/comments", require("./routes/comments"));
app.use("/api/likes", require("./routes/likes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../client/build");
  app.use(express.static(buildPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Database connection and server start
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Sync database models
    await sequelize.sync({ force: false });
    console.log("Database models synchronized.");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
}

startServer();
