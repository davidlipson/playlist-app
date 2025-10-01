import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "./contexts/AuthContext";
import { SpotifyProvider } from "./contexts/SpotifyContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import PlaylistView from "./components/PlaylistView";
import SpotifyCallback from "./components/SpotifyCallback";
import LoadingSpinner from "./components/LoadingSpinner";

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <AppContainer>
        <LoadingSpinner />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route path="/callback" element={<SpotifyCallback />} />
        <Route
          path="/"
          element={
            user ? (
              <SpotifyProvider>
                <Dashboard />
              </SpotifyProvider>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/playlist/:playlistId"
          element={
            user ? (
              <SpotifyProvider>
                <PlaylistView />
              </SpotifyProvider>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/share/:shareCode"
          element={
            user ? (
              <SpotifyProvider>
                <PlaylistView />
              </SpotifyProvider>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppContainer>
  );
};

export default App;
