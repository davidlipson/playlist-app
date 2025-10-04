import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import axios from "axios";
import { useSpotify } from "../contexts/SpotifyContext";
import { useAuth } from "../contexts/AuthContext";
import { formatDuration } from "../utils/timeUtils";
import { formatDistanceToNow } from "date-fns";
import UserList from "./UserList";
// import { Favorite, FavoriteBorder, ModeComment } from "@mui/icons-material";

const TrackListContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 90px; /* Add space for the Now Playing component */
`;

// Add CSS animations for the modal
const ModalStyles = styled.div`
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const ViewToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: end;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.05);
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToggleLabel = styled.span<{ isActive: boolean }>`
  font-size: 12px;
  font-weight: 500;
  color: white;
  transition: opacity 0.3s ease;
  opacity: ${(props) => (props.isActive ? "1" : "0.5")};
`;

const ToggleSwitch = styled.div<{ isActive: boolean }>`
  position: relative;
  width: 50px;
  height: 24px;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid white;
`;

const ToggleSlider = styled.div<{ isActive: boolean }>`
  position: absolute;
  top: 2px;
  left: ${(props) => (props.isActive ? "26px" : "2px")};
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: left 0.3s ease;
`;

const TrackItem = styled.div<{ isPlaying: boolean; hasOpenComments: boolean }>`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${(props) =>
    props.isPlaying
      ? "linear-gradient(135deg, rgba(29, 185, 84, 0.3), rgba(30, 215, 96, 0.2))"
      : "transparent"};
  border-left: ${(props) =>
    props.isPlaying ? "4px solid #1db954" : "4px solid transparent"};
  position: relative;

  &:hover {
    background: ${(props) =>
      props.isPlaying
        ? "linear-gradient(135deg, rgba(29, 185, 84, 0.4), rgba(30, 215, 96, 0.3))"
        : "rgba(255, 255, 255, 0.1)"};
  }

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${(props) => (props.isPlaying ? "#1db954" : "transparent")};
    transition: all 0.3s ease;
  }
`;

const TrackNumber = styled.div<{ isPlaying: boolean }>`
  width: 30px;
  text-align: center;
  color: ${(props) =>
    props.isPlaying ? "#1db954" : "rgba(255, 255, 255, 0.6)"};
  font-size: ${(props) => (props.isPlaying ? "16px" : "14px")};
  font-weight: ${(props) => (props.isPlaying ? "bold" : "normal")};
  margin-right: 15px;
  transition: all 0.3s ease;
  animation: ${(props) => (props.isPlaying ? "pulse 2s infinite" : "none")};

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
`;

const TrackImage = styled.div<{ isPlaying: boolean }>`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 15px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.3s ease;
  box-shadow: ${(props) =>
    props.isPlaying ? "0 0 15px rgba(29, 185, 84, 0.5)" : "none"};
  border: ${(props) =>
    props.isPlaying
      ? "2px solid rgba(29, 185, 84, 0.3)"
      : "2px solid transparent"};
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const TrackInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const TrackName = styled.div<{ isPlaying: boolean }>`
  font-weight: ${(props) => (props.isPlaying ? "700" : "600")};
  color: ${(props) => (props.isPlaying ? "#1db954" : "white")};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
`;

const TrackArtists = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TrackDuration = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
`;

const TrackLikes = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  margin-left: 15px;
`;

const TrackLikesButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LikeButton = styled.button<{ isLiked: boolean }>`
  background: ${(props) => (props.isLiked ? "#1db954" : "transparent")};
  border: 1px solid
    ${(props) => (props.isLiked ? "#1db954" : "rgba(255, 255, 255, 0.3)")};
  color: ${(props) => (props.isLiked ? "white" : "rgba(255, 255, 255, 0.7)")};
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: ${(props) =>
      props.isLiked ? "#1ed760" : "rgba(255, 255, 255, 0.1)"};
    border-color: ${(props) =>
      props.isLiked ? "#1ed760" : "rgba(255, 255, 255, 0.5)"};
  }
