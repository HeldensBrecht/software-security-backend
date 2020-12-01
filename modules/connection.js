const mysql = require("mysql");
const connection = mysql.createPool({
  connectionLimit: 10,
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  port: process.env.RDS_PORT,
  // database: "software-security",
});

module.exports = connection;
