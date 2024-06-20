let express = require("express");
let router = express.Router();
const Product = require("../models/product");
const Seller = require("../models/seller"); // 引入賣家模型

/* GET home page. */
router.get("/products", async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ status: false, message: "請提供關鍵字" });
    }

    // 使用正則表達式進行部分匹配搜索，並且填充 sellerOwned 字段
    const products = await Product.find({
      productName: { $regex: keyword, $options: "i" },
    }).populate({
      path: "sellerOwned",
      select: "bossName",
      model: Seller,
    });

    // 格式化返回結果
    const result = products.map((product) => {
      let sellerName = "Unknown Seller";
      if (product.sellerOwned) {
        sellerName = product.sellerOwned.bossName; // 使用賣家的 bossName 屬性作為名稱
      }
      return {
        products_id: product._id,
        products_name: product.productName,
        products_images: product.image ? product.image[0] : "", // 假設使用第一張圖片
        seller_name: sellerName,
        price: product.fare,
        total_sales: product.sold,
        discount: product.tags.includes(0)
          ? "免運券"
          : product.tags.includes(1)
          ? "折抵券"
          : "",
        star: product.reviews.length
          ? product.reviews.reduce((acc, review) => acc + review.star, 0) /
            product.reviews.length
          : 0,
      };
    });

    res.json({ status: true, data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "伺服器錯誤" });
  }
});

module.exports = router;
