const mysql = require("mysql");
const connection = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "root",
  password: "",
  database: "software-security",
});

module.exports = connection;
