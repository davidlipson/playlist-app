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
  background: rgba(255, 255, 255, 0.2);
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
    background: rgba(255, 255, 255, 0.3);
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

const NotificationDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  min-width: 300px;
  max-width: 400px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 8px;
`;

const NotificationHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #eee;
  font-weight: 600;
  color: #333;
`;

const NotificationItem = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationText = styled.div`
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
`;

const NotificationMeta = styled.div`
  font-size: 12px;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NotificationType = styled.span<{ type: string }>`
  background: ${(props) => (props.type === "comment" ? "#1db954" : "#ff6b6b")};
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
`;

const EmptyNotifications = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
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
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
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
      setRecentActivity(response.data.recentActivity || []);
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

  const handleNotificationClick = useCallback(() => {
    setShowNotifications(!showNotifications);
    if (notificationCount > 0) {
      markNotificationsAsRead();
    }
  }, [showNotifications, notificationCount, markNotificationsAsRead]);

  useEffect(() => {
    fetchMyPlaylists();
    fetchSharedPlaylists();
    fetchNotifications();
  }, [fetchMyPlaylists, fetchSharedPlaylists, fetchNotifications]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications) {
        const target = event.target as HTMLElement;
        if (!target.closest("[data-notification-dropdown]")) {
          setShowNotifications(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

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
          <div style={{ position: "relative" }}>
            <NotificationButton
              hasNotifications={notificationCount > 0}
              onClick={handleNotificationClick}
            >
              🔔 Notifications
              {notificationCount > 0 && (
                <NotificationBadge>{notificationCount}</NotificationBadge>
              )}
            </NotificationButton>
            {showNotifications && (
              <NotificationDropdown data-notification-dropdown>
                <NotificationHeader>Recent Activity</NotificationHeader>
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <NotificationItem key={index}>
                      <NotificationText>
                        <strong>{activity.user}</strong>{" "}
                        {activity.type === "comment" ? "commented on" : "liked"}{" "}
                        "{activity.track}" in{" "}
                        <strong>{activity.playlist}</strong>
                        {activity.type === "comment" && activity.content && (
                          <div
                            style={{ fontStyle: "italic", marginTop: "4px" }}
                          >
                            "{activity.content}"
                          </div>
                        )}
                      </NotificationText>
                      <NotificationMeta>
                        <NotificationType type={activity.type}>
                          {activity.type}
                        </NotificationType>
                        <span>
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </span>
                      </NotificationMeta>
                    </NotificationItem>
                  ))
                ) : (
                  <EmptyNotifications>No recent activity</EmptyNotifications>
                )}
              </NotificationDropdown>
            )}
          </div>
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
