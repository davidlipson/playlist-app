import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import PlaylistCard from "./PlaylistCard";
import LoadingSpinner from "./LoadingSpinner";
import SearchInput from "./SearchInput";

const DashboardContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  color: white;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserName = styled.span`
  font-size: 16px;
  font-weight: 500;
`;

const LogoutButton = styled.button`
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

const JoinPlaylistButton = styled.button`
  background: #1db954;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 10px;

  &:hover {
    background: #1ed760;
  }
`;

const JoinModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const JoinModalContent = styled.div`
  background: #1a1a1a;
  border-radius: 15px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  color: white;
`;

const JoinModalTitle = styled.h3`
  margin-bottom: 20px;
  font-size: 20px;
`;

const ShareCodeInput = styled.input`
  width: 100%;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 16px;
  margin-bottom: 20px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #1db954;
  }
`;

const JoinButton = styled.button`
  background: #1db954;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 600;
  margin-right: 10px;
  transition: all 0.3s ease;

  &:hover {
    background: #1ed760;
  }
`;

const CancelButton = styled.button`
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const PlaylistsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: white;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);
`;

const EmptyTitle = styled.h3`
  font-size: 24px;
  margin-bottom: 10px;
`;

const EmptyText = styled.p`
  font-size: 16px;
  opacity: 0.8;
`;

const ShowMoreButton = styled.button`
  display: block;
  margin: 30px auto 0;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

interface Playlist {
  id: string;
  spotifyId: string;
  name: string;
  description: string;
  imageUrl: string;
  owner: {
    id: string;
    displayName: string;
  };
  isPublic: boolean;
  shareCode: string;
  commentCount: number;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([]);
  const [sharedPlaylists, setSharedPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyPlaylists();
    fetchSharedPlaylists();
  }, []);

  const fetchMyPlaylists = async () => {
    try {
      const response = await axios.get("/api/playlists/my-playlists");
      setMyPlaylists(response.data.playlists);
    } catch (error: any) {
      console.error("Failed to fetch my playlists:", error);

      // Handle token expiration
      if (
        error.response?.status === 401 &&
        error.response?.data?.code === "TOKEN_EXPIRED"
      ) {
        // Redirect to login or show re-authentication message
        alert("Your Spotify connection has expired. Please log in again.");
        logout();
        navigate("/");
      }
    }
  };

  const fetchSharedPlaylists = async () => {
    try {
      const response = await axios.get("/api/playlists/shared-playlists");
      setSharedPlaylists(response.data.playlists);
    } catch (error) {
      console.error("Failed to fetch shared playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistClick = (playlist: Playlist) => {
    if (playlist.id) {
      navigate(`/playlist/${playlist.id}`);
    } else {
      navigate(`/playlist/${playlist.spotifyId}`);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleJoinPlaylist = () => {
    setShowJoinModal(true);
  };

  const handleJoinSubmit = async () => {
    if (!shareCode.trim()) {
      setJoinError("Please enter a share code");
      return;
    }

    setJoinLoading(true);
    setJoinError(""); // Clear any previous errors
    try {
      const response = await axios.get(
        `/api/playlists/share/${shareCode.trim()}`
      );
      const playlistData = response.data;

      // Refresh playlists to show the newly joined playlist
      await fetchSharedPlaylists();
      setShowJoinModal(false);
      setShareCode("");
      setJoinError("");

      // Redirect to the newly joined playlist
      if (playlistData.id) {
        navigate(`/playlist/${playlistData.id}`);
      }
    } catch (error: any) {
      console.error("Failed to join playlist:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to join playlist";

      // Handle specific error cases
      if (errorMessage.includes("Cannot join your own playlist")) {
        setJoinError("You cannot join your own playlist.");
      } else if (
        errorMessage.includes("You have already joined this playlist")
      ) {
        setJoinError("You have already joined this playlist.");
      } else if (errorMessage.includes("Playlist not found")) {
        setJoinError(
          "Invalid share code. Please check the code and try again."
        );
      } else {
        setJoinError(errorMessage);
      }
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
    setShareCode("");
    setJoinError("");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Combine and filter all playlists
  const allPlaylists = useMemo(() => {
    const combined = [
      ...myPlaylists.map((playlist) => ({ ...playlist, isShared: false })),
      ...sharedPlaylists.map((playlist) => ({ ...playlist, isShared: true })),
    ];

    if (!searchQuery.trim()) {
      return combined;
    }

    const query = searchQuery.toLowerCase();
    return combined.filter(
      (playlist) =>
        playlist.name.toLowerCase().includes(query) ||
        playlist.description?.toLowerCase().includes(query) ||
        playlist.owner.displayName.toLowerCase().includes(query)
    );
  }, [myPlaylists, sharedPlaylists, searchQuery]);

  // Sort playlists by most commented, then most recent
  const sortedPlaylists = useMemo(() => {
    return [...allPlaylists].sort((a, b) => {
      // First sort by comment count (descending)
      if (b.commentCount !== a.commentCount) {
        return b.commentCount - a.commentCount;
      }
      // Then sort by creation date (descending)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [allPlaylists]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <DashboardContainer>
      <Header>
        <JoinPlaylistButton onClick={handleJoinPlaylist}>
          Join Playlist
        </JoinPlaylistButton>
        <UserInfo>
          <UserName>Welcome, {user?.displayName}</UserName>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </UserInfo>
      </Header>

      <SearchInput
        placeholder="Search all playlists..."
        onSearch={handleSearch}
      />

      {sortedPlaylists.length === 0 ? (
        <EmptyState>
          <EmptyTitle>
            {searchQuery.trim()
              ? `No playlists found for "${searchQuery}"`
              : "No playlists yet"}
          </EmptyTitle>
          <EmptyText>
            {searchQuery.trim()
              ? "Try adjusting your search terms or clear the search to see all playlists."
              : "Your Spotify playlists and shared playlists will appear here."}
          </EmptyText>
        </EmptyState>
      ) : (
        <PlaylistsGrid>
          {sortedPlaylists.map((playlist) => (
            <PlaylistCard
              key={playlist.id || playlist.spotifyId}
              playlist={playlist}
              onClick={() => handlePlaylistClick(playlist)}
              isShared={playlist.isShared}
            />
          ))}
        </PlaylistsGrid>
      )}

      {showJoinModal && (
        <JoinModal onClick={handleCloseJoinModal}>
          <JoinModalContent onClick={(e) => e.stopPropagation()}>
            <JoinModalTitle>Join Shared Playlist</JoinModalTitle>
            <p style={{ marginBottom: "15px", opacity: 0.8 }}>
              Enter the share code to join a shared playlist:
            </p>
            <ShareCodeInput
              type="text"
              placeholder="Enter share code..."
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleJoinSubmit()}
            />
            {joinError && (
              <div
                style={{
                  color: "#ff6b6b",
                  marginBottom: "20px",
                  fontSize: "14px",
                  textAlign: "left",
                }}
              >
                {joinError}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <JoinButton onClick={handleJoinSubmit} disabled={joinLoading}>
                {joinLoading ? "Joining..." : "Join Playlist"}
              </JoinButton>
              <CancelButton onClick={handleCloseJoinModal}>Cancel</CancelButton>
            </div>
          </JoinModalContent>
        </JoinModal>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;
