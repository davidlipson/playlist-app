import React, { useState } from "react";
import styled from "styled-components";
import axios from "axios";

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
`;

const Logo = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 10px;
  font-size: 28px;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
`;

const LoginButton = styled.button`
  background: #1db954;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 15px 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;

  &:hover {
    background: #1ed760;
    transform: translateY(-2px);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleSpotifyLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/auth/spotify-login");
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error("Failed to get auth URL:", error);
      alert("Failed to start login process. Please try again.");
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>🎵</Logo>
        <Title>Playlist App</Title>
        <Subtitle>
          Share your Spotify playlists and discover new music with friends
        </Subtitle>
        <LoginButton onClick={handleSpotifyLogin} disabled={loading}>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <span>🎵</span>
              Connect with Spotify
            </>
          )}
        </LoginButton>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
