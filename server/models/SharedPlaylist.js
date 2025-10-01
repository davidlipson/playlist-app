const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SharedPlaylist = sequelize.define(
  "SharedPlaylist",
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
    sharedWithUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    sharedByUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "shared_playlists",
    timestamps: true,
  }
);

module.exports = SharedPlaylist;
