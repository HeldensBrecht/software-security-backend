"use strict";
const connection = require("./connection");
const products = require("./products");

const getUserID = async ({ sub }) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "SELECT `id` FROM users WHERE `sub` = ?",
      [sub],
      (err, res) => {
        return err || res.length === 0
          ? reject({ error: "Cannot retrieve user" })
          : resolve(res[0].id);
      }
    );
  });

const isAdmin = async (userId) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "SELECT `role` FROM users WHERE `id` = ?",
      [userId],
      (err, res) => {
        return err || res.length === 0 ? reject() : resolve(res[0].role);
      }
    );
  });

const getAllData = async ({ sub }) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "SELECT * FROM users WHERE `sub` = ?",
      [sub],
      (err, user) => {
        err || user.length === 0
          ? reject()
          : products
              .getByUser(user[0].id)
              .then((products) => resolve({ user: user[0], products }))
              .catch((err) => resolve({ user: user[0], products: [] }));
      }
    );
  });

const one = async (userId, { sub = undefined }, isAdmin = false) => {
  let query = "SELECT `id`, `username` FROM users WHERE `id` = ?";
  let filters = [userId];
  if (!userId || isAdmin) {
    query = "SELECT * FROM users WHERE `sub` = ?";
    filters = [sub];
  }

  return await new Promise((resolve, reject) => {
    connection.query(query, filters, (err, user) => {
      if (err || user.length === 0) {
        return reject();
      }
      if (!userId || isAdmin) {
        return products
          .getByUser(user[0].id)
          .then((products) => resolve({ user: user[0], products }))
          .catch((err) => resolve({ user: user[0], products: [] }));
      } else {
        return resolve(user[0]);
      }
    });
  });
};

const store = async ({ sub }, { username }, role = 0) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "INSERT INTO users VALUES (NULL, ?, ?, ?)",
      [username, sub, role],
      (err, user) => {
        return err || user.length === 0 ? reject() : resolve(user.insertId);
      }
    );
  });

const update = async (userId, { username }) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "UPDATE users SET `username` = ? WHERE `id` = ?",
      [username, userId],
      (err, res) => {
        return err || res.length === 0 ? reject() : resolve();
      }
    );
  });

const destroy = async (userId) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "DELETE FROM users WHERE `id` = ?",
      [userId],
      (err, res) => {
        return err || res.affectedRows === 0 ? reject() : resolve();
      }
    );
  });

module.exports = {
  getUserID,
  isAdmin,
  getAllData,
  one,
  store,
  update,
  destroy,
};
