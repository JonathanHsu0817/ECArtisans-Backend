const express = require("express");
const router = express.Router();
const PopularProduct = require("../models/popularProduct"); 
const RecommendShop = require("../models/recommendShop"); 



// 取得熱門商品
router.get("/popular-products", async (req, res) => {
  try {
    // 根據 total_sales 進行排序，並限制返回前 10 個商品
    const popularProducts = await PopularProduct.find()
      .sort({ total_sales: -1 }) // 根據 total_sales 欄位降序排序
      .limit(10);
    res.status(200).json(popularProducts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// 取得推薦商家
router.get("/recommend-shop", async (req, res) => {
  try {
    // 根據 star 欄位進行排序，並限制返回前 10 個商家
    const recommendShops = await RecommendShop.find()
      .sort({ star: -1 }) // 根據 star 欄位降序排序
      .limit(10);
    res.status(200).json(recommendShops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;
