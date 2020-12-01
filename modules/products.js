"use strict";
const connection = require("./connection");

const get = async () =>
  await new Promise((resolve, reject) => {
    connection.query(
      "SELECT products.id, products.name, products.description, products.price, products.category, product_images.image FROM products JOIN product_images ON (products.id = product_images.product_id) WHERE product_images.image_index = 1",
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
      "SELECT * FROM products WHERE id = ? LIMIT 1",
      [id],
      (err, product) => {
        if (err || product.length === 0) {
          return reject({ error: "Cannot retrieve product" });
        }
        connection.query(
          "SELECT image FROM product_images WHERE product_id = ? ORDER BY image_index ASC",
          [id],
          (err, res) => {
            if (err || res.length === 0) {
              return reject({ error: "Cannot retrieve product images" });
            }
            resolve({ ...product[0], images: { ...res } });
          }
        );
      }
    );
  });

const store = async () =>
  await new Promise((resolve, reject) => {
    connection.query("SELECT * FROM products", (err, res) => {
      return err || res.length === 0
        ? reject({ error: "Cannot retrieve product's" })
        : resolve(res);
    });
  });

module.exports = {
  get: get,
  one: one,
  store: store,
};
