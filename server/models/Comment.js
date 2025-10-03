const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Comment = sequelize.define(
  "Comment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    playlistId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "playlists",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    trackId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    trackName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    artistName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Timestamp in seconds within the track",
    },
    inSongTimestamp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment:
        "Timestamp in seconds when user clicked comment button while listening to the song",
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "comments",
    timestamps: true,
  }
);

module.exports = Comment;