`;

const AlbumSection = styled.div``;

const AlbumHeader = styled.div<{ isPlaying: boolean }>`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: ${(props) =>
    props.isPlaying
      ? "linear-gradient(135deg, rgba(29, 185, 84, 0.3), rgba(30, 215, 96, 0.2))"
      : "rgba(255, 255, 255, 0.05)"};
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: ${(props) =>
    props.isPlaying ? "4px solid #1db954" : "4px solid transparent"};
  position: relative;

  &:hover {
    background: ${(props) =>
      props.isPlaying
        ? "linear-gradient(135deg, rgba(29, 185, 84, 0.4), rgba(30, 215, 96, 0.3))"
        : "rgba(255, 255, 255, 0.1)"};
  }

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${(props) => (props.isPlaying ? "#1db954" : "transparent")};
    transition: all 0.3s ease;
  }
`;

const AlbumImage = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 15px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
`;

const AlbumImageSrc = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AlbumInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AlbumName = styled.div<{ isPlaying: boolean }>`
  font-weight: ${(props) => (props.isPlaying ? "700" : "600")};
  color: ${(props) => (props.isPlaying ? "#1db954" : "white")};
  font-size: 16px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
`;

const AlbumMeta = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.3s ease;
`;

const AlbumStats = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
`;

const AlbumStatItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
`;

const CollapseButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const AlbumTracks = styled.div<{ isCollapsed: boolean }>`
  display: ${(props) => (props.isCollapsed ? "none" : "block")};
`;

const CommentButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }
`;

interface Like {
  id: string;
  user: {
    id: string;
    displayName: string;
  };
  createdAt: string;
}

interface Track {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    imageUrl: string;
  };
  duration: number;
  previewUrl: string;
  externalUrls: {
    spotify: string;
  };
  likes: Like[];
}

interface TrackListProps {
  tracks: Track[];
  playlistId: string;
  collaborators?: {
    id: string;
    displayName: string;
  }[];
  playlistOwner?: {
    id: string;
    displayName: string;
  };
}

