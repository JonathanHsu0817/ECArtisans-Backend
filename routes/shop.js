let express = require('express');
let router = express.Router();
const shopControllers = require('../controllers/seller/shopControllers.js');

const Seller = require('../models/seller.js');
const Order = require('../models/order.js');
const Activities = require('../models/activity');

const { isAuth, restriction } = require('../middlewares/isAuth.js'); //將Auth驗證放到middleware 如果有其他地方需要可以共用

const bcrypt = require('bcrypt'); //加密套件
const orderController = require('../controllers/user/orderControllers');

//商家導覽
router.get('/home', isAuth, async (req, res, next) => {
	try {
		const sellerId = req.user._id;
		const thisShop = await Seller.findOne({ _id: seller });
		res.writeHead(200, headers);
		res.write(
			JSON.stringify({
				status: 'success',
				thisShop,
			})
		);
		res.end();
	} catch (err) {
		res.writeHead(500, headers);
		res.end(
			JSON.stringify({
				status: 'error',
				message: 'Internal Server Error',
			})
		);
	}
});

//商家資訊
router.get('/information', isAuth, async (req, res, next) => {
	try {
		const sellerId = req.user._id;
		const thisShop = await Seller.findById(sellerId).select({
			bossName: 1,
			gender: 1,
			phone: 1,
			mail: 1,
			brand: 1,
			avatar: 1,
			planPeriod: 1,
			address: 1,
			collection: 1,
			salesType: 1,
		});

		if (!thisShop) {
			return res.status(404).json({
				status: 'error',
				message: '未找到賣家信息',
			});
		}

		res.status(200).json({
			status: 'success',
			thisShop,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({
			status: 'error',
			message: 'Internal Server Error',
		});
	}
});

//修改商家資訊
router.put('/information', isAuth, async (req, res, next) => {
	const sellerId = req.user._id;
	const {
		bossName,
		gender,
		brand,
		phone,
		address,
		password,
		otherPassword,
		collection,
		salesType,
		introduce,
		avatar,
	} = req.body;

	const updateData = {
		bossName,
		gender,
		brand,
		phone,
		address,
		password,
		otherPassword,
		collection,
		salesType,
		introduce,
		avatar,
	};

	if (req.body.password) {
		const hashedPassword = await bcrypt.hash(req.body.password, 12);
		updateData.password = hashedPassword;
	}

	try {
		const updateUser = await Seller.findByIdAndUpdate(
			sellerId,
			{ $set: updateData },
			{ new: true }
		);

		if (!updateUser) {
			return next(appError(404, '沒有找到該賣家', next));
		}

		// 建議再加其他的middleware  像是沒有加入圖片、前後資料少帶之類的

		res.status(200).json({
			status: 'success',
			message: '成功修改資料',
			data: updateUser,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ status: 'error', message: 'Internal Server Error' });
	}
});

//訂單管理
// router.get('/:seller_id/orders', async (req, res, next) => {
// 	const headers = {
// 		'Access-Control-Allow-Headers':
// 			'Content-Type, Authorization, Content-Length, X-Requested-With',
// 		'Access-Control-Allow-Origin': '*',
// 		'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
// 		'Content-Type': 'application/json',
// 	};
// 	try {
// 		const seller = req.params.seller_id;
// 		const thisShop = await Seller.find({ _id: seller })
// 			.populate('order')
// 			.select({ order: 1, _id: 0 });
// 		res.writeHead(200, headers);
// 		res.write(
// 			JSON.stringify({
// 				status: 'success',
// 				thisShop,
// 			})
// 		);
// 		res.end();
// 	} catch (err) {
// 		res.writeHead(500, headers);
// 		res.end(
// 			JSON.stringify({
// 				status: 'error',
// 				message: 'Internal Server Error',
// 			})
// 		);
// 	}
// });

//賣家查詢所有訂單紀錄
router.get('/orders', isAuth, orderController.getSellerOrders);

//賣家查詢單一訂單詳情
router.get('/order/:orderId', isAuth, orderController.getSellerOrderDetail);

//商品資訊
router.get(
	'/products/all',
	isAuth,
	restriction('seller'),
	shopControllers.products.getProductsAll
);
router.get(
	'/products',
	isAuth,
	restriction('seller'),
	shopControllers.products.getProducts
);
router.get(
	'/product/:product_id',
	isAuth,
	restriction('seller'),
	shopControllers.products.getProduct
);
router.post(
	'/product',
	isAuth,
	restriction('seller'),
	shopControllers.products.createProduct
);
router.put(
	'/product/:product_id',
	isAuth,
	restriction('seller'),
	shopControllers.products.updateProduct
);
router.patch(
	'/product/:product_id',
	isAuth,
	restriction('seller', shopControllers.products.updateProductStatus)
);
router.delete(
	'/product/:product_id',
	isAuth,
	restriction('seller'),
	shopControllers.products.deleteProduct
);

//折價券資訊
router.get(
	'/coupons/all',
	isAuth,
	restriction('seller'),
	shopControllers.coupons.getCouponsAll
);
router.get(
	'/coupons',
	isAuth,
	restriction('seller'),
	shopControllers.coupons.getCoupons
);
router.get(
	'/coupon/:coupon_id',
	isAuth,
	restriction('seller'),
	shopControllers.coupons.getCoupon
);
router.post(
	'/coupon',
	isAuth,
	restriction('seller'),
	shopControllers.coupons.createCoupon
);
router.put(
	'/coupon/:coupon_id',
	isAuth,
	restriction('seller'),
	shopControllers.coupons.updateCoupon
);
router.delete(
	'/coupon/:coupon_id',
	isAuth,
	restriction('seller'),
	shopControllers.coupons.deleteCoupon
);

// 活動管理

// 賣家後台取得所有活動
router.get('/activities', isAuth, restriction('seller'), async (req, res) => {
	// 單頁資料筆數預設為5
	const { limit = 5 } = req.query;

	try {
		const activities = await Activities.find({ seller_id: req.user._id }).limit(
			parseInt(limit)
		);

		const total_data = await Activities.countDocuments({
			seller_id: req.user._id,
		});

		// 格式化活動資料為所需格式
		const formattedActivities = activities.map((activity) => ({
			activity_id: activity._id,
			activity_name: activity.activity_name,
			activity_image: activity.activity_image,
			start_date: activity.start_date,
			end_date: activity.end_date,
		}));

		res.status(200).json({
			limit: parseInt(limit),
			total: total_data,
			data: formattedActivities,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

// 賣家後台取得單一活動
router.get(
	'/activities/:id',
	isAuth,
	restriction('seller'),
	async (req, res) => {
		try {
			const activity = await Activities.findOne({
				_id: req.params.id,
				seller_id: req.user._id,
			});

			if (!activity) {
				return res.status(404).json({ message: '查無資料' });
			}

			const formattedActivity = {
				activity_name: activity.activity_name,
				activity_image: activity.activity_image,
				start_date: activity.start_date,
				end_date: activity.end_date,
				activity_info: activity.activity_info,
				coupon_id: activity.coupon_id,
			};

			res.status(200).json(formattedActivity);
		} catch (error) {
			res.status(500).json({ message: error.message });
		}
	}
);

module.exports = router;
