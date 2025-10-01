import React from "react";
import styled from "styled-components";

const Card = styled.div<{ isShared?: boolean }>`
  position: relative;
  background: ${
    (props) =>
      props.isShared
        ? "rgb(44 249 43 / 36%)" // New green background for shared playlists
        : "rgba(255, 255, 255, 0.1)" // Default for my playlists
  };
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  border: 2px solid transparent; // Remove green border for shared playlists

  &:hover {
    background: ${(props) =>
      props.isShared ? "rgb(44 249 43 / 50%)" : "rgba(255, 255, 255, 0.2)"};
    transform: translateY(-5px);
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 200px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
`;

const PlaylistImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PlaylistName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.3;
`;

const PlaylistDescription = styled.p`
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PlaylistMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  opacity: 0.7;
`;

const Owner = styled.span`
  font-weight: 500;
`;

const CommentCount = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ShareCode = styled.div`
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 12px;
  font-family: monospace;
  word-break: break-all;
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

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: () => void;
  isShared?: boolean;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  onClick,
  isShared,
}) => {
  return (
    <Card onClick={onClick} isShared={isShared}>
      <ImageContainer>
        {playlist.imageUrl ? (
          <PlaylistImage src={playlist.imageUrl} alt={playlist.name} />
        ) : (
          <span>🎵</span>
        )}
      </ImageContainer>

      <PlaylistName>{playlist.name}</PlaylistName>

      <PlaylistMeta>
        <Owner>by {playlist.owner.displayName}</Owner>
        <CommentCount>💬 {playlist.commentCount}</CommentCount>
      </PlaylistMeta>
    </Card>
  );
};

export default PlaylistCard;
