import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import TrackList from "./TrackList";
import LoadingSpinner from "./LoadingSpinner";

const PlaylistContainer = styled.div`
  min-height: 100vh;
  padding: 40px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  backdrop-filter: blur(10px);
  border-radius: 15px;
  color: white;
  gap: 20px;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const ShareButton = styled.button`
  background: #1db954;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: #1ed760;
  }

  &:disabled {
    background: #4a4a4a;
    cursor: not-allowed;
  }
`;

const Content = styled.div`
  display: block;
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

interface Comment {
  id: string;
  trackId: string;
  trackName: string;
  artistName: string;
  timestamp: number;
  content: string;
  user: {
    id: string;
    displayName: string;
  };
  createdAt: string;
}

interface PlaylistData {
  id: string;
  spotifyId: string;
  name: string;
  description: string;
  imageUrl: string;
  owner: {
    id: string;
    displayName: string;
  };
  tracks: Track[];
  isPublic: boolean;
  shareCode: string;
  comments: Comment[];
  totalTracks: number;
}

const PlaylistView: React.FC = () => {
  console.log("PlaylistView component rendering");
  const { playlistId, shareCode } = useParams();
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  // No longer using isPlayerReady - using API-only approach
  const navigate = useNavigate();

  const fetchPlaylist = useCallback(async () => {
    console.log(
      "fetchPlaylist called with playlistId:",
      playlistId,
      "shareCode:",
      shareCode
    );
    try {
      let url = "";
      if (shareCode) {
        url = `/api/playlists/share/${shareCode}`;
      } else if (playlistId) {
        url = `/api/playlists/${playlistId}`;
      }

      if (url) {
        const response = await axios.get(url);
        const playlistData = response.data;

        // If this is a shared playlist, redirect to the full playlist page
        if (shareCode && playlistData.id) {
          navigate(`/playlist/${playlistData.id}`, { replace: true });
          return;
        }

        setPlaylist(playlistData);
      }
    } catch (error) {
      console.error("Failed to fetch playlist:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [playlistId, shareCode, navigate]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  const handleBack = () => {
    navigate("/");
  };

  const handleCopyShareCode = async () => {
    if (playlist?.spotifyId) {
      try {
        // Generate shareable link by calling the backend
        const response = await axios.get(
          `/api/playlists/${playlist.spotifyId}/share-link`
        );
        const shareLink = response.data.shareLink;

        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error("Failed to generate share link:", err);
        // Fallback to copying share code if link generation fails
        if (playlist?.shareCode) {
          try {
            const fallbackLink = `${window.location.origin}/share/${playlist.shareCode}`;
            await navigator.clipboard.writeText(fallbackLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (fallbackErr) {
            console.error("Failed to copy fallback share link:", fallbackErr);
          }
        }
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!playlist) {
    return (
      <PlaylistContainer>
        <Header>
          <BackButton onClick={handleBack}>← Back</BackButton>
          <h1>Playlist not found</h1>
        </Header>
      </PlaylistContainer>
    );
  }

  return (
    <PlaylistContainer>
      <Header>
        <BackButton onClick={handleBack}>← Back</BackButton>
        <h1>{playlist.name}</h1>
        {playlist.shareCode && (
          <ShareButton onClick={handleCopyShareCode} disabled={copied}>
            {copied ? "Copied!" : "Share"}
          </ShareButton>
        )}
      </Header>

      <Content>
        <TrackList tracks={playlist.tracks} playlistId={playlist.id} />
      </Content>
    </PlaylistContainer>
  );
};

export default PlaylistView;
