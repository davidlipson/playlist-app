import React, { useState, useMemo, useEffect, useCallback } from "react";
import styled from "styled-components";
import axios from "axios";
import { useSpotify } from "../contexts/SpotifyContext";
import { useAuth } from "../contexts/AuthContext";
import { formatDuration } from "../utils/timeUtils";
import { formatDistanceToNow } from "date-fns";
// import { Favorite, FavoriteBorder, ModeComment } from "@mui/icons-material";

const TrackListContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 90px; /* Add space for the Now Playing component */
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
  margin-left: 15px;
`;

const TrackLikes = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: 15px;
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

const LikeAvatars = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: 8px;
`;

const LikeAvatar = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1db954;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const NowPlayingContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(238, 231, 222, 0.3);
  backdrop-filter: blur(15px);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 1000;
`;

const NowPlayingInfo = styled.div`
  text-align: center;
`;

const NowPlayingTrackName = styled.div`
  color: #2c2c2c;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
`;

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  min-width: 200px;
  width: 100%;
  max-width: 400px;
  gap: 10px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 5px;
  cursor: pointer;

  &:hover {
    height: 8px;
  }
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: #1db954;
  width: ${(props) => props.progress}%;
  transition: width 0.3s ease;
  border-radius: 3px;
`;

const TimeDisplay = styled.div`
  color: rgba(44, 44, 44, 0.8);
  font-size: 11px;
  font-family: monospace;
  white-space: nowrap;
`;

const AlbumSection = styled.div``;

const AlbumHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
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

const AlbumName = styled.div`
  font-weight: 600;
  color: white;
  font-size: 16px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AlbumMeta = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  margin-left: 8px;

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
}

const TrackList: React.FC<TrackListProps> = ({ tracks, playlistId }) => {
  console.log("TrackList component rendering with playlistId:", playlistId);
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
      await playTrack(trackUri);
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

  const getLikeAvatars = (track: Track) => {
    // Use local state if available, otherwise fall back to track.likes from server
    const likes = trackLikes[track.id] || track.likes || [];
    return likes.slice(0, 3).map((like, index) => (
      <LikeAvatar key={like.id} title={like.user.displayName}>
        {like.user.displayName.charAt(0).toUpperCase()}
      </LikeAvatar>
    ));
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
    console.log("fetchAllComments called with playlistId:", playlistId);
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
        content,
      });

      setCommentFormData((prev) => ({ ...prev, [trackId]: "" }));
      // Refresh all comments to show the new one
      await fetchAllComments();
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setSubmittingComments((prev) => ({ ...prev, [trackId]: false }));
    }
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
    console.log("fetchAllComments useEffect running");
    fetchAllComments();
  }, [fetchAllComments]);

  // Check current playing song every 2 seconds for position updates
  useEffect(() => {
    console.log(
      "TrackList useEffect running - setting up interval for position polling"
    );
    const interval = setInterval(() => {
      console.log("Polling for current state and position...");
      getCurrentState();
    }, 2000); // 2 seconds for position updates

    // Also check immediately when component mounts
    console.log("Initial getCurrentState call");
    getCurrentState();

    return () => {
      console.log("TrackList useEffect cleanup - clearing interval");
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove getCurrentState from dependencies to prevent infinite loop

  // Debug current track and playing state
  useEffect(() => {
    console.log("Current track changed:", currentTrack);
    console.log("Is playing:", isPlaying);
    console.log("Position:", position);
  }, [currentTrack, isPlaying, position]);

  // No auto-open comments - users must manually open comment sections

  const renderTrackItem = (track: Track, index: number) => {
    const hasOpenComments =
      showCommentForms[track.id] ||
      (trackComments[track.id] && trackComments[track.id].length > 0) ||
      true; // Always show comment section

    return (
      <TrackItem
        key={track.id}
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

        <TrackDuration>{formatDuration(track.duration)}</TrackDuration>

        <TrackLikes>
          <LikeButton
            isLiked={isTrackLiked(track)}
            onClick={
              isTrackLiked(track)
                ? (e) => handleUnlikeTrack(track, e)
                : (e) => handleLikeTrack(track, e)
            }
            disabled={likingTracks[track.id]}
          >
            {likingTracks[track.id] ? "..." : isTrackLiked(track) ? "❤️" : "🤍"}
          </LikeButton>
          <CommentButton
            onClick={(e) => {
              e.stopPropagation();
              toggleCommentForm(track.id);
            }}
            title="Toggle comments"
          >
            💬
          </CommentButton>
          {getLikeAvatars(track).length > 0 && (
            <LikeAvatars>{getLikeAvatars(track)}</LikeAvatars>
          )}
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
            {comments.map((comment: any) => (
              <div
                key={comment.id}
                style={{
                  borderRadius: "8px",
                  padding: "10px 10px 10px 0px",
                  marginBottom: "8px",
                  color: "white",
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
                </div>
                <div
                  style={{
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "14px",
                    lineHeight: "1.4",
                  }}
                >
                  {comment.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comment Form */}
        {showForm && (
          <form
            onSubmit={(e) => handleCommentSubmit(track.id, e)}
            style={{
              marginTop: "10px",
              marginBottom: "10px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
              paddingLeft: "115px",
              paddingRight: "20px",
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
        )}
      </div>
    );
  };

  return (
    <>
      <TrackListContainer>
        <ViewToggle>
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
        </ViewToggle>

        {showAlbumView ? (
          <>
            {Object.entries(albumGroups).map(([albumId, albumTracks]) => {
              const album = albumTracks[0].album;
              const isCollapsed = collapsedAlbums[albumId] === true;

              return (
                <AlbumSection key={albumId}>
                  <AlbumHeader onClick={() => toggleAlbumCollapse(albumId)}>
                    <AlbumImage>
                      {album.imageUrl ? (
                        <AlbumImageSrc src={album.imageUrl} alt={album.name} />
                      ) : (
                        <span>💿</span>
                      )}
                    </AlbumImage>

                    <AlbumInfo>
                      <AlbumName>{album.name}</AlbumName>
                      <AlbumMeta>
                        {albumTracks.length} track
                        {albumTracks.length !== 1 ? "s" : ""} •{" "}
                        {albumTracks[0].artists
                          .map((artist) => artist.name)
                          .join(", ")}
                      </AlbumMeta>
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

      {/* Now Playing Component */}
      {(currentTrack || true) && (
        <NowPlayingContainer>
          <ProgressContainer>
            <TimeDisplay>
              {currentTrack ? formatDuration(position) : "0:00"}
            </TimeDisplay>
            <ProgressBar>
              <ProgressFill
                progress={
                  currentTrack && currentTrack.duration_ms > 0
                    ? (position / currentTrack.duration_ms) * 100
                    : 0
                }
              />
            </ProgressBar>
            <TimeDisplay>
              {currentTrack ? formatDuration(currentTrack.duration_ms) : "0:00"}
            </TimeDisplay>
          </ProgressContainer>
          <NowPlayingInfo>
            <NowPlayingTrackName>
              {currentTrack?.name || "No track playing"}
            </NowPlayingTrackName>
          </NowPlayingInfo>
        </NowPlayingContainer>
      )}
    </>
  );
};

export default TrackList;
