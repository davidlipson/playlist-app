import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useSpotify } from "../contexts/SpotifyContext";
import { formatDuration, formatTimestamp } from "../utils/timeUtils";
import axios from "axios";

const NowPlayingContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  max-width: 300px;
  min-width: 250px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const NowPlayingInfo = styled.div`
  text-align: center;
`;

const NowPlayingTrackName = styled.div`
  color: white;
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
  width: 100%;
  gap: 8px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: visible;
  margin-bottom: 5px;
  cursor: pointer;
  position: relative;

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
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  font-family: monospace;
  white-space: nowrap;
`;

const CommentIndicator = styled.div<{ position: number }>`
  position: absolute;
  top: 50%;
  left: ${(props) => props.position}%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: #1db954;
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    width: 12px;
    height: 12px;
    box-shadow: 0 0 8px rgba(29, 185, 84, 0.6);
  }
`;

const CommentTooltip = styled.div<{ isVisible: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
  max-width: 200px;
  z-index: 1000;
  opacity: ${(props) => (props.isVisible ? 1 : 0)};
  visibility: ${(props) => (props.isVisible ? "visible" : "hidden")};
  transition: opacity 0.2s ease, visibility 0.2s ease;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }
`;

interface NowPlayingProps {
  trackComments?: { [trackId: string]: any[] };
  currentPlaylistId?: string;
}

const NowPlaying: React.FC<NowPlayingProps> = ({
  trackComments = {},
  currentPlaylistId,
}) => {
  const { currentTrack, position } = useSpotify();
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [currentTrackComments, setCurrentTrackComments] = useState<any[]>([]);
  const [lastCommentCount, setLastCommentCount] = useState<number>(0);

  // Fetch comments for the current track
  useEffect(() => {
    const fetchCurrentTrackComments = async () => {
      if (!currentTrack) {
        setCurrentTrackComments([]);
        return;
      }

        "🎵 Fetching comments for track:",
        currentTrack.name,
        "ID:",
        currentTrack.id
      );

      try {
        // Try to get comments from the passed trackComments prop first
        if (trackComments[currentTrack.id]) {
            "🎵 Using comments from props:",
            trackComments[currentTrack.id].length,
            "comments"
          );
          setCurrentTrackComments(trackComments[currentTrack.id]);
          return;
        }


        // Fetch all comments for this track across all playlists
          "🎵 Making API call to /api/comments/track/" + currentTrack.id + "..."
        );
        const response = await axios.get(
          `/api/comments/track/${currentTrack.id}`
        );

        // Filter comments by current playlist if specified
        let filteredComments = response.data;
        if (currentPlaylistId) {
          filteredComments = response.data.filter(
            (comment: any) =>
              comment.playlist && comment.playlist.id === currentPlaylistId
          );
            "🎵 Filtered to current playlist comments:",
            filteredComments.length,
            "comments"
          );
        }

          "🎵 Comments with inSongTimestamp:",
          filteredComments.filter(
            (c: any) => c.inSongTimestamp && c.inSongTimestamp > 0
          )
        );
        setCurrentTrackComments(filteredComments);
      } catch (error: any) {
        console.error("🎵 Error fetching track comments:", error);
        console.error(
          "🎵 Error details:",
          error.response?.data || error.message
        );
        setCurrentTrackComments([]);
      }
    };

    fetchCurrentTrackComments();
  }, [currentTrack, trackComments, currentPlaylistId]);

  // Listen for new comments added by the current user
  useEffect(() => {
    const handleNewComment = (event: CustomEvent) => {
      const { comment, trackId } = event.detail;

      // Only update if it's for the currently playing track
      if (currentTrack && trackId === currentTrack.id) {

        // Filter by current playlist if specified
        if (
          currentPlaylistId &&
          comment.playlist &&
          comment.playlist.id !== currentPlaylistId
        ) {
          return; // Don't add comment from different playlist
        }

        // Add the new comment to the current comments
        setCurrentTrackComments((prevComments) => {
          // Check if comment already exists (avoid duplicates)
          const exists = prevComments.some((c) => c.id === comment.id);
          if (exists) return prevComments;

          return [...prevComments, comment];
        });
      }
    };

    // Listen for the custom event
    window.addEventListener("commentAdded", handleNewComment as EventListener);

    return () => {
      window.removeEventListener(
        "commentAdded",
        handleNewComment as EventListener
      );
    };
  }, [currentTrack, currentPlaylistId]);

  // Get timestamped comments for the current track
  const getTimestampedCommentsForCurrentTrack = () => {
    if (!currentTrack) return [];
    const timestampedComments = currentTrackComments.filter(
      (comment: any) => comment.inSongTimestamp && comment.inSongTimestamp > 0
    );
      "🎵 Timestamped comments for current track:",
      timestampedComments.length
    );
    return timestampedComments;
  };

  return (
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
          {currentTrack &&
            getTimestampedCommentsForCurrentTrack().map((comment: any) => {
              const positionPercent =
                currentTrack && currentTrack.duration_ms > 0
                  ? ((comment.inSongTimestamp * 1000) /
                      currentTrack.duration_ms) *
                    100
                  : 0;

              return (
                <CommentIndicator
                  key={comment.id}
                  position={positionPercent}
                  onMouseEnter={() => setHoveredCommentId(comment.id)}
                  onMouseLeave={() => setHoveredCommentId(null)}
                >
                  <CommentTooltip isVisible={hoveredCommentId === comment.id}>
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                      {comment.user.displayName}
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.8 }}>
                      {formatTimestamp(comment.inSongTimestamp)}
                    </div>
                    <div
                      style={{
                        marginTop: "4px",
                        maxWidth: "180px",
                        whiteSpace: "normal",
                      }}
                    >
                      {comment.content}
                    </div>
                  </CommentTooltip>
                </CommentIndicator>
              );
            })}
        </ProgressBar>
        <TimeDisplay>
          {currentTrack ? formatDuration(currentTrack.duration_ms) : "0:00"}
        </TimeDisplay>
      </ProgressContainer>

      <NowPlayingInfo>
        <NowPlayingTrackName>
          {currentTrack?.name || "No track playing"}
        </NowPlayingTrackName>
        <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}>
          {currentTrack?.artists?.map((artist) => artist.name).join(", ") ||
            "Start listening in Spotify"}
        </div>
      </NowPlayingInfo>
    </NowPlayingContainer>
  );
};

export default NowPlaying;
