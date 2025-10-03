import React from "react";
import styled from "styled-components";

const LogoutButtonStyled = styled.button`
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

interface LogoutButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onClick, children = "Logout" }) => {
  return (
    <LogoutButtonStyled onClick={onClick}>
      {children}
    </LogoutButtonStyled>
  );
};

export default LogoutButton;
