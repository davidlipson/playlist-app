const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    spotifyId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    lastNotificationCheck: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "users",
    timestamps: true,
  }
);

module.exports = User;
