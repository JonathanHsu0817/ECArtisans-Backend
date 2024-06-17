const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // 加密套件
const jwt = require('jsonwebtoken');
const Seller = require('../models/seller.js');
const Product = require('../models/product');

// 取得所有賣家
router.get('/', async (req, res, next) => {
  const headers = {
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, Content-Length, X-Requested-With',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
    'Content-Type': 'application/json',
  };
  try {
    const sellers = await Seller.find();
    res.writeHead(200, headers);
    res.write(
      JSON.stringify({
        status: 'success',
        sellers,
      }),
    );
    res.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: 'error',
      message: 'server error',
    });
  }
});

// 取得單個賣家詳情
router.get('/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;

    // 查詢單個賣家詳情
    const seller = await Seller.findById(sellerId).lean();

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // 格式化賣家資料
    // TODO:差一個欄位seller_info_date
    const formattedData = {
      seller_id: seller._id,
      activies_img: seller.activity,
      seller_image: seller.avatar,
      seller_name: seller.brand,
      seller_info: seller.introduce,
      discount:
        seller.discount && seller.discount.length > 0 ? seller.discount[0] : '',
    };

    res.status(200).json({
      status: true,
      data: [formattedData],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:sellerId/products', async (req, res) => {
  try {
    const { sellerId } = req.params;

    // 查詢屬於該賣家的所有商品
    const products = await Product.find({
      sellerOwned: sellerId,
      isOnshelf: true,
    })
      .populate({
        path: 'sellerOwned',
        select: 'brand',
        model: Seller,
      })
      .lean();

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No products found' });
    }

    // 格式化商品資料
    const formattedData = products.map((product) => ({
      products_id: product._id,
      products_name: product.productName,
      products_images: product.image[0],
      seller_name: product.sellerOwned.brand,
      price: product.price,
      total_sales: product.sold,
      discount: product.tags.includes(0) ? '免運券' : '',
      star:
        product.reviews.length > 0
          ? calculateAverageRating(product.reviews)
          : 0,
    }));

    res.status(200).json({
      status: true,
      data: formattedData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
