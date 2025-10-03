const express = require("express");
const { Playlist, Comment, User } = require("../models");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get comments for a playlist
router.get("/playlist/:playlistId", authenticateToken, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { trackId } = req.query;

    let whereClause = { playlistId };
    if (trackId) {
      whereClause.trackId = trackId;
    }

    const comments = await Comment.findAll({
      where: whereClause,
      include: [{ model: User, as: "user", attributes: ["id", "displayName"] }],
      order: [["createdAt", "ASC"]],
    });

    res.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Get comments for a specific track in a playlist
router.get(
  "/playlist/:playlistId/track/:trackId",
  authenticateToken,
  async (req, res) => {
    try {
      const { playlistId, trackId } = req.params;

      const comments = await Comment.findAll({
        where: { playlistId, trackId },
        include: [
          { model: User, as: "user", attributes: ["id", "displayName"] },
        ],
        order: [["createdAt", "ASC"]],
      });

      res.json(comments);
    } catch (error) {
      console.error("Error fetching track comments:", error);
      res.status(500).json({ error: "Failed to fetch track comments" });
    }
  }
);

// Add a comment
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      playlistId,
      trackId,
      trackName,
      artistName,
      timestamp,
      inSongTimestamp,
      content,
    } = req.body;

    if (
      !playlistId ||
      !trackId ||
      !trackName ||
      !artistName ||
      timestamp === undefined ||
      !content
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Verify playlist exists and user has access
    const playlist = await Playlist.findByPk(playlistId);
    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    const comment = await Comment.create({
      playlistId,
      userId: req.user.id,
      trackId,
      trackName,
      artistName,
      timestamp: parseInt(timestamp),
      inSongTimestamp: inSongTimestamp ? parseInt(inSongTimestamp) : null,
      content: content.trim(),
    });

    const commentWithUser = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: "user", attributes: ["id", "displayName"] }],
    });

    res.status(201).json({ comment: commentWithUser });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// Update a comment
router.put("/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to edit this comment" });
    }

    await comment.update({ content: content.trim() });

    const updatedComment = await Comment.findByPk(commentId, {
      include: [{ model: User, as: "user", attributes: ["id", "displayName"] }],
    });

    res.json({ comment: updatedComment });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Failed to update comment" });
  }
});

// Delete a comment
router.delete("/:commentId", authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.userId !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    }

    await comment.destroy();

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

module.exports = router;
