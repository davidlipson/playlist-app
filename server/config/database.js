const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DATABASE_URL || "sqlite://playlist_app.db",
  {
    dialect: process.env.DATABASE_URL?.includes("postgresql")
      ? "postgres"
      : "sqlite",
    storage: process.env.DATABASE_URL?.includes("sqlite")
      ? "playlist_app.db"
      : undefined,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: process.env.DATABASE_URL?.includes("postgresql")
      ? {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        }
      : undefined,
    dialectOptions: process.env.DATABASE_URL?.includes("postgresql")
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : undefined,
  }
);

module.exports = sequelize;
