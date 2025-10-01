const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "sqlite://playlist_app.db",
  {
    dialect: "sqlite",
    storage: "playlist_app.db",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  }
);

module.exports = sequelize;
