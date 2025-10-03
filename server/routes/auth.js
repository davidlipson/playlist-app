const express = require("express");
const jwt = require("jsonwebtoken");
const { User, Playlist, Comment, Like, SharedPlaylist } = require("../models");
const spotifyService = require("../services/spotifyService");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get Spotify login URL
router.get("/spotify-login", (req, res) => {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    // Validate required environment variables
    if (!clientId) {
      console.error("SPOTIFY_CLIENT_ID is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!redirectUri) {
      console.error("SPOTIFY_REDIRECT_URI is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const scopes =
      "user-read-private user-read-email playlist-read-private playlist-read-collaborative user-library-read user-read-playback-state user-read-currently-playing user-modify-playback-state";

    const authUrl =
      `https://accounts.spotify.com/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `show_dialog=true`;

    console.log("Generated auth URL for client");
    res.json({ authUrl });
  } catch (error) {
    console.error("Error generating Spotify login URL:", error);
    res.status(500).json({ error: "Failed to generate login URL" });
  }
});

// Store processed codes to prevent reuse
const processedCodes = new Set();

// Clean up old codes every 5 minutes to prevent memory leaks
setInterval(() => {
  processedCodes.clear();
  console.log("Cleared processed authorization codes cache");
}, 5 * 60 * 1000); // 5 minutes

// Handle Spotify callback
router.post("/spotify-callback", async (req, res) => {
  try {
    const { code } = req.body;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    // Validate required environment variables
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!redirectUri) {
      console.error("SPOTIFY_REDIRECT_URI is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (!code) {
      console.error("No authorization code provided");
      return res.status(400).json({ error: "Authorization code required" });
    }

    // Check if this code has already been processed
    if (processedCodes.has(code)) {
      console.log("Authorization code already processed, ignoring duplicate request");
      return res.status(400).json({ error: "Authorization code already used" });
    }

    // Mark this code as being processed
    processedCodes.add(code);

    console.log(
      "Processing Spotify callback with code:",
      code.substring(0, 10) + "..."
    );

    // Exchange code for tokens
    const tokenData = await spotifyService.getAccessToken(code, redirectUri);
    console.log("Successfully exchanged code for tokens");

    // Get user profile
    const userProfile = await spotifyService.getUserProfile(
      tokenData.access_token
    );
    console.log("Successfully retrieved user profile:", userProfile.id);

    // Find or create user
    let user = await User.findOne({ where: { spotifyId: userProfile.id } });

    if (!user) {
      console.log("Creating new user:", userProfile.id);
      user = await User.create({
        spotifyId: userProfile.id,
        displayName: userProfile.display_name,
        email: userProfile.email,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      });
    } else {
      console.log("Updating existing user:", userProfile.id);
      // Update tokens
      await user.update({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      });
    }

    // Generate JWT token
    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("Authentication successful for user:", user.id);

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        spotifyId: user.spotifyId,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Spotify callback error:", error);

    // Provide more specific error messages
    if (error.response?.status === 400) {
      return res.status(400).json({ error: "Invalid authorization code" });
    } else if (error.response?.status === 401) {
      return res.status(401).json({ error: "Spotify authentication failed" });
    } else if (error.name === "SequelizeConnectionError") {
      return res.status(500).json({ error: "Database connection failed" });
    } else if (error.name === "SequelizeValidationError") {
      return res.status(500).json({ error: "Database validation failed" });
    }

    res.status(500).json({ error: "Authentication failed" });
  }
});

// Get current user
router.get("/me", authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    spotifyId: req.user.spotifyId,
    displayName: req.user.displayName,
    email: req.user.email,
  });
});

// Get Spotify access token for client
router.get("/spotify-token", authenticateToken, (req, res) => {
  res.json({
    accessToken: req.user.accessToken,
  });
});

// Refresh Spotify token
router.post("/refresh-token", authenticateToken, async (req, res) => {
  try {
    const tokenData = await spotifyService.refreshAccessToken(
      req.user.refreshToken
    );

    await req.user.update({
      accessToken: tokenData.access_token,
      tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
    });

    res.json({
      success: true,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// Get notification count and recent activity
router.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const lastCheck = req.user.lastNotificationCheck || new Date(0); // If never checked, use epoch

    // Get all playlists the user owns or has access to
    const userPlaylists = await Playlist.findAll({
      where: { ownerId: userId },
      attributes: ["id"],
    });

    const sharedPlaylists = await SharedPlaylist.findAll({
      where: { sharedWithUserId: userId },
      include: [{ model: Playlist, as: "playlist", attributes: ["id"] }],
    });

    const allPlaylistIds = [
      ...userPlaylists.map((p) => p.id),
      ...sharedPlaylists.map((sp) => sp.playlist.id),
    ];

    if (allPlaylistIds.length === 0) {
      return res.json({ count: 0, recentActivity: [] });
    }

    // Count new comments and likes since last check
    const newComments = await Comment.count({
      where: {
        playlistId: allPlaylistIds,
        userId: { [require("sequelize").Op.ne]: userId }, // Exclude user's own comments
        createdAt: { [require("sequelize").Op.gt]: lastCheck },
      },
    });

    const newLikes = await Like.count({
      where: {
        playlistId: allPlaylistIds,
        userId: { [require("sequelize").Op.ne]: userId }, // Exclude user's own likes
        createdAt: { [require("sequelize").Op.gt]: lastCheck },
      },
    });

    // Get recent activity (last 10 items) for display
    const recentComments = await Comment.findAll({
      where: {
        playlistId: allPlaylistIds,
        userId: { [require("sequelize").Op.ne]: userId },
      },
      include: [
        { model: User, as: "user", attributes: ["displayName"] },
        { model: Playlist, as: "playlist", attributes: ["name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    const recentLikes = await Like.findAll({
      where: {
        playlistId: allPlaylistIds,
        userId: { [require("sequelize").Op.ne]: userId },
      },
      include: [
        { model: User, as: "user", attributes: ["displayName"] },
        { model: Playlist, as: "playlist", attributes: ["name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    // Combine and sort recent activity
    const recentActivity = [
      ...recentComments.map((comment) => ({
        type: "comment",
        user: comment.user.displayName,
        playlist: comment.playlist.name,
        track: comment.trackName,
        content: comment.content,
        createdAt: comment.createdAt,
      })),
      ...recentLikes.map((like) => ({
        type: "like",
        user: like.user.displayName,
        playlist: like.playlist.name,
        track: like.trackName,
        createdAt: like.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    const totalNotifications = newComments + newLikes;

    res.json({
      count: totalNotifications,
      recentActivity: recentActivity,
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
});

// Mark notifications as read
router.post("/notifications/read", authenticateToken, async (req, res) => {
  try {
    await req.user.update({
      lastNotificationCheck: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

module.exports = router;
