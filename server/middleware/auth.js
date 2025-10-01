const jwt = require("jsonwebtoken");
const { User } = require("../models");
const spotifyService = require("../services/spotifyService");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check if Spotify token is expired and refresh if needed
    if (user.tokenExpiresAt && new Date() >= user.tokenExpiresAt) {
      try {
        console.log("Spotify token expired, refreshing...");
        const tokenData = await spotifyService.refreshAccessToken(user.refreshToken);
        
        await user.update({
          accessToken: tokenData.access_token,
          tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        });
        
        console.log("Spotify token refreshed successfully");
      } catch (refreshError) {
        console.error("Failed to refresh Spotify token:", refreshError);
        // Don't fail the request, just log the error
        // The Spotify API call will handle the 401 and prompt re-authentication
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

module.exports = {
  authenticateToken,
};
