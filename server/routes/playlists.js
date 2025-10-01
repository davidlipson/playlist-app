const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { User, Playlist, Comment, SharedPlaylist, Like } = require("../models");
const spotifyService = require("../services/spotifyService");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Get user's Spotify playlists
router.get("/my-playlists", authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Get playlists from Spotify
    const spotifyPlaylists = await spotifyService.getUserPlaylists(
      req.user.accessToken,
      parseInt(limit),
      parseInt(offset)
    );

    // Get our database playlists for this user
    const dbPlaylists = await Playlist.findAll({
      where: { ownerId: req.user.id },
      include: [
        { model: User, as: "owner", attributes: ["id", "displayName"] },
        { model: Comment, as: "comments", attributes: ["id"] },
      ],
    });

    // Merge Spotify data with our database data and create missing entries
    const playlists = await Promise.all(
      spotifyPlaylists.items.map(async (spotifyPlaylist) => {
        let dbPlaylist = dbPlaylists.find(
          (p) => p.spotifyPlaylistId === spotifyPlaylist.id
        );

        // If playlist doesn't exist in our database, create it
        if (!dbPlaylist) {
          dbPlaylist = await Playlist.findOrCreate({
            where: { spotifyPlaylistId: spotifyPlaylist.id },
            defaults: {
              spotifyPlaylistId: spotifyPlaylist.id,
              name: spotifyPlaylist.name,
              description: spotifyPlaylist.description,
              imageUrl: spotifyPlaylist.images?.[0]?.url || null,
              ownerId: req.user.id,
              shareCode: uuidv4(),
            },
          });
          dbPlaylist = dbPlaylist[0]; // findOrCreate returns [instance, created]
        }

        return {
          id: dbPlaylist.id,
          spotifyId: spotifyPlaylist.id,
          name: spotifyPlaylist.name,
          description: spotifyPlaylist.description,
          imageUrl: spotifyPlaylist.images?.[0]?.url || null,
          owner: {
            id: spotifyPlaylist.owner.id,
            displayName: spotifyPlaylist.owner.display_name,
          },
          tracks: spotifyPlaylist.tracks,
          isPublic: dbPlaylist.isPublic,
          shareCode: dbPlaylist.shareCode,
          commentCount: dbPlaylist.comments?.length || 0,
          createdAt: dbPlaylist.createdAt,
        };
      })
    );

    res.json({
      playlists,
      total: spotifyPlaylists.total,
      limit: spotifyPlaylists.limit,
      offset: spotifyPlaylists.offset,
    });
  } catch (error) {
    console.error("Error fetching playlists:", error);

    if (error.message === "SPOTIFY_TOKEN_EXPIRED") {
      return res.status(401).json({
        error: "Spotify token expired",
        code: "TOKEN_EXPIRED",
        message: "Please log in again to refresh your Spotify connection",
      });
    }

    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

// Get shared playlists
router.get("/shared-playlists", authenticateToken, async (req, res) => {
  try {
    const sharedPlaylists = await SharedPlaylist.findAll({
      where: { sharedWithUserId: req.user.id },
      include: [
        {
          model: Playlist,
          as: "playlist",
          include: [
            { model: User, as: "owner", attributes: ["id", "displayName"] },
            { model: Comment, as: "comments", attributes: ["id"] },
          ],
        },
      ],
    });

    const playlists = sharedPlaylists.map((shared) => ({
      id: shared.playlist.id,
      spotifyId: shared.playlist.spotifyPlaylistId,
      name: shared.playlist.name,
      description: shared.playlist.description,
      imageUrl: shared.playlist.imageUrl,
      owner: {
        id: shared.playlist.owner.id,
        displayName: shared.playlist.owner.displayName,
      },
      isPublic: shared.playlist.isPublic,
      shareCode: shared.playlist.shareCode,
      commentCount: shared.playlist.comments.length,
      createdAt: shared.playlist.createdAt,
      sharedAt: shared.createdAt,
    }));

    res.json({ playlists });
  } catch (error) {
    console.error("Error fetching shared playlists:", error);
    res.status(500).json({ error: "Failed to fetch shared playlists" });
  }
});

// Get playlist details with tracks
router.get("/:playlistId", authenticateToken, async (req, res) => {
  try {
    const { playlistId } = req.params;

    // Check if it's a Spotify playlist ID or our database ID
    let playlist;
    let spotifyPlaylist;

    if (playlistId.startsWith("spotify:playlist:")) {
      const spotifyId = playlistId.replace("spotify:playlist:", "");
      spotifyPlaylist = await spotifyService.getPlaylist(
        req.user.accessToken,
        spotifyId
      );
      playlist = await Playlist.findOne({
        where: { spotifyPlaylistId: spotifyId },
      });
    } else {
      playlist = await Playlist.findByPk(playlistId, {
        include: [
          { model: User, as: "owner", attributes: ["id", "displayName"] },
          {
            model: Comment,
            as: "comments",
            include: [
              { model: User, as: "user", attributes: ["id", "displayName"] },
            ],
          },
        ],
      });

      if (playlist) {
        spotifyPlaylist = await spotifyService.getPlaylist(
          req.user.accessToken,
          playlist.spotifyPlaylistId
        );
      }
    }

    if (!spotifyPlaylist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Get tracks
    const tracksData = await spotifyService.getPlaylistTracks(
      req.user.accessToken,
      spotifyPlaylist.id
    );

    // Get likes for all tracks in this playlist
    const playlistLikes = playlist
      ? await Like.findAll({
          where: { playlistId: playlist.id },
          include: [
            { model: User, as: "user", attributes: ["id", "displayName"] },
          ],
        })
      : [];

    // Group likes by track ID
    const likesByTrack = {};
    playlistLikes.forEach((like) => {
      if (!likesByTrack[like.trackId]) {
        likesByTrack[like.trackId] = [];
      }
      likesByTrack[like.trackId].push({
        id: like.id,
        user: like.user,
        createdAt: like.createdAt,
      });
    });

    const result = {
      id: playlist?.id || null,
      spotifyId: spotifyPlaylist.id,
      name: spotifyPlaylist.name,
      description: spotifyPlaylist.description,
      imageUrl: spotifyPlaylist.images?.[0]?.url || null,
      owner: {
        id: spotifyPlaylist.owner.id,
        displayName: spotifyPlaylist.owner.display_name,
      },
      tracks: tracksData.items.map((item) => ({
        id: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
        })),
        album: {
          id: item.track.album.id,
          name: item.track.album.name,
          imageUrl: item.track.album.images?.[0]?.url || null,
        },
        duration: item.track.duration_ms,
        previewUrl: item.track.preview_url,
        externalUrls: item.track.external_urls,
        likes: likesByTrack[item.track.id] || [],
      })),
      isPublic: playlist?.isPublic || false,
      shareCode: playlist?.shareCode || null,
      comments: playlist?.comments || [],
      totalTracks: tracksData.total,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching playlist details:", error);
    res.status(500).json({ error: "Failed to fetch playlist details" });
  }
});

