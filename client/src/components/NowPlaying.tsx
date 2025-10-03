import React, { useState } from "react";
import styled from "styled-components";
import { useSpotify } from "../contexts/SpotifyContext";
import { useAuth } from "../contexts/AuthContext";
import { formatDuration, formatTimestamp } from "../utils/timeUtils";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

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
  color: rgba(44, 44, 44, 0.8);
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

const NavigationButton = styled.button`
  background: #1db954;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 5px;

  &:hover {
    background: #1ed760;
    transform: translateY(-1px);
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 5px;
`;

const PlayPauseButton = styled.button`
  background: #1db954;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;

  &:hover {
    background: #1ed760;
    transform: scale(1.05);
  }
`;

interface NowPlayingProps {
  trackComments?: { [trackId: string]: any[] };
}

const NowPlaying: React.FC<NowPlayingProps> = ({ trackComments = {} }) => {
  const { currentTrack, isPlaying, position, pauseTrack, resumeTrack } =
    useSpotify();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(
    null
  );

  // Get timestamped comments for the current track
  const getTimestampedCommentsForCurrentTrack = () => {
    if (!currentTrack) return [];
    const comments = trackComments[currentTrack.id] || [];
    return comments.filter(
      (comment: any) => comment.inSongTimestamp && comment.inSongTimestamp > 0
    );
  };

  // Find the current playlist ID when track changes
  React.useEffect(() => {
    const findCurrentPlaylist = async () => {
      if (!currentTrack) {
        console.log("🔍 No current track, clearing playlist ID");
        setCurrentPlaylistId(null);
        return;
      }

      console.log("🔍 Finding playlist for track:", currentTrack.name);

      try {
        // Get all playlists to find which one contains the current track
        const response = await axios.get("/api/playlists");
        const playlists = response.data.playlists;
        console.log("🔍 Found", playlists.length, "playlists to check");

        for (const playlist of playlists) {
          if (playlist.spotifyPlaylistId) {
            try {
              const playlistResponse = await axios.get(
                `/api/playlists/${playlist.id}`
              );
              const tracks = playlistResponse.data.tracks;

              if (tracks.some((track: any) => track.id === currentTrack.id)) {
                console.log("🎵 Found playlist containing current track:", playlist.name, "ID:", playlist.id);
                setCurrentPlaylistId(playlist.id);
                return;
              }
            } catch (error) {
              console.error("Error checking playlist:", error);
            }
          }
        }

        console.log("❌ No playlist found containing current track");
        setCurrentPlaylistId(null);
      } catch (error) {
        console.error("Error finding current playlist:", error);
        setCurrentPlaylistId(null);
      }
    };

    findCurrentPlaylist();
  }, [currentTrack]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pauseTrack();
    } else {
      await resumeTrack();
    }
  };

  const handleGoToPlaylist = () => {
    if (currentPlaylistId) {
      navigate(`/playlist/${currentPlaylistId}`);
    }
  };

  const isOnPlaylistPage = location.pathname.includes("/playlist/");

  console.log("🎵 NowPlaying Debug:");
  console.log("  - Current track:", currentTrack?.name);
  console.log("  - Current playlist ID:", currentPlaylistId);
  console.log("  - Is on playlist page:", isOnPlaylistPage);
  console.log("  - Should show navigation button:", currentPlaylistId && !isOnPlaylistPage);

  if (!currentTrack) {
    return null;
  }

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
          {getTimestampedCommentsForCurrentTrack().map((comment: any) => {
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
        <div style={{ fontSize: "12px", color: "rgba(44, 44, 44, 0.7)" }}>
          {currentTrack?.artists?.map((artist) => artist.name).join(", ")}
        </div>
      </NowPlayingInfo>

      <ControlsContainer>
        <PlayPauseButton onClick={handlePlayPause}>
          {isPlaying ? "⏸️" : "▶️"}
        </PlayPauseButton>

        {currentPlaylistId && !isOnPlaylistPage && (
          <NavigationButton onClick={handleGoToPlaylist}>
            🎵 Go to Playlist
          </NavigationButton>
        )}
      </ControlsContainer>
    </NowPlayingContainer>
  );
};

export default NowPlaying;
