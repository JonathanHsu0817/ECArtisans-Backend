const Order = require('../models/order');
const Cart = require('../models/cart');
const User = require('../models/user');
const Seller = require('../models/seller');
const appError = require('../utils/appError');

const order = {
	async createOrder(req, res) {
		try {
			const userId = req.user._id;
			const cart = await Cart.findOne({ user: userId }).populate({
				path: 'items.product',
				select: 'productName price sellerOwned',
			});

			if (!cart || cart.items.length === 0) {
				return appError(400, '購物車為空的，無法創建訂單 ( ˘•ω•˘ )', next);
			}

			const sellerId = cart.items[0].product.sellerOwned;

			const orderItems = cart.items.map((item) => ({
				product: item.product._id,
				format: item.format,
				quantity: item.quantity,
				price: item.price,
			}));

			const totalPrice = cart.totalPrice;

			//支付方式
			const { pay } = req.body;

			// 創建訂單
			const newOrder = await Order.create({
				user: userId,
				seller: sellerId,
				products: orderItems,
				state: 0, // 未付
				totalPrice,
				pay,
			});

			// 更新用戶的訂單列表
			await User.findByIdAndUpdate(userId, {
				$push: { orders: newOrder._id },
			});

			// 更新賣家的訂單列表
			await Seller.findByIdAndUpdate(sellerId, {
				$push: { orders: newOrder._id },
			});

			// 清空購物車
			cart.items = [];
			cart.totalPrice = 0;
			await cart.save();

			res.status(201).json({
				status: true,
				message: '訂單創立成功 ( ﾉ>ω<)ﾉ',
				order: newOrder,
			});
		} catch (err) {
			res.status(500).json({
				status: false,
				message: '出現錯誤捏，再重新試一次看看 ( ˘•ω•˘ )',
			});
		}
	},
};

module.exports = order;
