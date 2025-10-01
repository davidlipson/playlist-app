const User = require("./User");
const Playlist = require("./Playlist");
const Comment = require("./Comment");
const SharedPlaylist = require("./SharedPlaylist");
const Like = require("./Like");

// Define associations
User.hasMany(Playlist, { foreignKey: "ownerId", as: "ownedPlaylists" });
Playlist.belongsTo(User, { foreignKey: "ownerId", as: "owner" });

User.hasMany(Comment, { foreignKey: "userId", as: "comments" });
Comment.belongsTo(User, { foreignKey: "userId", as: "user" });

Playlist.hasMany(Comment, { foreignKey: "playlistId", as: "comments" });
Comment.belongsTo(Playlist, { foreignKey: "playlistId", as: "playlist" });

// Shared playlists associations
Playlist.belongsToMany(User, {
  through: SharedPlaylist,
  foreignKey: "playlistId",
  otherKey: "sharedWithUserId",
  as: "sharedWithUsers",
});

User.belongsToMany(Playlist, {
  through: SharedPlaylist,
  foreignKey: "sharedWithUserId",
  otherKey: "playlistId",
  as: "sharedPlaylists",
});

// Additional associations for SharedPlaylist
SharedPlaylist.belongsTo(Playlist, {
  foreignKey: "playlistId",
  as: "playlist",
});
SharedPlaylist.belongsTo(User, {
  foreignKey: "sharedWithUserId",
  as: "sharedWithUser",
});
SharedPlaylist.belongsTo(User, {
  foreignKey: "sharedByUserId",
  as: "sharedByUser",
});

// Like associations
User.hasMany(Like, { foreignKey: "userId", as: "likes" });
Like.belongsTo(User, { foreignKey: "userId", as: "user" });

Playlist.hasMany(Like, { foreignKey: "playlistId", as: "likes" });
Like.belongsTo(Playlist, { foreignKey: "playlistId", as: "playlist" });

module.exports = {
  User,
  Playlist,
  Comment,
  SharedPlaylist,
  Like,
};
