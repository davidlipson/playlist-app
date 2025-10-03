import React from "react";
import styled from "styled-components";

const UserListContainer = styled.div<{ variant: 'small' | 'large' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: ${props => props.variant === 'large' ? '12px 0' : '8px 0'};
  flex-wrap: wrap;
  
  /* Overlapping avatars */
  & > * {
    margin-left: ${props => props.variant === 'large' ? '-8px' : '-6px'};
  }
  
  & > *:first-child {
    margin-left: 0;
  }
`;

const UserAvatar = styled.div<{ variant: 'small' | 'large' }>`
  width: ${props => props.variant === 'large' ? '24px' : '18px'};
  height: ${props => props.variant === 'large' ? '24px' : '18px'};
  border-radius: 50%;
  background: #1db954;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.variant === 'large' ? '12px' : '10px'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 8px rgba(29, 185, 84, 0.3);
  position: relative;
  z-index: 1;

  &:hover {
    background: #1ed760;
    transform: scale(1.1);
    box-shadow: 0 0 12px rgba(29, 185, 84, 0.5);
    z-index: 2;
  }
`;

interface User {
  id: string;
  displayName: string;
}

interface UserListProps {
  users: User[];
  variant?: 'small' | 'large';
  maxDisplay?: number;
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  variant = 'large',
  maxDisplay 
}) => {
  if (!users || users.length === 0) {
    return null;
  }

  // Set default maxDisplay based on variant
  const defaultMaxDisplay = variant === 'large' ? 5 : 3;
  const finalMaxDisplay = maxDisplay || defaultMaxDisplay;
  
  const displayUsers = users.slice(0, finalMaxDisplay);
  const remainingCount = users.length - finalMaxDisplay;

  return (
    <UserListContainer variant={variant}>
      {displayUsers.map((user) => (
        <UserAvatar 
          key={user.id} 
          variant={variant}
          title={user.displayName}
        >
          {user.displayName.charAt(0).toUpperCase()}
        </UserAvatar>
      ))}
      {remainingCount > 0 && (
        <UserAvatar 
          variant={variant}
          title={`+${remainingCount} more`}
        >
          +{remainingCount}
        </UserAvatar>
      )}
    </UserListContainer>
  );
};

export default UserList;
