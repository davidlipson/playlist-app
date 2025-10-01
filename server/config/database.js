const { Sequelize } = require("sequelize");

let sequelize;

if (process.env.NODE_ENV === "production") {
  // Production: Use PostgreSQL (Heroku)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  });
} else {
  // Development: Use SQLite
  sequelize = new Sequelize("sqlite://playlist_app.db", {
    dialect: "sqlite",
    storage: "playlist_app.db",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  });
}

module.exports = sequelize;
