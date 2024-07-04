let express = require("express");
let router = express.Router();
const Product = require("../models/product");
const Seller = require("../models/seller"); // 引入賣家模型

// 商品搜尋
router.get("/products", async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ status: false, message: "請提供關鍵字" });
    }

    // 查詢商品名稱中包含關鍵字且已上架的商品
    const products = await Product.find({
      productName: { $regex: keyword, $options: "i" }, // 使用正則表達式忽略大小寫進行匹配
      isOnshelf: true, // 只查詢已上架的商品
    })
      .populate({
        path: "sellerOwned",
        select: "brand",
        model: Seller,
      })
      .lean();

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "無商品符合關鍵字" });
    }

    // 格式化商品資料
    const formattedData = products.map((product) => {
      const discount = [];

      if (product.tags && Array.isArray(product.tags)) {
        if (product.tags.includes(0)) {
          discount.push("免運券");
        }
        if (product.tags.includes(1)) {
          discount.push("折抵券");
        }
      }

      const products_format = product.format.map((fmt) => ({
        format_id: fmt._id,
        format_price: fmt.price,
        format_color: fmt.color,
      }));

      const prices = product.format.map((fmt) => fmt.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const price = minPrice === maxPrice ? [minPrice] : [minPrice, maxPrice];

      return {
        products_id: product._id,
        products_name: product.productName,
        products_image: product.image[0], // 假設這裡取第一張圖片
        shop_name: product.sellerOwned.brand,
        price: price,
        origin: product.origin,
        total_sales: product.sold,
        discount: discount.length > 0 ? discount : null,
        star:
          product.reviews.length > 0
            ? calculateAverageRating(product.reviews)
            : 0, // 假設需要計算平均評分的函式
        products_format: products_format,
      };
    });

    res.status(200).json({
      status: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
