const express = require("express");
const app = express();
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const PORT = process.env.PORT || 8089;
require("dotenv").config();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  console.log("hello");
});

const connection = mysql.createConnection({
  host: process.env.HOST,
  database: process.env.DATABASE,
  user: process.env.USER,
  password: process.env.PASSWORD,
});

//Connect to MySQL Database
connection.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Connected");
  }
});

app.get("/", (req, res) => {
  res.send("Hello");
});

//Declare endpoint for retrieving similarities
app.get("/similarities/:id", (req, res) => {
  if (req.params.id) {
    //Query selected user's categories
    connection.query(
      `SELECT DISTINCT transactions.category from users INNER JOIN transactions ON transactions.user_id=users.id WHERE users.id=${req.params.id}`,
      async (err, rows, fields) => {
        if (err) {
          res.status(400).send({ response: "Failed", error: err });
        } else {
          var categoriesString = `transactions.category='${String(
            rows[Math.floor(Math.random() * rows.length)].category
          )}' `;

          for (let index = 0; index < 2; index++) {
            categoriesString =
              categoriesString +
              `OR transactions.category='${String(
                rows[Math.floor(Math.random() * rows.length)].category
              )}' `;
          }

          getSimilarities(categoriesString, res);
        }
      }
    );
  }
});

//Query users with similar categories as any three of selected user's categories in at least 5 months from 12 year period
const getSimilarities = async (categoriesString, res) => {
  connection.query(
    `SELECT DISTINCT users.id, users.first_name, users.last_name, users.avatar, users.created_at, COUNT(transactions.category) FROM users INNER JOIN transactions on users.id=transactions.user_id WHERE ${categoriesString} GROUP BY users.id,users.first_name, users.last_name, users.avatar, users.created_at, transactions.category HAVING COUNT(*) >= 5`,
    (err1, rows1, fields1) => {
      if (err1) {
        res.status(400).send({ response: "Failed", error: err1 });
      } else {
        res.send({ status: 200, data: rows1 });
      }
    }
  );
};

app.listen(PORT, () => {
  console.log("Server started on port 8089");
});
