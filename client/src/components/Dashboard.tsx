import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import PlaylistCard from "./PlaylistCard";
import LoadingSpinner from "./LoadingSpinner";
import SearchInput from "./SearchInput";
import NotificationDropdown from "./NotificationDropdown";
import LogoutButton from "./LogoutButton";
import PageHeader, { UserName } from "./PageHeader";

const DashboardContainer = styled.div`
  min-height: 100vh;
  padding: 40px;
`;

const PlaylistsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 25px;
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

const FilterContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const FilterPill = styled.button<{
  isActive: boolean;
  variant: "shared" | "personal";
}>`
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  ${(props) => {
    if (props.isActive) {
      if (props.variant === "shared") {
        return `
          background: rgb(44 249 43 / 36%);
          color: white;
        `;
      } else {
        return `
          background: rgba(255, 255, 255, 0.1);
          color: white;
        `;
      }
    } else {
      return `
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.5);
      `;
    }
  }}

  &:hover {
    ${(props) => {
      if (props.isActive) {
        if (props.variant === "shared") {
          return `
            background: rgb(44 249 43 / 50%);
          `;
        } else {
          return `
            background: rgba(255, 255, 255, 0.2);
          `;
        }
      } else {
        return `
          background: rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
        `;
      }
    }}
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
  collaborators?: {
    id: string;
    displayName: string;
  }[];
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
  const [showShared, setShowShared] = useState(true);
  const [showPersonal, setShowPersonal] = useState(true);
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

  useEffect(() => {
    fetchMyPlaylists();
    fetchSharedPlaylists();
  }, [fetchMyPlaylists, fetchSharedPlaylists]);

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

  const handleSharedToggle = () => {
    setShowShared(!showShared);
  };

  const handlePersonalToggle = () => {
    setShowPersonal(!showPersonal);
  };

  // Combine and filter all playlists
  const allPlaylists = useMemo(() => {
    let combined: (Playlist & { isShared: boolean })[] = [];

    // Add playlists based on filter settings
    if (showPersonal) {
      // Personal playlists: my playlists that have NOT been shared with others
      const personalPlaylists = myPlaylists.filter(
        (playlist) =>
          !playlist.collaborators || playlist.collaborators.length === 0
      );
      combined = [
        ...combined,
        ...personalPlaylists.map((playlist) => ({
          ...playlist,
          isShared: false,
        })),
      ];
    }
    if (showShared) {
      // Shared playlists: playlists shared with me + my playlists that I've shared with others
      const mySharedPlaylists = myPlaylists.filter(
        (playlist) =>
          playlist.collaborators && playlist.collaborators.length > 0
      );
      combined = [
        ...combined,
        ...sharedPlaylists.map((playlist) => ({ ...playlist, isShared: true })),
        ...mySharedPlaylists.map((playlist) => ({
          ...playlist,
          isShared: true,
        })),
      ];
    }

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
  }, [myPlaylists, sharedPlaylists, searchQuery, showShared, showPersonal]);

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
      <PageHeader
        rightContent={
          <>
            <NotificationDropdown
              availablePlaylists={[...myPlaylists, ...sharedPlaylists]}
            />
            <LogoutButton onClick={handleLogout} />
          </>
        }
      >
        <div />
      </PageHeader>

      <SearchInput
        placeholder="Search all playlists..."
        onSearch={handleSearch}
      />

      <FilterContainer>
        <FilterPill
          isActive={showPersonal}
          variant="personal"
          onClick={handlePersonalToggle}
        >
          Personal
        </FilterPill>
        <FilterPill
          isActive={showShared}
          variant="shared"
          onClick={handleSharedToggle}
        >
          Shared
        </FilterPill>
      </FilterContainer>

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
