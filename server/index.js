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
        ? [
            process.env.FRONTEND_URL || "https://your-app.herokuapp.com",
            "https://your-app.herokuapp.com",
            "https://playlist-app-*.herokuapp.com",
          ]
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
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasSpotifyClientId: !!process.env.SPOTIFY_CLIENT_ID,
    hasSpotifyClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    hasSpotifyRedirectUri: !!process.env.SPOTIFY_REDIRECT_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    port: process.env.PORT || 5003,
  };

  console.log("Health check requested:", health);
  res.json(health);
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

    // Run migrations
    try {
      await sequelize.getQueryInterface().addColumn('comments', 'inSongTimestamp', {
        type: sequelize.constructor.DataTypes.INTEGER,
        allowNull: true,
        comment: 'Timestamp in seconds when user clicked comment button while listening to the song'
      });
      console.log("Migration: inSongTimestamp column added to comments table");
    } catch (migrationError) {
      if (migrationError.message.includes('already exists') || migrationError.message.includes('duplicate column')) {
        console.log("Migration: inSongTimestamp column already exists, skipping...");
      } else {
        console.log("Migration error (non-critical):", migrationError.message);
      }
    }

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
