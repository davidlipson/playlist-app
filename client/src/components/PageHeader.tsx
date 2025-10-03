import React from "react";
import styled from "styled-components";

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  color: white;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UserName = styled.span`
  font-size: 16px;
  font-weight: 500;
`;

interface PageHeaderProps {
  children: React.ReactNode;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  children, 
  leftContent, 
  rightContent 
}) => {
  return (
    <Header>
      {leftContent}
      {children}
      <HeaderActions>
        {rightContent}
      </HeaderActions>
    </Header>
  );
};

export default PageHeader;
export { Header, HeaderActions, UserName };
