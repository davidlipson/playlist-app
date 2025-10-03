const jwt = require("jsonwebtoken");
const { User } = require("../models");
const spotifyService = require("../services/spotifyService");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("No authorization token provided");
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    // Validate JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("JWT token verified for user:", decoded.userId);

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      console.log("User not found for ID:", decoded.userId);
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check if Spotify token is expired and refresh if needed
    if (user.tokenExpiresAt && new Date() >= user.tokenExpiresAt) {
      try {
        console.log("Spotify token expired, refreshing for user:", user.id);
        const tokenData = await spotifyService.refreshAccessToken(
          user.refreshToken
        );

        await user.update({
          accessToken: tokenData.access_token,
          tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        });

        console.log("Spotify token refreshed successfully for user:", user.id);
      } catch (refreshError) {
        console.error(
          "Failed to refresh Spotify token for user:",
          user.id,
          refreshError
        );
        // Don't fail the request, just log the error
        // The Spotify API call will handle the 401 and prompt re-authentication
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token" });
    }
    return res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = {
  authenticateToken,
};
