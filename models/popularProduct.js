const mongoose = require("mongoose");

const popularProductSchema = new mongoose.Schema({
  product_id: { type: String, required: true },
  product_name: { type: String, required: true },
  product_images: { type: [String], required: true },
  seller_name: { type: String, required: true },
  price: { type: Number, required: true },
  total_sales: { type: Number, required: true },
  discount: { type: String, required: true },
  star: { type: Number, required: true },
}, { collection: 'popular-products' });  // 指定集合名稱

const PopularProduct = mongoose.model("PopularProduct", popularProductSchema);

module.exports = PopularProduct;
