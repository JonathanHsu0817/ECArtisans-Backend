let express = require("express");
let router = express.Router();
const Product = require("../models/product");
const Seller = require("../models/seller");

router.get("/:category", async (req, res) => {
  try {
    const selectedCategory = req.params.category;

    // 查詢該種類下的所有商品
    const products = await Product.find({
      sellerCategory: { $in: [selectedCategory] },
      isOnshelf: true, // 只查詢已上架的商品
    })
      .populate({
        path: "sellerOwned",
        select: "bossName",
        model: Seller,
      })
      .lean();

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    // 格式化商品資料
    const formattedData = products.map((product) => ({
      product_id: product._id,
      product_name: product.productName,
      product_images: product.image[0], // 假設這裡取第一張圖片
      seller_name: product.sellerOwned.bossName,
      price: product.price,
      total_sales: product.sold,
      discount: product.tags.includes(0) ? "免運券" : "", // 根據 tags 中的值來判斷優惠信息
      star:
        product.reviews.length > 0
          ? calculateAverageRating(product.reviews)
          : 0, // 假設需要計算平均評分的函式
    }));

    res.status(200).json({
      status: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 取得單個商品的詳情
router.get("/detail/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;

    // 查詢單個商品詳情
    const product = await Product.findById(productId)
      .populate({
        path: "sellerOwned",
        select: "bossName",
        model: Seller,
      })
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 確保 product.pay 是陣列，並處理安全訪問
    const paymentMethods = Array.isArray(product.pay) ? product.pay : [];

    // 格式化商品資料
    const formattedData = {
      product_id: product._id,
      product_name: product.productName,
      product_images: product.image, // 取出所有圖片陣列
      product_info: product.introduction,
      production_material: product.ingredient,
      production_method: product.production,
      production_country: product.origin,
      payment:
        paymentMethods.length > 0 && paymentMethods.includes(1)
          ? "信用卡"
          : "其他", // 確保 paymentMethods 有值再使用 includes
      freight: product.fare,
      stock:
        product.format && product.format.length > 0
          ? product.format.reduce((acc, curr) => acc + curr.stock, 0)
          : 0, // 計算庫存總數
      price: product.format[0].price, // 假設取第一種格式的價格
      total_sales: product.sold,
      discount:
        product.tags && product.tags.length > 0 && product.tags.includes(1)
          ? "八折優惠"
          : "", // 假設 1 代表八折優惠
      star: product.reviews ? calculateAverageRating(product.reviews) : 0,
      total_collect:
        product.reviews && product.reviews.length > 0
          ? product.reviews.length
          : 0,
    };

    res.status(200).json({
      status: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 計算平均評分的函式
function calculateAverageRating(reviews) {
  const totalStars = reviews.reduce((acc, curr) => acc + curr.star, 0);
  return totalStars / reviews.length;
}

module.exports = router;
