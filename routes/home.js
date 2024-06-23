const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const Seller = require("../models/seller");
const User = require("../models/user.js");
const { isAuth } = require("../middlewares/isAuth");

// 取得熱門商品
router.get("/popular-products", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 0; // 默認為 0，即返回所有資料

    const productsQuery = Product.aggregate([
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
          _id: 0,
          products_id: "$_id",
          products_name: "$productName",
          products_images: { $arrayElemAt: ["$image", 0] },
          seller_name: { $ifNull: ["$seller.brand", "Unknown"] },
          // 取得第一個 format 的價格
          price: {
            $cond: {
              if: { $gt: [{ $size: "$format" }, 0] },
              then: { $arrayElemAt: ["$format.price", 0] },
              else: null,
            },
          },
          total_sales: "$sold",
          // 根據 tags 返回對應的優惠券陣列
          discount: {
            $cond: {
              if: { $isArray: "$tags" },
              then: {
                $map: {
                  input: "$tags",
                  as: "tag",
                  in: {
                    $cond: {
                      if: { $eq: ["$$tag", 0] },
                      then: "免運券",
                      else: {
                        $cond: {
                          if: { $eq: ["$$tag", 1] },
                          then: "折抵券",
                          else: null,
                        },
                      },
                    },
                  },
                },
              },
              else: [],
            },
          },
          // 計算平均評分
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
      ...(limit > 0 ? [{ $limit: limit }] : []), // 如果 limit 大於 0，添加 $limit 階段
    ]);

    const [products, totalCount] = await Promise.all([
      productsQuery,
      Product.countDocuments({ isOnshelf: true }),
    ]);

    const totalDatas = limit > 0 ? Math.min(limit, totalCount) : totalCount;

    res.status(200).json({
      status: true,
      total_datas: totalDatas,
      data: products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 取得推薦商家
router.get("/recommend-shop", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0; // 從請求參數中取得限制數量，預設為0（撈所有資料）

    // 隨機排序並取得賣家資料
    const sellers = await Seller.aggregate([
      { $sample: { size: limit > 0 ? limit : await Seller.countDocuments() } }, // 隨機選取指定數量的文件
      { $project: { bossName: 1, brand: 1, avatar: 1, star: 1, total_comments: 1 } } // 選取需要的欄位
    ]);

    // 查詢每個賣家的商品圖片
    const formattedSellers = await Promise.all(sellers.map(async (seller) => {
      const products = await Product.find({ sellerOwned: seller._id })
        .select('image')
        .limit(3)
        .lean();

      const product_images = products.map(product => product.image[0]).filter(Boolean);

      return {
        seller_id: seller._id,
        shop_name: seller.brand,
        shop_image: seller.avatar,
        product_images: product_images, // 取出最多三個不同商品的第一張圖片
        // TODO:star跟 total_comments要從review取資料去算
        star: seller.star || 0,
        total_comments: seller.total_comments || 0,
      };
    }));

    res.status(200).json({
      status: true,
      total_datas: formattedSellers.length, // 回傳資料總數
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
        select: "brand avatar",
        model: Seller,
      })
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // 獲取追蹤商家的總數
    const total_likeShops = user.likeShop.length;
    
    // 格式化商家資料並取得商品圖片
    const formattedData = await Promise.all(user.likeShop.map(async (seller) => {
      const products = await Product.find({ sellerOwned: seller._id })
        .select("image")
        .lean()
        .limit(3); // 取出最多三個商品

      const productImages = products.map(product => product.image[0]).filter(Boolean); // 取出每個商品的第一張圖片


      return {
        seller_id: seller._id,
        shop_name: seller.brand,
        shop_image: seller.avatar,
        product_images: productImages,
      };
    }));

    res.status(200).json({
      status: true,
      total_datas: total_likeShops,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 取得會員關注商家的最新商品
router.get('/latest-products', async (req, res) => {
  try {
    // 從 query 參數中取得 limit 值，若無提供則默認為 10
    const limit = parseInt(req.query.limit) || 10;

    // 查詢最新上架且 isOnshelf 為 true 的商品，並根據 createdAt 進行排序，限制結果數量為 limit
    const products = await Product.find({ isOnshelf: true })
      .populate({
        path: 'sellerOwned',
        select: 'bossName brand avatar star',
        model: Seller,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    // 格式化商品資料
    const formattedData = products.map(product => {
      const discount = [];
      if (product.tags && Array.isArray(product.tags)) {
        if (product.tags.includes(0)) {
          discount.push("免運券");
        }
        if (product.tags.includes(1)) {
          discount.push("折抵券");
        }
      }
      return {
        product_id: product._id,
        product_name: product.productName,
        product_image: product.image && product.image.length > 0 ? product.image[0] : '', // 假設 image 是一個數組，取第一張圖片，若無則設為空字串
        shop_name: product.sellerOwned ? product.sellerOwned.brand : '',
        price: product.format && product.format.length > 0 ? product.format[0].price : 0, // 假設 format 是一個數組，取第一個格式的價格
        total_sales: product.sold || 0,
        discount: discount.length > 0 ? discount : null,
        star: product.reviews.length > 0
          ? calculateAverageRating(product.reviews)
          : 0,
      }
    });

    res.status(200).json({
      status: true,
      total_datas: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
