"use strict";
const connection = require("./connection");

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

const one = async (id) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "SELECT * FROM products WHERE id = ? LIMIT 1",
      [id],
      (err, product) => {
        if (err || product.length === 0) {
          return reject({ error: `Cannot store product: ${err.message}` });
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

const store = async ({ name, description, price, stock, category }) =>
  await new Promise((resolve, reject) => {
    connection.query(
      "INSERT INTO products VALUES (NULL, ?, ?, ?, ?, ?)",
      [name, description, price, stock, category],
      (err, res) => {
        return err || res.length === 0
          ? reject({ error: `Cannot store product: ${err.message}` })
          : resolve(res);
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

module.exports = {
  get,
  one,
  store,
  update,
};
