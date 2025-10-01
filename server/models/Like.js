const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Like = sequelize.define(
  "Like",
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
  },
  {
    tableName: "likes",
  }
);

module.exports = Like;
