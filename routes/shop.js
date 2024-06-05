let express = require('express');
let router = express.Router();
const shopControllers = require('../controllers/shopControllers.js');

const Seller = require('../models/seller.js');
const Order = require('../models/order.js');

const { isAuth, restriction } = require('../middlewares/isAuth.js'); //將Auth驗證放到middleware 如果有其他地方需要可以共用

const bcrypt = require('bcrypt'); //加密套件

//商家導覽
router.get('/:seller_id/home', async (req, res, next) => {
	const headers = {
		'Access-Control-Allow-Headers':
			'Content-Type, Authorization, Content-Length, X-Requested-With',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
		'Content-Type': 'application/json',
	};
	try {
		const seller = req.params.seller_id;
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
router.get('/:seller_id/information', async (req, res, next) => {
	const headers = {
		'Access-Control-Allow-Headers':
			'Content-Type, Authorization, Content-Length, X-Requested-With',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
		'Content-Type': 'application/json',
	};
	try {
		const seller = req.params.seller_id;
		const thisShop = await Seller.findOne({ _id: seller }).select({
			chat: 0,
			product: 0,
			order: 0,
			activity: 0,
			discount: 0,
			member: 0,
			introduce: 0,
			plan: 0,
			salesType: 0,
		});
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
router.put('/:seller_id/information', async (req, res, next) => {
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

	const sellerId = req.params.seller_id;

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
router.get('/:seller_id/orders', async (req, res, next) => {
	const headers = {
		'Access-Control-Allow-Headers':
			'Content-Type, Authorization, Content-Length, X-Requested-With',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
		'Content-Type': 'application/json',
	};
	try {
		const seller = req.params.seller_id;
		const thisShop = await Seller.find({ _id: seller })
			.populate('order')
			.select({ order: 1, _id: 0 });
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

//商品資訊
router.get(
	'/:seller_id/products/all',
	isAuth,
	restriction('seller'),
	shopControllers.products.getProductsAll
);
router.get(
	'/:seller_id/products',
	isAuth,
	restriction('seller'),
	shopControllers.products.getProducts
);
router.get(
	'/:seller_id/product/:product_id',
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
router.delete(
	'/:seller_id/product/:product_id',
	isAuth,
	restriction('seller'),
	shopControllers.products.deleteProduct
);

//折價券資訊
router.get(
	'/:seller_id/coupons',
	isAuth,
	restriction('seller'),
	shopControllers.coupons.getCoupons
);
router.get(
	'/:seller_id/coupon/:coupon_id',
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
	'/:seller_id/coupon/:coupon_id',
	isAuth,
	restriction('seller'),
	shopControllers.coupons.deleteCoupon
);

module.exports = router;
