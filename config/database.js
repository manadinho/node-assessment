const { Sequelize } = require("sequelize");
const dbConfig = require("./config")[process.env.APP_MODE];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
  }
);

const db = {};

// Test the database connection authentication
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;
