import React from "react";
import styled from "styled-components";

const UserListContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const UserAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1db954;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #1ed760;
    transform: scale(1.1);
  }
`;

interface User {
  id: string;
  displayName: string;
}

interface UserListProps {
  users: User[];
  maxDisplay?: number;
}

const UserList: React.FC<UserListProps> = ({ users, maxDisplay = 5 }) => {
  if (!users || users.length === 0) {
    return null;
  }

  const displayUsers = users.slice(0, maxDisplay);
  const remainingCount = users.length - maxDisplay;

  return (
    <UserListContainer>
      {displayUsers.map((user) => (
        <UserAvatar key={user.id} title={user.displayName}>
          {user.displayName.charAt(0).toUpperCase()}
        </UserAvatar>
      ))}
      {remainingCount > 0 && (
        <UserAvatar title={`+${remainingCount} more`}>
          +{remainingCount}
        </UserAvatar>
      )}
    </UserListContainer>
  );
};

export default UserList;
