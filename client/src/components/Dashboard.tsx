import React, { useState, useEffect, useMemo, useCallback } from "react";
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

const UserName = styled.span`
  font-size: 16px;
  font-weight: 500;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const NotificationButton = styled.button<{ hasNotifications: boolean }>`
  background: ${props => props.hasNotifications ? '#1db954' : 'rgba(255, 255, 255, 0.2)'};
  color: white;
  border: none;
  border-radius: 25px;
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${props => props.hasNotifications ? '#1ed760' : 'rgba(255, 255, 255, 0.3)'};
  }
`;

const NotificationBadge = styled.span`
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  position: absolute;
  top: -5px;
  right: -5px;
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
  likeCount: number;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const [myPlaylists, setMyPlaylists] = useState<Playlist[]>([]);
  const [sharedPlaylists, setSharedPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchMyPlaylists = useCallback(async () => {
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
  }, [logout, navigate]);

  const fetchSharedPlaylists = useCallback(async () => {
    try {
      const response = await axios.get("/api/playlists/shared-playlists");
      setSharedPlaylists(response.data.playlists);
    } catch (error) {
      console.error("Failed to fetch shared playlists:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get("/api/auth/notifications");
      setNotificationCount(response.data.count);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  const markNotificationsAsRead = useCallback(async () => {
    try {
      await axios.post("/api/auth/notifications/read");
      setNotificationCount(0);
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  }, []);

  useEffect(() => {
    fetchMyPlaylists();
    fetchSharedPlaylists();
    fetchNotifications();
  }, [fetchMyPlaylists, fetchSharedPlaylists, fetchNotifications]);

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

  // Sort playlists by sum of comments and likes (descending), then by date
  const sortedPlaylists = useMemo(() => {
    return [...allPlaylists].sort((a, b) => {
      // Calculate total engagement (comments + likes)
      const aEngagement = (a.commentCount || 0) + (a.likeCount || 0);
      const bEngagement = (b.commentCount || 0) + (b.likeCount || 0);
      
      // First sort by total engagement (descending)
      if (bEngagement !== aEngagement) {
        return bEngagement - aEngagement;
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
        <UserName>Welcome, {user?.displayName}</UserName>
        <HeaderActions>
          <NotificationButton 
            hasNotifications={notificationCount > 0}
            onClick={markNotificationsAsRead}
          >
            🔔 Notifications
            {notificationCount > 0 && (
              <NotificationBadge>{notificationCount}</NotificationBadge>
            )}
          </NotificationButton>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </HeaderActions>
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
    </DashboardContainer>
  );
};

export default Dashboard;
