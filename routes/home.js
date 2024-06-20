const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Seller = require("../models/seller");
const User = require("../models/user.js");
const { isAuth } = require("../middlewares/isAuth");

// 取得熱門商品
router.get("/popular-products", async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $sort: { sold: -1 },
      },
      {
        $lookup: {
          from: "sellers",
          localField: "sellerOwned",
          foreignField: "_id",
          as: "seller",
        },
      },
      {
        $addFields: {
          seller: { $arrayElemAt: ["$seller", 0] },
        },
      },
      {
        $project: {
          products_id: "$_id",
          products_name: "$productName",
          products_images: "$image",
          seller_name: { $ifNull: ["$seller.brand", "Unknown"] },
          price: "$price",
          total_sales: "$sold",
          discount: {
            $cond: {
              if: { $isArray: "$tags" },
              then: {
                $cond: {
                  if: { $in: [0, "$tags"] },
                  then: "免運券",
                  else: {
                    $cond: {
                      if: { $in: [1, "$tags"] },
                      then: "折抵券",
                      else: "無",
                    },
                  },
                },
              },
              else: "無",
            },
          },
          star: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ["$reviews", []] } }, 0] },
              then: {
                $divide: [{ $sum: "$reviews.star" }, { $size: "$reviews" }],
              },
              else: 0,
            },
          },
        },
      },
    ]);

    res.status(200).json({
      status: true,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 取得推薦商家
router.get("/recommend-shop", async (req, res) => {
  try {
    const sellers = await Seller.find()
      .sort({ "order.length": -1 }) // 根據訂單數量降序排序
      .select("bossName brand avatar star total_comments")
      .lean(); // 轉為JavaScript物件

    // 格式化結果
    const formattedSellers = sellers.map((seller) => ({
      seller_id: seller._id,
      seller_name: seller.bossName,
      seller_image: seller.avatar,
      product_images:
        seller.product && seller.product.length > 0 ? seller.product[0] : "",
      star: seller.star || 0,
      total_comments: seller.total_comments || 0,
    }));

    res.status(200).json({
      status: true,
      data: formattedSellers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 取得會員關注的商家資料
router.get("/follow-shops", isAuth, async (req, res) => {
  try {
    // 取得已驗證使用者的 ID
    const memberId = req.user.id;

    // 查詢會員資料，包括其關注的商家
    const user = await User.findById(memberId)
      .populate({
        path: "likeShop",
        select: "bossName avatar collection",
        model: Seller,
      })
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 格式化商家資料
    const formattedData = user.likeShop.map((seller) => ({
      seller_id: seller._id,
      seller_name: seller.bossName,
      seller_image: seller.avatar,
      product_images: seller.collection, 
    }));

    res.status(200).json({
      status: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 取得會員關注商家的最新商品
router.get('/latest-products', isAuth, async (req, res) => {
  try {
      // 取得已驗證使用者的 ID
      const memberId = req.user.id;

      // 查詢會員資料，包括其關注的商家
      const user = await User.findById(memberId)
          .populate({
              path: 'likeShop',
              select: '_id', // 只需要商家的 _id
              model: Seller,
          })
          .lean();

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // 取得所有關注商家的 _id
      const sellerIds = user.likeShop.map(seller => seller._id);

      // 查詢每個商家的最新商品
      const latestProducts = await Promise.all(
          sellerIds.map(async (sellerId) => {
              const products = await Product.find({ seller: sellerId })
                  .sort({ createdAt: -1 })
                  .lean();

              return {
                  seller_id: sellerId,
                  products: products.map(product => ({
                      product_id: product._id,
                      product_name: product.productName,
                      product_image: product.image,
                      price: product.price,
                      created_at: product.createdAt,
                  })),
              };
          })
      );

      res.status(200).json({
          status: true,
          data: latestProducts,
      });
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

module.exports = router;
