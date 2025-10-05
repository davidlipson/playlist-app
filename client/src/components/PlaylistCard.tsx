import React from "react";
import styled from "styled-components";
import UserList from "./UserList";

const Card = styled.div<{ isShared?: boolean; isCurrentPlaylist?: boolean }>`
  position: relative;
  backdrop-filter: blur(10px);
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: ${(props) => (props.isCurrentPlaylist ? "5px" : "0")};
  background: ${(props) =>
    props.isCurrentPlaylist ? "rgba(29, 185, 84, 0.1)" : "transparent"};
  border: ${(props) =>
    props.isCurrentPlaylist ? "2px solid #1db954" : "none"};

  &:hover {
    transform: translateY(-5px);
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 0;
  padding-bottom: 100%; /* Creates a square aspect ratio (1:1) */
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  position: relative;
`;

const PlaylistImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const PlaylistName = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  isCurrentPlaylist?: boolean;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  onClick,
  isShared,
  isCurrentPlaylist,
}) => {
  return (
    <Card
      onClick={onClick}
      isShared={isShared}
      isCurrentPlaylist={isCurrentPlaylist}
    >
      <ImageContainer>
        {playlist.imageUrl ? (
          <PlaylistImage src={playlist.imageUrl} alt={playlist.name} />
        ) : (
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            🎵
          </span>
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
