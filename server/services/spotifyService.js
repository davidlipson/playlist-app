const axios = require("axios");

class SpotifyService {
  constructor() {
    this.baseURL = "https://api.spotify.com/v1";
  }

  async getAccessToken(code, redirectUri) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    // Validate required environment variables
    if (!clientId) {
      throw new Error("SPOTIFY_CLIENT_ID is not set");
    }
    if (!clientSecret) {
      throw new Error("SPOTIFY_CLIENT_SECRET is not set");
    }

    try {
      console.log("Exchanging authorization code for access token");
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      console.log("Successfully exchanged code for access token");
      return response.data;
    } catch (error) {
      console.error(
        "Failed to exchange code for access token:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async refreshAccessToken(refreshToken) {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  }

  async getUserProfile(accessToken) {
    try {
      console.log("Fetching user profile from Spotify");
      const response = await axios.get(`${this.baseURL}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("Successfully retrieved user profile:", response.data.id);
      return response.data;
    } catch (error) {
      console.error(
        "Failed to get user profile:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async getUserPlaylists(accessToken, limit = 50, offset = 0) {
    try {
      const response = await axios.get(`${this.baseURL}/me/playlists`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          limit,
          offset,
        },
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error("SPOTIFY_TOKEN_EXPIRED");
      }
      throw error;
    }
  }

  async getPlaylist(accessToken, playlistId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/playlists/${playlistId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error("SPOTIFY_TOKEN_EXPIRED");
      }
      throw error;
    }
  }

  async getPlaylistTracks(accessToken, playlistId, limit = 100, offset = 0) {
    try {
      const response = await axios.get(
        `${this.baseURL}/playlists/${playlistId}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            limit,
            offset,
          },
        }
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error("SPOTIFY_TOKEN_EXPIRED");
      }
      throw error;
    }
  }

  async getTrack(accessToken, trackId) {
    const response = await axios.get(`${this.baseURL}/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  async searchTracks(accessToken, query, limit = 20) {
    const response = await axios.get(`${this.baseURL}/search`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        q: query,
        type: "track",
        limit,
      },
    });

    return response.data;
  }
}

module.exports = new SpotifyService();
