"use strict";
const connection = require("./connection");

const getUser = async (id) => {
  return await new Promise((resolve, reject) => {
    connection.query(
      "SELECT user_id FROM products WHERE id = ?",
      [id],
      (err, res) => {
        return err || res.length === 0
          ? reject({ error: "Cannot retrieve products" })
          : resolve(res[0].user_id);
      }
    );
  });
};

const get = async (queryParams) => {
  let query =
    "SELECT products.id, products.name, products.description, products.price, products.stock, products.category, product_images.image FROM products JOIN product_images ON (products.id = product_images.product_id) WHERE product_images.image_index = 1";
  let params = [];
  if (queryParams.category) {
    query += " AND products.category = ?";
    params.push(queryParams.category);
  }
  return await new Promise((resolve, reject) => {
    connection.query(query, params, (err, res) => {
      return err || res.length === 0
        ? reject({ error: "Cannot retrieve products" })
        : resolve(res);
    });
  });
};

const getByUser = async (userId) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "SELECT products.id, products.name, products.description, products.price, products.stock, products.category FROM products JOIN users u ON (products.user_id = u.id AND products.user_id = ?)",
      [userId],
      (err, res) => {
        return err || res.length === 0
          ? reject({ error: "Cannot retrieve products" })
          : resolve(res);
      }
    );
  });

const one = async (id) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "SELECT p.*, u.username as username FROM products p JOIN users u ON (p.user_id = u.id) WHERE p.id = ? LIMIT 1",
      [id],
      (err, product) => {
        if (err) {
          return reject({ error: `Cannot store product: ${err.message}` });
        } else if (product.length === 0) {
          return reject();
        }
        connection.query(
          "SELECT image FROM product_images WHERE product_id = ? ORDER BY image_index ASC",
          [id],
          (err, res) => {
            if (err || res.length === 0) {
              return reject({ error: "Cannot retrieve product images" });
            }
            resolve({ ...product[0], images: [...res] });
          }
        );
      }
    );
  });

const store = async (
  { name, description, price, stock, category },
  caller_id
) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "INSERT INTO products VALUES (NULL, ?, ?, ?, ?, ?, ?)",
      [caller_id, name, description, price, stock, category],
      (err, product) => {
        if (err || product.length === 0) {
          return reject({ error: `Cannot store product: ${err.message}` });
        }

        //TODO: Loop over images and store them
        connection.query(
          "INSERT INTO product_images VALUES (NULL, ?, ?, ?), (NULL, ?, ?, ?)",
          [
            product.insertId,
            category === "vinyl"
              ? "holding-album-square.jpg"
              : "girl-hoodie.jpg",
            1,
            product.insertId,
            category === "vinyl" ? "vinyl.jpg" : "man-hoodie.jpg",
            2,
          ],
          (err, res) => {
            return err || res.length === 0
              ? reject({ error: `Cannot store product images: ${err.message}` })
              : resolve(product.insertId);
          }
        );
      }
    );
  });

const update = async (
  { name, description, price, stock, category },
  productId
) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "UPDATE products SET `name` = ?, `description` = ?, `price` = ?, `stock` = ?, `category` = ? WHERE `id` = ?",
      [name, description, price, stock, category, productId],
      (err, res) => {
        return err || res.length === 0
          ? reject({ error: `Cannot update product: ${err.message}` })
          : resolve(res);
      }
    );
  });

const destroy = async (productId) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "DELETE FROM products WHERE `id` = ?",
      [productId],
      (err, res) => {
        return err || res.affectedRows === 0 ? reject() : resolve(res);
      }
    );
  });

module.exports = {
  getUser,
  get,
  getByUser,
  one,
  store,
  update,
  destroy,
};