const TrackList: React.FC<TrackListProps> = ({
  tracks,
  playlistId,
  collaborators,
  playlistOwner,
}) => {
  const { playTrack, currentTrack, isPlaying, position, getCurrentState } =
    useSpotify();
  const { user } = useAuth();
  const [trackLikes, setTrackLikes] = useState<{ [trackId: string]: Like[] }>(
    {}
  );
  const [likingTracks, setLikingTracks] = useState<{
    [trackId: string]: boolean;
  }>({});
  const [collapsedAlbums, setCollapsedAlbums] = useState<{
    [albumId: string]: boolean;
  }>({});
  const [showAlbumView, setShowAlbumView] = useState(false);
  const [trackComments, setTrackComments] = useState<{
    [trackId: string]: any[];
  }>({});
  const [showCommentForms, setShowCommentForms] = useState<{
    [trackId: string]: boolean;
  }>({});
  const [commentFormData, setCommentFormData] = useState<{
    [trackId: string]: string;
  }>({});
  const [submittingComments, setSubmittingComments] = useState<{
    [trackId: string]: boolean;
  }>({});
  const [editingComments, setEditingComments] = useState<{
    [commentId: string]: boolean;
  }>({});
  const [editCommentData, setEditCommentData] = useState<{
    [commentId: string]: string;
  }>({});
  const [showCommentMenus, setShowCommentMenus] = useState<{
    [commentId: string]: boolean;
  }>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [capturedTimestamps, setCapturedTimestamps] = useState<{
    [trackId: string]: number;
  }>({});
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false);
  const trackRefs = useRef<{ [trackId: string]: HTMLDivElement | null }>({});

  // Group tracks by album
  const albumGroups = useMemo(() => {
    const groups: { [albumId: string]: Track[] } = {};

    tracks.forEach((track) => {
      const albumId = track.album.id;
      if (!groups[albumId]) {
        groups[albumId] = [];
      }
      groups[albumId].push(track);
    });

    return groups;
  }, [tracks]);

  // Check if any track in an album is currently playing
  const isAlbumPlaying = (albumTracks: Track[]) => {
    return albumTracks.some(
      (track) => currentTrack && track.id === currentTrack.id && isPlaying
    );
  };

  // Initialize all albums as collapsed when tracks change
  useEffect(() => {
    const initialCollapsedState: { [albumId: string]: boolean } = {};
    Object.keys(albumGroups).forEach((albumId) => {
      initialCollapsedState[albumId] = true; // Start collapsed
    });
    setCollapsedAlbums(initialCollapsedState);
  }, [albumGroups]);

  // Initialize track likes from server data
  useEffect(() => {
    const initialLikes: { [trackId: string]: Like[] } = {};
    tracks.forEach((track) => {
      if (track.likes && track.likes.length > 0) {
        initialLikes[track.id] = track.likes;
      }
    });
    setTrackLikes(initialLikes);
  }, [tracks]);

  const toggleAlbumCollapse = (albumId: string) => {
    setCollapsedAlbums((prev) => ({
      ...prev,
      [albumId]: !prev[albumId],
    }));
  };

  const handleTrackClick = async (track: Track) => {
    try {
      const trackUri = `spotify:track:${track.id}`;

      // Create array of all track URIs in the playlist
      const playlistTrackUris = tracks.map((t) => `spotify:track:${t.id}`);

      // Find the index of the clicked track
      const trackIndex = tracks.findIndex((t) => t.id === track.id);

      await playTrack(trackUri, playlistTrackUris, trackIndex);
    } catch (error) {
      console.error("Failed to play track:", error);
      alert("Failed to play track. Please try again.");
    }
  };

  const isTrackPlaying = (track: Track) => {
    return currentTrack?.id === track.id && isPlaying;
  };

  const handleLikeTrack = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent track click
    setLikingTracks((prev) => ({ ...prev, [track.id]: true }));

    try {
      const response = await axios.post("/api/likes/like", {
        playlistId,
        trackId: track.id,
        trackName: track.name,
        artistName: track.artists.map((a) => a.name).join(", "),
      });

      setTrackLikes((prev) => ({
        ...prev,
        [track.id]: [...(prev[track.id] || []), response.data],
      }));
    } catch (error) {
      console.error("Failed to like track:", error);
    } finally {
      setLikingTracks((prev) => ({ ...prev, [track.id]: false }));
    }
  };

  const handleUnlikeTrack = async (track: Track, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent track click
    setLikingTracks((prev) => ({ ...prev, [track.id]: true }));

    try {
      await axios.delete("/api/likes/unlike", {
        data: {
          playlistId,
          trackId: track.id,
        },
      });

      setTrackLikes((prev) => ({
        ...prev,
        [track.id]: (prev[track.id] || []).filter(
          (like) => like.user.id !== user?.id // Remove current user's like
        ),
      }));
    } catch (error) {
      console.error("Failed to unlike track:", error);
    } finally {
      setLikingTracks((prev) => ({ ...prev, [track.id]: false }));
    }
  };

  const isTrackLiked = (track: Track) => {
    if (!user) return false;
    const likes = trackLikes[track.id] || track.likes || [];
    // Check if the current user has liked this track
    return likes.some((like) => like.user.id === user.id);
  };

  const getLikeUsers = (track: Track) => {
    // Use local state if available, otherwise fall back to track.likes from server
    const likes = trackLikes[track.id] || track.likes || [];
    return likes.map((like) => like.user);
  };

  const getAlbumStats = (albumTracks: Track[]) => {
    let totalLikes = 0;
    let totalComments = 0;

    albumTracks.forEach((track) => {
      // Count likes from local state or server data
      const likes = trackLikes[track.id] || track.likes || [];
      totalLikes += likes.length;

      // Count comments from local state
      const comments = trackComments[track.id] || [];
      totalComments += comments.length;
    });

    return { totalLikes, totalComments };
  };

  const fetchTrackComments = useCallback(
    async (trackId: string) => {
      try {
        const response = await axios.get(
          `/api/comments/playlist/${playlistId}/track/${trackId}`
        );
        setTrackComments((prev) => ({
          ...prev,
          [trackId]: response.data,
        }));
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      }
    },
    [playlistId]
  );

  // Load all comments for all tracks when component mounts
  const fetchAllComments = useCallback(async () => {
    try {
      const response = await axios.get(`/api/comments/playlist/${playlistId}`);
      const commentsByTrack: { [trackId: string]: any[] } = {};

      // Group comments by trackId
      response.data.comments.forEach((comment: any) => {
        if (!commentsByTrack[comment.trackId]) {
          commentsByTrack[comment.trackId] = [];
        }
        commentsByTrack[comment.trackId].push(comment);
      });

      setTrackComments(commentsByTrack);
    } catch (error) {
      console.error("Failed to fetch all comments:", error);
    }
  }, [playlistId]);

  const handleCommentSubmit = async (trackId: string, e: React.FormEvent) => {
    e.preventDefault();
    const content = commentFormData[trackId]?.trim();
    if (!content) return;

    setSubmittingComments((prev) => ({ ...prev, [trackId]: true }));
    try {
      await axios.post("/api/comments", {
        playlistId,
        trackId,
        trackName: tracks.find((t) => t.id === trackId)?.name || "",
        artistName:
          tracks
            .find((t) => t.id === trackId)
            ?.artists.map((a) => a.name)
            .join(", ") || "",
        timestamp: 0,
        inSongTimestamp: capturedTimestamps[trackId] || null,
        content,
      });

      setCommentFormData((prev) => ({ ...prev, [trackId]: "" }));
      // Clear the captured timestamp after submitting
      setCapturedTimestamps((prev) => {
        const newState = { ...prev };
        delete newState[trackId];
        return newState;
      });
      // Refresh all comments to show the new one
      await fetchAllComments();

      // Dispatch custom event for real-time updates
      const newComment = {
        id: Date.now().toString(), // Temporary ID until we get the real one
        trackId,
        playlistId,
        content,
        inSongTimestamp: capturedTimestamps[trackId] || null,
        user: { id: user?.id, displayName: user?.displayName },
        playlist: { id: playlistId },
      };

      window.dispatchEvent(
        new CustomEvent("commentAdded", {
          detail: { comment: newComment, trackId },
        })
      );
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setSubmittingComments((prev) => ({ ...prev, [trackId]: false }));
    }
  };

  const handleEditComment = async (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    const content = editCommentData[commentId]?.trim();
    if (!content) return;

    try {
      await axios.put(`/api/comments/${commentId}`, {
        content,
      });

      setEditingComments((prev) => ({ ...prev, [commentId]: false }));
      setEditCommentData((prev) => ({ ...prev, [commentId]: "" }));
      // Refresh all comments to show the updated one
      await fetchAllComments();
    } catch (error) {
      console.error("Failed to edit comment:", error);
      alert("Failed to edit comment. Please try again.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
    setShowCommentMenus({}); // Close any open menus
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      await axios.delete(`/api/comments/${commentToDelete}`);
      // Refresh all comments to remove the deleted one
      await fetchAllComments();
      setShowDeleteModal(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment. Please try again.");
    }
  };

  const cancelDeleteComment = () => {
    setShowDeleteModal(false);
    setCommentToDelete(null);
  };

  const toggleCommentMenu = (commentId: string) => {
    setShowCommentMenus((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const startEditingComment = (comment: any) => {
    setEditingComments((prev) => ({ ...prev, [comment.id]: true }));
    setEditCommentData((prev) => ({ ...prev, [comment.id]: comment.content }));
    setShowCommentMenus((prev) => ({ ...prev, [comment.id]: false }));
  };

  const toggleCommentForm = (trackId: string) => {
    const isCurrentlyOpen = showCommentForms[trackId];

    if (isCurrentlyOpen) {
      // If currently open, close it
      setShowCommentForms((prev) => ({
        ...prev,
        [trackId]: false,
      }));
    } else {
      // If currently closed, open it and close all others
      setShowCommentForms((prev) => {
        const newState: { [trackId: string]: boolean } = {};
        // Close all other comment forms
        Object.keys(prev).forEach((key) => {
          newState[key] = false;
        });
        // Open only this one
        newState[trackId] = true;
        return newState;
      });

      // Capture current track position if user is listening to this track
      if (currentTrack && currentTrack.id === trackId && isPlaying) {
        const currentPositionSeconds = Math.floor(position / 1000);
        setCapturedTimestamps((prev) => ({
          ...prev,
          [trackId]: currentPositionSeconds,
        }));
      }

      // Fetch comments when opening
      fetchTrackComments(trackId);

      // Focus the input after a short delay to ensure it's rendered
      setTimeout(() => {
        const input = document.querySelector(
          `input[data-track-id="${trackId}"]`
        ) as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    }
  };

  // Load all comments when component mounts
  useEffect(() => {
    fetchAllComments();
  }, [fetchAllComments]);

  // Reset auto-scroll flag when playlist changes
  useEffect(() => {
    setHasAutoScrolled(false);
    trackRefs.current = {};
  }, [playlistId]);

  // Auto-scroll to currently playing track on first load
  useEffect(() => {
    if (
      currentTrack &&
      !hasAutoScrolled &&
      tracks.some((track) => track.id === currentTrack.id)
    ) {
      const trackElement = trackRefs.current[currentTrack.id];
      if (trackElement) {
        // Use setTimeout to ensure the element is rendered
        setTimeout(() => {
          trackElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          setHasAutoScrolled(true);
        }, 100);
      }
    }
  }, [currentTrack, hasAutoScrolled, tracks]);

  // Close comment menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-comment-menu]")) {
        setShowCommentMenus({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Note: Spotify state polling is now handled globally in SpotifyContext

  // Debug current track and playing state
  useEffect(() => {}, [currentTrack, isPlaying, position]);

  // No auto-open comments - users must manually open comment sections

  const renderTrackItem = (track: Track, index: number) => {
    const hasOpenComments =
      showCommentForms[track.id] ||
      (trackComments[track.id] && trackComments[track.id].length > 0) ||
      true; // Always show comment section

    return (
      <TrackItem
        key={track.id}
        ref={(el) => (trackRefs.current[track.id] = el)}
        isPlaying={isTrackPlaying(track)}
        hasOpenComments={hasOpenComments}
        onClick={() => handleTrackClick(track)}
      >
        <TrackNumber isPlaying={isTrackPlaying(track)}>
          {isTrackPlaying(track) ? "♪" : index + 1}
        </TrackNumber>

        <TrackImage isPlaying={isTrackPlaying(track)}>
          {track.album.imageUrl ? (
            <Image src={track.album.imageUrl} alt={track.album.name} />
          ) : (
            <span>🎵</span>
          )}
        </TrackImage>

        <TrackInfo>
          <TrackName isPlaying={isTrackPlaying(track)}>{track.name}</TrackName>
          <TrackArtists>
            {track.artists.map((artist) => artist.name).join(", ")}
          </TrackArtists>
        </TrackInfo>

        <TrackLikes>
          <TrackLikesButtons>
            <TrackDuration>{formatDuration(track.duration)}</TrackDuration>
            <LikeButton
              isLiked={isTrackLiked(track)}
              onClick={
                isTrackLiked(track)
                  ? (e) => handleUnlikeTrack(track, e)
                  : (e) => handleLikeTrack(track, e)
              }
              disabled={likingTracks[track.id]}
            >
              {likingTracks[track.id]
                ? "..."
                : isTrackLiked(track)
                ? "❤️"
                : "🤍"}
            </LikeButton>
            <CommentButton
              onClick={(e) => {
                e.stopPropagation();
                toggleCommentForm(track.id);
              }}
              title={
                capturedTimestamps[track.id] && capturedTimestamps[track.id] > 0
                  ? `Comment will be timestamped at ${Math.floor(
                      capturedTimestamps[track.id] / 60
                    )}:${(capturedTimestamps[track.id] % 60)
                      .toString()
                      .padStart(2, "0")}`
                  : "Toggle comments"
              }
            >
              {capturedTimestamps[track.id] && capturedTimestamps[track.id] > 0
                ? "⏰"
                : "💬"}
            </CommentButton>
          </TrackLikesButtons>
          <UserList users={getLikeUsers(track)} variant="small" />
        </TrackLikes>
      </TrackItem>
    );
  };

  const renderCommentsSection = (track: Track) => {
    const comments = trackComments[track.id] || [];
    const showForm = showCommentForms[track.id];
    const isSubmitting = submittingComments[track.id];

    return (
      <div key={`comments-${track.id}`}>
        {/* Comments List - Always show if comments exist */}
        {comments.length > 0 && (
          <div style={{ paddingLeft: "115px", paddingRight: "20px" }}>
            {comments.map((comment: any) => {
              const isOwnComment = comment.user.id === user?.id;
              const isEditing = editingComments[comment.id];
              const showMenu = showCommentMenus[comment.id];

              return (
                <div
                  key={comment.id}
                  style={{
                    borderRadius: "8px",
                    padding: "10px 10px 10px 0px",
                    marginBottom: "8px",
                    color: "white",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "5px",
                    }}
                  >
                    <span
                      style={{
                        color: "white",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      {comment.user.displayName}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          color: "rgba(255, 255, 255, 0.6)",
                          fontSize: "12px",
                        }}
                      >
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {isOwnComment && (
                        <div style={{ position: "relative" }} data-comment-menu>
                          <button
                            onClick={() => toggleCommentMenu(comment.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "rgba(255, 255, 255, 0.6)",
                              cursor: "pointer",
                              padding: "4px",
                              borderRadius: "4px",
                              fontSize: "16px",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "white";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color =
                                "rgba(255, 255, 255, 0.6)";
                            }}
                          >
                            ⋮
                          </button>
                          {showMenu && (
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                right: "0",
                                background: "white",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                                zIndex: 1000,
                                minWidth: "120px",
                                overflow: "hidden",
                              }}
                            >
                              <button
                                onClick={() => startEditingComment(comment)}
                                style={{
                                  width: "100%",
                                  padding: "8px 12px",
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  color: "#333",
                                  textAlign: "left",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#f5f5f5";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                style={{
                                  width: "100%",
                                  padding: "8px 12px",
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  color: "#e74c3c",
                                  textAlign: "left",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#f5f5f5";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <form
                      onSubmit={(e) => handleEditComment(comment.id, e)}
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        value={editCommentData[comment.id] || ""}
                        onChange={(e) =>
                          setEditCommentData((prev) => ({
                            ...prev,
                            [comment.id]: e.target.value,
                          }))
                        }
                        style={{
                          flex: 1,
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "8px",
                          padding: "8px",
                          color: "white",
                          fontSize: "14px",
                          outline: "none",
                        }}
                        autoFocus
                      />
                      <button
                        type="submit"
                        style={{
                          background: "#1db954",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingComments((prev) => ({
                            ...prev,
                            [comment.id]: false,
                          }));
                          setEditCommentData((prev) => ({
                            ...prev,
                            [comment.id]: "",
                          }));
                        }}
                        style={{
                          background: "rgba(255, 255, 255, 0.2)",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <div
                      style={{
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "14px",
                        lineHeight: "1.4",
                      }}
                    >
                      {comment.content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Comment Form */}
        {showForm && (
          <div style={{ paddingLeft: "115px", paddingRight: "20px" }}>
            {capturedTimestamps[track.id] &&
              capturedTimestamps[track.id] > 0 && (
                <div
                  style={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "12px",
                    marginBottom: "5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  ⏰ Commenting on{" "}
                  {Math.floor(capturedTimestamps[track.id] / 60)}:
                  {(capturedTimestamps[track.id] % 60)
                    .toString()
                    .padStart(2, "0")}{" "}
                  in the song
                </div>
              )}
            <form
              onSubmit={(e) => handleCommentSubmit(track.id, e)}
              style={{
                marginTop: "10px",
                marginBottom: "10px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                value={commentFormData[track.id] || ""}
                onChange={(e) =>
                  setCommentFormData((prev) => ({
                    ...prev,
                    [track.id]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCommentSubmit(track.id, e);
                  }
                }}
                required
                placeholder="Add a comment..."
                className="comment-input"
                data-track-id={track.id}
                style={{
                  flex: 1,
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "10px 10px 10px 10px",
                  color: "white",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: isSubmitting
                    ? "rgba(255, 255, 255, 0.2)"
                    : "#1db954",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                  transition: "background 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {isSubmitting ? "..." : "Add"}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <ModalStyles />
      <TrackListContainer>
        <ViewToggle>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <ToggleContainer>
              <ToggleLabel isActive={!showAlbumView}>Song View</ToggleLabel>
              <ToggleSwitch
                isActive={showAlbumView}
                onClick={() => setShowAlbumView(!showAlbumView)}
              >
                <ToggleSlider isActive={showAlbumView} />
              </ToggleSwitch>
              <ToggleLabel isActive={showAlbumView}>Album View</ToggleLabel>
            </ToggleContainer>
            {(() => {
              // Combine owner and collaborators
              const allUsers = [];
              if (playlistOwner) {
                allUsers.push(playlistOwner);
              }
              if (collaborators && collaborators.length > 0) {
                allUsers.push(...collaborators);
              }
              return (
                allUsers.length > 0 && (
                  <UserList users={allUsers} variant="large" />
                )
              );
            })()}
          </div>
        </ViewToggle>

        {showAlbumView ? (
          <>
            {Object.entries(albumGroups).map(([albumId, albumTracks]) => {
              const album = albumTracks[0].album;
              const isCollapsed = collapsedAlbums[albumId] === true;
              const albumStats = getAlbumStats(albumTracks);
              const isPlaying = isAlbumPlaying(albumTracks);

              return (
                <AlbumSection key={albumId}>
                  <AlbumHeader
                    isPlaying={isPlaying}
                    onClick={() => toggleAlbumCollapse(albumId)}
                  >
                    <AlbumImage>
                      {album.imageUrl ? (
                        <AlbumImageSrc src={album.imageUrl} alt={album.name} />
                      ) : (
                        <span>💿</span>
                      )}
                    </AlbumImage>

                    <AlbumInfo>
                      <AlbumName isPlaying={isPlaying}>{album.name}</AlbumName>
                      <AlbumMeta>
                        {albumTracks.length} track
                        {albumTracks.length !== 1 ? "s" : ""} •{" "}
                        {albumTracks[0].artists
                          .map((artist) => artist.name)
                          .join(", ")}
                      </AlbumMeta>
                      <AlbumStats>
                        {albumStats.totalComments > 0 && (
                          <AlbumStatItem>
                            💬 {albumStats.totalComments}
                          </AlbumStatItem>
                        )}
                        {albumStats.totalLikes > 0 && (
                          <AlbumStatItem>
                            ❤️ {albumStats.totalLikes}
                          </AlbumStatItem>
                        )}
                      </AlbumStats>
                    </AlbumInfo>

                    <CollapseButton>
                      {isCollapsed ? "▼" : "▲"} {isCollapsed ? "Show" : "Hide"}
                    </CollapseButton>
                  </AlbumHeader>

                  <AlbumTracks isCollapsed={isCollapsed}>
                    {albumTracks.map((track, index) => (
                      <div key={track.id}>
                        {renderTrackItem(track, tracks.indexOf(track))}
                        {renderCommentsSection(track)}
                      </div>
                    ))}
                  </AlbumTracks>
                </AlbumSection>
              );
            })}
          </>
        ) : (
          <>
            {tracks.map((track, index) => (
              <div key={track.id}>
                {renderTrackItem(track, index)}
                {renderCommentsSection(track)}
              </div>
            ))}
          </>
        )}
      </TrackListContainer>

      {/* Delete Comment Modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={cancelDeleteComment}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
              animation: "slideIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "18px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Delete Comment
            </h3>
            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "14px",
                color: "#666",
                lineHeight: "1.5",
              }}
            >
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={cancelDeleteComment}
                style={{
                  background: "transparent",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#666",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f5f5f5";
                  e.currentTarget.style.borderColor = "#ccc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "#ddd";
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteComment}
                style={{
                  background: "#e74c3c",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "white",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#c0392b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#e74c3c";
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrackList;
