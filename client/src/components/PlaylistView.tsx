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
  z-index: 1000;
  margin-top: 8px;
`;

const NotificationItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  &:first-child {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }

  &:last-child {
    border-bottom: none;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }
`;

const NotificationText = styled.div`
  font-size: 14px;
  color: #333;
  line-height: 1.4;
`;

const EmptyNotifications = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Content = styled.div`
  display: block;
`;

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }
};

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
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
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

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get("/api/auth/notifications");
      setNotificationCount(response.data.count);
      setRecentActivity(response.data.recentActivity || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchPlaylist();
    fetchNotifications();
  }, [fetchPlaylist, fetchNotifications]);

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

  const handleNotificationItemClick = useCallback(
    (activity: any) => {
      // Close the notification dropdown
      setShowNotifications(false);

      // Navigate to the playlist
      if (activity.playlistId) {
        navigate(`/playlist/${activity.playlistId}`);
      } else {
        // Fallback: try to find the playlist by name in the current playlists
        const currentPlaylist = playlist;
        if (currentPlaylist && currentPlaylist.name === activity.playlist) {
          navigate(`/playlist/${currentPlaylist.id || currentPlaylist.spotifyId}`);
        }
      }
    },
    [navigate, playlist]
  );

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
        <HeaderActions>
          <div style={{ position: "relative" }}>
            <NotificationButton
              hasNotifications={notificationCount > 0}
              onClick={handleNotificationClick}
            >
              🔔
              {notificationCount > 0 && (
                <NotificationBadge>{notificationCount}</NotificationBadge>
              )}
            </NotificationButton>
            {showNotifications && (
              <NotificationDropdown data-notification-dropdown>
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 5).map((activity, index) => {
                    const timeAgo = getTimeAgo(new Date(activity.createdAt));
                    return (
                      <NotificationItem
                        key={index}
                        onClick={() => handleNotificationItemClick(activity)}
                      >
                        <NotificationText>
                          <strong>{activity.user}</strong>{" "}
                          {activity.type === "comment" ? "commented" : "liked"}{" "}
                          {activity.type === "comment" && activity.content && (
                            <>"{activity.content}" on </>
                          )}
                          "{activity.track}" in{" "}
                          <strong>"{activity.playlist}"</strong>
                          <br />
                          <span style={{ color: "#666", fontSize: "12px" }}>
                            {timeAgo}
                          </span>
                        </NotificationText>
                      </NotificationItem>
                    );
                  })
                ) : (
                  <EmptyNotifications>No recent activity</EmptyNotifications>
                )}
              </NotificationDropdown>
            )}
          </div>
          {playlist.shareCode && (
            <ShareButton onClick={handleCopyShareCode} disabled={copied}>
              {copied ? "Copied!" : "Share"}
            </ShareButton>
          )}
        </HeaderActions>
      </Header>

      <Content>
        <TrackList tracks={playlist.tracks} playlistId={playlist.id} />
      </Content>
    </PlaylistContainer>
  );
};

export default PlaylistView;
