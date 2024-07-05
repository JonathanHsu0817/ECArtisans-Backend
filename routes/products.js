let express = require("express");
let router = express.Router();
const Product = require("../models/product");
const Seller = require("../models/seller");
const User = require("../models/user");
const Activities = require("../models/activity.js");

router.get("/:category", async (req, res) => {
  try {
    const selectedCategory = req.params.category;

    // 查詢該種類下的所有已上架商品
    const products = await Product.find({
      sellerCategory: { $in: [selectedCategory] },
      isOnshelf: true, // 只查詢已上架的商品
    })
      .populate({
        path: "sellerOwned",
        select: "brand",
        model: Seller,
      })
      .lean();

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "查無商品" });
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
        total_sales: product.sold,
        discount: discount.length > 0 ? discount : null,
        star:
          product.reviews.length > 0
            ? calculateAverageRating(product.reviews)
            : 0, // 假設需要計算平均評分的函式
        products_format: products_format,
        origin: product.origin,
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

// 取得單個商品的詳情
router.get("/detail/:productId", async (req, res) => {
  try {
    const productId = req.params.productId;

    // 查詢單個商品詳情
    const product = await Product.findById(productId)
      .populate({
        path: "sellerOwned",
        select: "brand avatar _id", // 選擇 bossName 和 _id
        model: Seller,
      })
      .lean();

    if (!product) {
      return res.status(404).json({ message: "找不到商品" });
    }

    // 查詢賣家建立的第一個活動
    let firstActivityImage = null;
    if (product.sellerOwned) {
      const firstActivity = await Activities.findOne({
        seller_id: product.sellerOwned._id,
      })
        .sort({ start_date: 1 })
        .select("activity_image")
        .lean();
      if (firstActivity) {
        firstActivityImage = firstActivity.activity_image;
      }
    }

    // 確保 product.pay 是陣列，並處理安全訪問
    const paymentMethods = Array.isArray(product.pay) ? product.pay : [];

    const discount = [];
    if (product.tags && Array.isArray(product.tags)) {
      if (product.tags.includes(0)) {
        discount.push("免運券");
      }
      if (product.tags.includes(1)) {
        discount.push("折抵券");
      }
    }
    // 查詢所有收藏了此商品的會員數量
    const totalCollect = await User.countDocuments({ collect: productId });

    // 格式化商品資料
    const formattedData = {
      products_id: product._id,
      products_format: product.format.map((f) => ({
        format_id: f._id,
        format_title: f.title,
        price: f.price,
        image: f.image,
      })),
      products_name: product.productName,
      all_images: product.image, // 取出所有圖片陣列
      products_info: product.introduction,
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
      total_sales: product.sold,
      discount: discount.length > 0 ? discount : null,
      star:
        product.reviews.length > 0
          ? calculateAverageRating(product.reviews)
          : 0,
      total_collect: totalCollect,
      seller_name: product.sellerOwned ? product.sellerOwned.brand : null,
      seller_id: product.sellerOwned ? product.sellerOwned._id : null,
      seller_avatar: product.sellerOwned ? product.sellerOwned.avatar : null,
      shop_image: firstActivityImage,
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
