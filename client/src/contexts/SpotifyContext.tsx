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

interface SpotifyContextType {
  spotifyApi: SpotifyWebApi.SpotifyWebApiJs;
  currentTrack: SpotifyApi.TrackObjectFull | null;
  isPlaying: boolean;
  position: number;
  playTrack: (trackUri: string) => Promise<void>;
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
  console.log("SpotifyProvider component rendering");
  const [spotifyApi] = useState(() => new SpotifyWebApi());
  const [currentTrack, setCurrentTrack] =
    useState<SpotifyApi.TrackObjectFull | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  // Set access token when component mounts
  useEffect(() => {
    const fetchSpotifyToken = async () => {
      try {
        console.log("Fetching Spotify access token from server...");
        const response = await axios.get("/api/auth/spotify-token");
        const { accessToken } = response.data;

        if (accessToken) {
          spotifyApi.setAccessToken(accessToken);
          console.log("Spotify API access token set from server");
          console.log("Token value:", accessToken.substring(0, 20) + "...");

          // Test the token immediately to see if it's valid
          spotifyApi
            .getMe()
            .then(() => {
              console.log("Spotify token is valid");
            })
            .catch((error) => {
              console.error("Spotify token validation failed:", error);
              if (error.error?.status === 401) {
                console.log(
                  "Spotify token is invalid - user needs to re-authenticate"
                );
                localStorage.removeItem("token");
                window.location.href = "/";
              }
            });
        } else {
          console.log("No Spotify access token found on server");
        }
      } catch (error) {
        console.error("Failed to fetch Spotify token:", error);
        // If we can't get the Spotify token, the user might need to re-authenticate
        if (error && typeof error === "object" && "response" in error) {
          const axiosError = error as any;
          if (axiosError.response?.status === 401) {
            console.log("JWT token is invalid - redirecting to login");
            localStorage.removeItem("token");
            window.location.href = "/";
          }
        }
      }
    };

    fetchSpotifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // spotifyApi is already memoized with useState

  // No Web Playback SDK - using API-only approach

  const playTrack = async (trackUri: string) => {
    try {
      console.log("Playing track:", trackUri);

      // Use Web API to play the track
      await spotifyApi.play({
        uris: [trackUri],
      });

      console.log("Track should now be playing");
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
    console.log("getCurrentState function called");
    try {
      console.log("Calling getMyCurrentPlaybackState...");
      console.log(
        "Spotify API access token:",
        spotifyApi.getAccessToken() ? "Set" : "Not set"
      );
      console.log("Spotify API instance:", spotifyApi);
      console.log(
        "Available methods:",
        Object.getOwnPropertyNames(Object.getPrototypeOf(spotifyApi))
      );

      // Test if API is working with a simple call
      try {
        console.log("Testing API with getUserProfile...");
        const profilePromise = spotifyApi.getMe();
        console.log("Profile promise created, waiting...");

        // Add a simple timeout to see if API is hanging
        const profileTimeoutId = setTimeout(() => {
          console.log(
            "Profile API call is taking too long, might be hanging..."
          );
        }, 2000);

        const profileTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Profile API timeout")), 5000)
        );
        const profile = (await Promise.race([
          profilePromise,
          profileTimeout,
        ])) as any;
        clearTimeout(profileTimeoutId);
        console.log("User profile test successful:", profile.display_name);
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
            console.log(
              "Invalid access token detected in profile test - clearing and redirecting to login"
            );
            localStorage.removeItem("token");
            window.location.href = "/";
            return; // Exit early to prevent further API calls
          }
        }
      }

      console.log("About to call getMyCurrentPlaybackState...");
      const apiPromise = spotifyApi.getMyCurrentPlaybackState();
      console.log("API promise created, waiting for response...");

      // Add a simple timeout to see if API is hanging
      const timeoutId = setTimeout(() => {
        console.log("API call is taking too long, might be hanging...");
      }, 3000);

      try {
        console.log("Waiting for API response...");
        const state = await apiPromise;
        clearTimeout(timeoutId);
        console.log("Playback state response:", state);

        if (state && state.item) {
          setCurrentTrack(state.item as SpotifyApi.TrackObjectFull);
          setIsPlaying(state.is_playing);
          setPosition(state.progress_ms || 0);
          console.log(
            "Updated state - track:",
            state.item?.name,
            "playing:",
            state.is_playing,
            "position:",
            state.progress_ms,
            "duration:",
            state.item?.duration_ms
          );
        } else {
          console.log(
            "No playback state returned (user might not be playing anything)"
          );
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
            console.log(
              "Invalid access token - clearing and redirecting to login"
            );
            localStorage.removeItem("token");
            window.location.href = "/";
          } else if (error.error?.status === 429) {
            console.log("Rate limited by Spotify API - backing off");
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

  const value = {
    spotifyApi,
    currentTrack,
    isPlaying,
    position,
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
