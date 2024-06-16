const mongoose = require("mongoose");

const recommendShopSchema = new mongoose.Schema(
  {
    seller_id: { type: String, required: true },
    seller_name: { type: String, required: true },
    seller_image: { type: String, required: true },
    product_images: { type: [String], required: true },
    star: { type: Number, required: true },
    total_comments: { type: Number, required: true },
  },
  { collection: "recommend-shop" }
); // 指定集合名稱

const RecommendShop = mongoose.model("recommendShop", recommendShopSchema);

module.exports = RecommendShop;
