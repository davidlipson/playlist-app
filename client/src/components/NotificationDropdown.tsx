import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";

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

const NotificationDropdownContainer = styled.div<{
  top: number;
  right: number;
}>`
  position: fixed;
  top: ${(props) => props.top}px;
  right: ${(props) => props.right}px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  min-width: 300px;
  max-width: 400px;
  z-index: 9999;
`;

const NotificationScrollContainer = styled.div`
  max-height: 400px; /* Approximately 5 notifications * 80px each */
  overflow-y: auto;
  border-radius: 12px;
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

interface NotificationDropdownProps {
  availablePlaylists?: Array<{ id: string; spotifyId: string; name: string }>;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  availablePlaylists = [],
}) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

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
    if (!showNotifications && buttonRef.current) {
      // Calculate position for the dropdown
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const top = buttonRect.bottom + window.scrollY + 8; // 8px margin
      const right = window.innerWidth - buttonRect.right;
      setDropdownPosition({ top, right });
    }

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
        // Fallback: try to find the playlist by name in available playlists
        const playlist = availablePlaylists.find(
          (p) => p.name === activity.playlist
        );
        if (playlist) {
          navigate(`/playlist/${playlist.id || playlist.spotifyId}`);
        }
      }
    },
    [navigate, availablePlaylists]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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

  return (
    <>
      <NotificationButton
        ref={buttonRef}
        hasNotifications={notificationCount > 0}
        onClick={handleNotificationClick}
      >
        🔔
        {notificationCount > 0 && (
          <NotificationBadge>{notificationCount}</NotificationBadge>
        )}
      </NotificationButton>
      {showNotifications && (
        <NotificationDropdownContainer
          top={dropdownPosition.top}
          right={dropdownPosition.right}
          data-notification-dropdown
        >
          <NotificationScrollContainer>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => {
                const timeAgo = getTimeAgo(new Date(activity.createdAt));
                return (
                  <NotificationItem
                    key={index}
                    onClick={() => handleNotificationItemClick(activity)}
                  >
                    <NotificationText>
                      <strong>{activity.user}</strong>{" "}
                      {activity.type === "comment"
                        ? "commented on"
                        : activity.type === "like"
                        ? "liked"
                        : "joined"}{" "}
                      {activity.type === "like" && `"${activity.track}" in `}
                      <strong>{activity.playlist}</strong>
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
          </NotificationScrollContainer>
        </NotificationDropdownContainer>
      )}
    </>
  );
};

export default NotificationDropdown;
