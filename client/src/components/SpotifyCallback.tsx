import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const CallbackContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
`;

const CallbackCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1db954;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
`;

const Message = styled.p`
  color: #666;
  margin-bottom: 20px;
  font-size: 16px;
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  margin-bottom: 20px;
  font-size: 16px;
`;

const RetryButton = styled.button`
  background: #1db954;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #1ed760;
    transform: translateY(-2px);
  }
`;

const SpotifyCallback: React.FC = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple simultaneous calls
      if (isProcessing) return;
      setIsProcessing(true);

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        if (error) {
          setStatus("error");
          setErrorMessage(`Spotify authentication failed: ${error}`);
          setIsProcessing(false);
          return;
        }

        if (!code) {
          setStatus("error");
          setErrorMessage("No authorization code received from Spotify");
          setIsProcessing(false);
          return;
        }

        // Exchange code for tokens
        const response = await axios.post("/api/auth/spotify-callback", {
          code,
        });

        const { token, user } = response.data;
        login(token, user);

        setStatus("success");

        // Redirect to dashboard after successful login
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      } catch (error: any) {
        console.error("Login failed:", error);
        setStatus("error");
        setErrorMessage(
          error.response?.data?.error || "Login failed. Please try again."
        );
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [login, navigate, isProcessing]);

  const handleRetry = () => {
    navigate("/login", { replace: true });
  };

  return (
    <CallbackContainer>
      <CallbackCard>
        {status === "loading" && (
          <>
            <LoadingSpinner />
            <Title>Connecting to Spotify...</Title>
            <Message>Please wait while we authenticate your account.</Message>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>✅</div>
            <Title>Success!</Title>
            <Message>
              You've been successfully logged in. Redirecting...
            </Message>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>
            <Title>Authentication Failed</Title>
            <ErrorMessage>{errorMessage}</ErrorMessage>
            <RetryButton onClick={handleRetry}>Try Again</RetryButton>
          </>
        )}
      </CallbackCard>
    </CallbackContainer>
  );
};

export default SpotifyCallback;
