const express = require("express");
const { Like, User } = require("../models");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Like a track
router.post("/like", authenticateToken, async (req, res) => {
  try {
    const { playlistId, trackId, trackName, artistName } = req.body;

    if (!playlistId || !trackId || !trackName || !artistName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user already liked this track
    const existingLike = await Like.findOne({
      where: {
        playlistId,
        userId: req.user.id,
        trackId,
      },
    });

    if (existingLike) {
      return res.status(400).json({ error: "Track already liked" });
    }

    // Create new like
    const like = await Like.create({
      playlistId,
      userId: req.user.id,
      trackId,
      trackName,
      artistName,
    });

    // Fetch the like with user data
    const likeWithUser = await Like.findByPk(like.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "displayName"],
        },
      ],
    });

    res.json(likeWithUser);
  } catch (error) {
    console.error("Error liking track:", error);
    res.status(500).json({ error: "Failed to like track" });
  }
});

// Unlike a track
router.delete("/unlike", authenticateToken, async (req, res) => {
  try {
    const { playlistId, trackId } = req.body;

    if (!playlistId || !trackId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const like = await Like.findOne({
      where: {
        playlistId,
        userId: req.user.id,
        trackId,
      },
    });

    if (!like) {
      return res.status(404).json({ error: "Like not found" });
    }

    await like.destroy();
    res.json({ message: "Track unliked successfully" });
  } catch (error) {
    console.error("Error unliking track:", error);
    res.status(500).json({ error: "Failed to unlike track" });
  }
});

// Get likes for a track
router.get("/track/:playlistId/:trackId", authenticateToken, async (req, res) => {
  try {
    const { playlistId, trackId } = req.params;

    const likes = await Like.findAll({
      where: {
        playlistId,
        trackId,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "displayName"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.json(likes);
  } catch (error) {
    console.error("Error fetching likes:", error);
    res.status(500).json({ error: "Failed to fetch likes" });
  }
});

module.exports = router;
