import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import SpotifyWebApi from "spotify-web-api-js";
import axios from "axios";
import { useAuth } from "./AuthContext";

interface PredictedPlaylist {
  id: string;
  name: string;
  owner: {
    id: string;
    displayName: string;
  };
  tracks: any[];
}

interface SpotifyContextType {
  spotifyApi: SpotifyWebApi.SpotifyWebApiJs;
  currentTrack: SpotifyApi.TrackObjectFull | null;
  isPlaying: boolean;
  position: number;
  predictedPlaylist: PredictedPlaylist | null;
  isPredictingPlaylist: boolean;
  playTrack: (
    trackUri: string,
    playlistTracks?: string[],
    startIndex?: number,
    positionMs?: number
  ) => Promise<void>;
  pauseTrack: () => Promise<void>;
  resumeTrack: () => Promise<void>;
  seekToPosition: (positionMs: number) => Promise<void>;
  getCurrentState: () => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const useSpotify = () => {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error("useSpotify must be used within a SpotifyProvider");
  }
  return context;
};

interface SpotifyProviderProps {
  children: ReactNode;
}

export const SpotifyProvider: React.FC<SpotifyProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const [spotifyApi] = useState(() => new SpotifyWebApi());
  const [currentTrack, setCurrentTrack] =
    useState<SpotifyApi.TrackObjectFull | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [predictedPlaylist, setPredictedPlaylist] =
    useState<PredictedPlaylist | null>(null);
  const [isPredictingPlaylist, setIsPredictingPlaylist] = useState(false);
  const [lastPredictedTrackId, setLastPredictedTrackId] = useState<
    string | null
  >(null);

  // Set access token when component mounts
  useEffect(() => {
    const fetchSpotifyToken = async () => {
      try {
        const response = await axios.get("/api/auth/spotify-token");
        const { accessToken } = response.data;

        if (accessToken) {
          spotifyApi.setAccessToken(accessToken);

          // Test the token immediately to see if it's valid
          spotifyApi
            .getMe()
            .then(() => {})
            .catch((error) => {
              console.error("Spotify token validation failed:", error);
              if (error.error?.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/";
              }
            });
        } else {
        }
      } catch (error) {
        console.error("Failed to fetch Spotify token:", error);
        // If we can't get the Spotify token, the user might need to re-authenticate
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as any;
          if (axiosError.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/";
          }
        }
      }
    };

    fetchSpotifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // spotifyApi is already memoized with useState

  // Global polling for current Spotify playback state
  useEffect(() => {
    const interval = setInterval(() => {
      getCurrentState();
    }, 2000); // 2 seconds for position updates

    // Also check immediately when component mounts
    getCurrentState();

    return () => {
      clearInterval(interval);
    };
  }, []); // getCurrentState is stable and doesn't need to be in dependencies

  // No Web Playback SDK - using API-only approach

  const playTrack = async (
    trackUri: string,
    playlistTracks?: string[],
    startIndex?: number,
    positionMs?: number
  ) => {
    try {
      if (playlistTracks && playlistTracks.length > 0) {
        // Play the entire playlist starting from the selected track
        const startIndexToUse =
          startIndex !== undefined
            ? startIndex
            : playlistTracks.indexOf(trackUri);
        const tracksToPlay = playlistTracks.slice(startIndexToUse);
        // Clear existing queue and play new tracks (spotifyApi.play with uris replaces the queue)
        await spotifyApi.play({
          uris: tracksToPlay,
          position_ms: positionMs || 0,
        });
      } else {
        // Fallback to single track play (also clears existing queue)
        await spotifyApi.play({
          uris: [trackUri],
          position_ms: positionMs || 0,
        });
      }
    } catch (error) {
      console.error("Error playing track:", error);
      throw error; // Re-throw so the UI can handle it
    }
  };

  const pauseTrack = async () => {
    try {
      await spotifyApi.pause();
    } catch (error) {
      console.error("Error pausing track:", error);
    }
  };

  const resumeTrack = async () => {
    try {
      await spotifyApi.play();
    } catch (error) {
      console.error("Error resuming track:", error);
    }
  };

  const seekToPosition = async (positionMs: number) => {
    try {
      await spotifyApi.seek(positionMs);
    } catch (error) {
      console.error("Error seeking to position:", error);
    }
  };

  const getCurrentState = useCallback(async () => {
    try {
      // Test if API is working with a simple call
      try {
        const profilePromise = spotifyApi.getMe();

        // Add a simple timeout to see if API is hanging
        const profileTimeoutId = setTimeout(() => {}, 2000);

        const profileTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Profile API timeout")), 5000)
        );
        const profile = (await Promise.race([
          profilePromise,
          profileTimeout,
        ])) as any;
        clearTimeout(profileTimeoutId);
      } catch (profileError) {
        console.error("Profile test failed:", profileError);
        if (profileError instanceof Error) {
          console.error("Profile error details:", profileError.message);
        }

        // Check if it's an authentication error
        if (
          profileError &&
          typeof profileError === "object" &&
          "error" in profileError
        ) {
          const error = profileError as any;
          if (error.error?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/";
            return; // Exit early to prevent further API calls
          }
        }
      }

      const apiPromise = spotifyApi.getMyCurrentPlaybackState();

      // Add a simple timeout to see if API is hanging
      const timeoutId = setTimeout(() => {}, 3000);

      try {
        const state = await apiPromise;
        clearTimeout(timeoutId);

        if (state && state.item) {
          setCurrentTrack(state.item as SpotifyApi.TrackObjectFull);
          setIsPlaying(state.is_playing);
          setPosition(state.progress_ms || 0);
        } else {
          setCurrentTrack(null);
          setIsPlaying(false);
          setPosition(0);
        }
      } catch (apiError) {
        console.error("API call failed:", apiError);
        if (apiError instanceof Error) {
          console.error("API error details:", apiError.message);
        }

        // Check if it's an authentication error or rate limiting error
        if (apiError && typeof apiError === "object" && "error" in apiError) {
          const error = apiError as any;
          if (error.error?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/";
          } else if (error.error?.status === 429) {
            // Don't throw error, just log and continue
            // The interval will retry later
          }
        }
      }
    } catch (error) {
      console.error("Error getting current state:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
      } else if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;
        console.error(
          "Error details:",
          axiosError.response?.data || axiosError.message
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // spotifyApi is already memoized with useState

  // Predict playlist for current track
  const predictPlaylist = useCallback(
    async (trackId: string) => {
      if (!trackId) return;

      setIsPredictingPlaylist(true);
      try {
        const response = await axios.post("/api/playlists/predict", {
          trackId,
          userId: user?.id,
        });

        if (response.data && response.data.playlist) {
          setPredictedPlaylist(response.data.playlist);
        } else {
          setPredictedPlaylist(null);
        }
      } catch (error) {
        console.error("Error predicting playlist:", error);
        setPredictedPlaylist(null);
      } finally {
        setIsPredictingPlaylist(false);
      }
    },
    [user?.id]
  );

  // Check if current track is in predicted playlist
  const isCurrentTrackInPredictedPlaylist = useCallback(() => {
    if (!currentTrack || !predictedPlaylist) return false;
    return predictedPlaylist.tracks.some(
      (track: any) => track.id === currentTrack.id
    );
  }, [currentTrack, predictedPlaylist]);

  // Predict playlist when track changes
  useEffect(() => {
    if (currentTrack) {
      // Only predict if this is a new track we haven't predicted for yet
      if (currentTrack.id !== lastPredictedTrackId) {
        setLastPredictedTrackId(currentTrack.id);
        predictPlaylist(currentTrack.id);
      }
    } else {
      setPredictedPlaylist(null);
      setLastPredictedTrackId(null);
    }
  }, [currentTrack?.id, lastPredictedTrackId, predictPlaylist]);

  const value = {
    spotifyApi,
    currentTrack,
    isPlaying,
    position,
    predictedPlaylist,
    isPredictingPlaylist,
    playTrack,
    pauseTrack,
    resumeTrack,
    seekToPosition,
    getCurrentState,
  };

  return (
    <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
  );
};

// No Web Playback SDK - using API-only approach
