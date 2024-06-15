const Order = require('../../models/order');
const Cart = require('../../models/cart');
const User = require('../../models/user');
const Seller = require('../../models/seller');
const appError = require('../../service/appError');

const order = {
	async createOrder(req, res) {
		try {
			const userId = req.user._id;
			const { selectedItems, address, delivery } = req.body;

			if (!address || !delivery) {
				return next(appError(400, '帳號密碼不能為空', next));
			}

			const cart = await Cart.findOne({ user: userId }).populate({
				path: 'items.product',
				select: 'productName price sellerOwned fare pay',
			});

			if (!cart || cart.items.length === 0) {
				return appError(400, '購物車為空的，無法創建訂單 ( ˘•ω•˘ )', next);
			}

			// 驗證並過濾
			const orderItems = [];
			let sellerId = cartItem.product.sellerOwned.toString();
			let totalPrice = 0;
			let payMethods = [1, 2, 3]; // 暫時默認全部支付方式

			selectedItems.forEach((item) => {
				const cartItem = cart.items.find(
					(cartItem) =>
						cartItem.product._id.toString() === item.productId &&
						cartItem.format._id.toString() === item.formatId
				);

				if (!cartItem) {
					return appError(400, '選定的商品在購物車中不存在 ( ˘•ω•˘ )', next);
				}

				orderItems.push({
					product: cartItem.product._id,
					format: cartItem.format,
					quantity: cartItem.quantity,
					price: cartItem.price,
				});

				totalPrice += cartItem.price;

				payMethods = payMethods.filter((method) =>
					cartItem.product.pay.includes(method)
				);
			});

			// 計算運費
			const fares = cart.items.map((item) => item.product.fare);
			const shippingFee = Math.max(...fares); // 取最高運費

			// 創建訂單
			const newOrder = await Order.create({
				user: userId,
				seller: sellerId,
				products: orderItems,
				state: 0, // 未付
				totalPrice,
				pay: payMethods,
				address,
				delivery,
				fare: shippingFee,
			});

			// 更新用戶的訂單列表
			await User.findByIdAndUpdate(userId, {
				$push: { orders: newOrder._id },
			});

			// 更新賣家的訂單列表
			await Seller.findByIdAndUpdate(sellerId, {
				$push: { orders: newOrder._id },
			});

			// 購物車移除已選的商品
			cart.items = cart.items.filter(
				(cartItem) =>
					!selectedItems.some(
						(item) =>
							item.productId === cartItem.product._id.toString() &&
							item.formatId === cartItem.format._id.toString()
					)
			);

			cart.totalPrice = cart.items.reduce(
				(total, item) => total + item.price,
				0
			);
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
