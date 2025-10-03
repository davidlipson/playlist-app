import React from "react";
import styled from "styled-components";
import UserList from "./UserList";

const Card = styled.div<{ isShared?: boolean }>`
  position: relative;
  backdrop-filter: blur(10px);
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  border: 2px solid transparent; // Remove green border for shared playlists
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover {
    transform: translateY(-5px);
  }
`;

const ImageContainer = styled.div`
  width: 100%;
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

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const PlaylistMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  opacity: 0.7;
  margin-top: auto;
  padding-top: 8px;
`;

const EngagementStats = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CommentCount = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LikeCount = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
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

      <CardContent>
        <PlaylistName>{playlist.name}</PlaylistName>

        <PlaylistMeta>
          {(() => {
            // Combine owner and collaborators
            const allUsers = [
              {
                id: playlist.owner.id,
                displayName: playlist.owner.displayName,
              },
              ...(playlist.collaborators || []),
            ];
            return (
              allUsers.length > 0 && (
                <UserList users={allUsers} variant="small" />
              )
            );
          })()}
          <EngagementStats>
            {playlist.commentCount > 0 && (
              <CommentCount>💬 {playlist.commentCount}</CommentCount>
            )}
            {playlist.likeCount > 0 && (
              <LikeCount>❤️ {playlist.likeCount}</LikeCount>
            )}
          </EngagementStats>
        </PlaylistMeta>
      </CardContent>
    </Card>
  );
};

export default PlaylistCard;