// Share a playlist
router.post("/:playlistId/share", authenticateToken, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { shareWithUserId } = req.body;

    // Get or create playlist in our database
    let playlist = await Playlist.findOne({
      where: { spotifyPlaylistId: playlistId },
    });

    if (!playlist) {
      // Get playlist details from Spotify
      const spotifyPlaylist = await spotifyService.getPlaylist(
        req.user.accessToken,
        playlistId
      );

      playlist = await Playlist.create({
        spotifyPlaylistId: playlistId,
        name: spotifyPlaylist.name,
        description: spotifyPlaylist.description,
        imageUrl: spotifyPlaylist.images?.[0]?.url || null,
        ownerId: req.user.id,
        shareCode: uuidv4(),
      });
    }

    // Share with user
    const sharedPlaylist = await SharedPlaylist.create({
      playlistId: playlist.id,
      sharedWithUserId: shareWithUserId,
      sharedByUserId: req.user.id,
    });

    res.json({ success: true, shareCode: playlist.shareCode });
  } catch (error) {
    console.error("Error sharing playlist:", error);
    res.status(500).json({ error: "Failed to share playlist" });
  }
});

// Get playlist by share code
router.get("/share/:shareCode", authenticateToken, async (req, res) => {
  try {
    const { shareCode } = req.params;

    const playlist = await Playlist.findOne({
      where: { shareCode },
      include: [
        { model: User, as: "owner", attributes: ["id", "displayName"] },
      ],
    });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Check if user is trying to join their own playlist
    if (playlist.ownerId === req.user.id) {
      return res.status(400).json({ error: "Cannot join your own playlist" });
    }

    // Check if already shared with this user
    const existingShare = await SharedPlaylist.findOne({
      where: {
        playlistId: playlist.id,
        sharedWithUserId: req.user.id,
      },
    });

    if (!existingShare) {
      // Share with current user
      await SharedPlaylist.create({
        playlistId: playlist.id,
        sharedWithUserId: req.user.id,
        sharedByUserId: playlist.ownerId,
      });
    }
    // If already shared, just return the playlist data (no error)

    res.json({
      id: playlist.id,
      spotifyId: playlist.spotifyPlaylistId,
      name: playlist.name,
      description: playlist.description,
      imageUrl: playlist.imageUrl,
      owner: {
        id: playlist.owner.id,
        displayName: playlist.owner.displayName,
      },
      shareCode: playlist.shareCode,
    });
  } catch (error) {
    console.error("Error accessing shared playlist:", error);
    res.status(500).json({ error: "Failed to access shared playlist" });
  }
});

// Generate shareable link for a playlist
router.get("/:playlistId/share-link", authenticateToken, async (req, res) => {
  try {
    const { playlistId } = req.params;

    // Get or create playlist in our database
    let playlist = await Playlist.findOne({
      where: { spotifyPlaylistId: playlistId },
    });

    if (!playlist) {
      // Get playlist details from Spotify
      const spotifyPlaylist = await spotifyService.getPlaylist(
        req.user.accessToken,
        playlistId
      );

      playlist = await Playlist.create({
        spotifyPlaylistId: playlistId,
        name: spotifyPlaylist.name,
        description: spotifyPlaylist.description,
        imageUrl: spotifyPlaylist.images?.[0]?.url || null,
        ownerId: req.user.id,
        shareCode: uuidv4(),
      });
    }

    // Generate the shareable link
    const shareLink = `${req.protocol}://${req.get("host")}/share/${
      playlist.shareCode
    }`;

    res.json({
      success: true,
      shareLink,
      shareCode: playlist.shareCode,
    });
  } catch (error) {
    console.error("Error generating share link:", error);
    res.status(500).json({ error: "Failed to generate share link" });
  }
});

module.exports = router;
