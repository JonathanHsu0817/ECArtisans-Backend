const Order = require('../../models/order');
const Cart = require('../../models/cart');
const User = require('../../models/user');
const Seller = require('../../models/seller');
const Review = require('../../models/review');
const Product = require('../../models/product');
const Coupon = require('../../models/coupon');
const appError = require('../../service/appError');
const mongoose = require('mongoose');

const order = {
	async createOrder(req, res) {
		try {
			const userId = req.user._id;
			const { selectedItems, address, delivery, pay, fare, couponId } =
				req.body;

			if (
				!selectedItems ||
				!Array.isArray(selectedItems) ||
				selectedItems.length === 0
			) {
				return next(appError(400, '無效的選擇項目 ( ˘•ω•˘ )'));
			}

			if (!address || !delivery || !pay || !fare) {
				return next(appError(400, '地址、配送方式、支付方式和運費不能為空'));
			}

			const cart = await Cart.findOne({ user: userId }).populate({
				path: 'items.product',
				select: 'productName price sellerOwned fare pay',
			});

			if (!cart || cart.items.length === 0) {
				return next(appError(400, '購物車為空的，無法創建訂單 ( ˘•ω•˘ )'));
			}

			// 驗證並過濾
			const orderItems = [];
			let sellerId = '';
			let totalPrice = 0;

			for (const item of selectedItems) {
				const cartItem = cart.items.find(
					(cartItem) =>
						cartItem.product._id.toString() === item.productId &&
						cartItem.format._id.toString() === item.formatId
				);

				if (!cartItem) {
					return next(appError(400, '選定的商品在購物車中不存在 ( ˘•ω•˘ )'));
				}

				if (sellerId && sellerId !== cartItem.product.sellerOwned.toString()) {
					return next(appError(400, '選定的商品必須屬於同一商家 ( ˘•ω•˘ )'));
				}

				sellerId = cartItem.product.sellerOwned.toString();

				orderItems.push({
					product: cartItem.product._id,
					format: cartItem.format,
					quantity: cartItem.quantity,
					price: cartItem.price,
				});

				totalPrice += cartItem.price;
			}

			let discountAmount = 0;
			if (couponId) {
				const coupon = await Coupon.findOne({ _id: couponId, user: userId });

				if (
					!coupon ||
					!coupon.isEnabled ||
					(coupon.endDate && coupon.endDate < Date.now())
				) {
					return next(appError(400, '无效的优惠券ID'));
				}

				// 检查优惠券是否适用于所选商品
				const applicableItems = orderItems.filter((item) =>
					coupon.productChoose.includes(item.product.toString())
				);

				if (applicableItems.length === 0) {
					return next(appError(400, '优惠券不适用于选定的商品'));
				}

				// 计算折扣金额
				discountAmount =
					coupon.type === 1 ? (coupon.percentage * totalPrice) / 100 : 0;
				totalPrice -= discountAmount;

				if (totalPrice < 0) totalPrice = 0; // 确保总价不小于零
			}

			// 創建訂單
			const newOrder = await Order.create({
				user: userId,
				seller: sellerId,
				products: orderItems,
				state: 0, // 未付
				totalPrice,
				pay,
				address,
				delivery,
				fare,
			});

			// 更新用戶的訂單列表
			await User.findByIdAndUpdate(userId, {
				$push: { spHistory: newOrder._id },
			});

			// 更新賣家的訂單列表
			await Seller.findByIdAndUpdate(sellerId, {
				$push: { order: newOrder._id },
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
			console.log(err);
			res.status(500).json({
				status: false,
				message: '出現錯誤捏，再重新試一次看看 ( ˘•ω•˘ )',
			});
		}
	},

	async getOrders(req, res) {
		try {
			const userId = req.user._id;

			const orders = await Order.find({ user: userId })
				.populate('products.product', 'name price')
				.populate('seller', 'name')
				.exec();

			if (!orders || orders.length === 0) {
				return res.status(404).json({
					status: false,
					message: '沒有找到訂單記錄',
				});
			}

			res.status(200).json({
				status: true,
				message: '訂單記錄獲取成功',
				orders: orders,
			});
		} catch (err) {
			console.log(err);
			res.status(500).json({
				status: false,
				message: '服務器錯誤，請稍後再試',
				error: err.message,
			});
		}
	},
	async getSpecificOrder(req, res) {
		try {
			const orderId = req.params.orderId;

			// 檢查訂單ID是否輸入正確
			if (!mongoose.isValidObjectId(orderId)) {
				return res.status(400).json({
					status: false,
					message: '訂單ID輸入錯誤或無效的ID格式',
				});
			}

			// 查詢訂單詳情
			const order = await Order.findById(orderId)
				.populate('products.product', 'name price description')
				.populate('seller', 'name contactInfo')
				.exec();

			if (!order || order.length === 0) {
				return res.status(404).json({
					status: false,
					message: '訂單不存在',
				});
			}

			res.status(200).json({
				status: true,
				message: '訂單詳情獲取成功',
				order: order,
			});
		} catch (err) {
			console.log(err);
			res.status(500).json({
				status: false,
				message: '服務器錯誤，請稍後再試',
				error: err.message,
			});
		}
	},

	async getSellerOrders(req, res) {
		try {
			const sellerId = req.user._id;
			const orders = await Seller.find({ _id: sellerId })
				.populate(
					'order',
					'_id totalPrice state products.format.image createdAt updatedAt'
				)
				.select({ order: 1, _id: 0 });
			res.status(200).json({
				status: 'success',
				message: '訂單查詢成功',
				orders,
			});
		} catch (err) {
			res.status(500).json({
				status: false,
				message: '伺服器錯誤，請稍後再試',
			});
		}
	},

	async getSellerOrderDetail(req, res) {
		try {
			const orderId = req.params.orderId;
			if (!orderId || !mongoose.isValidObjectId(orderId)) {
				return res.status(400).json({
					status: false,
					message: '訂單id輸入錯誤',
				});
			}
			const order = await Order.findOne({ _id: orderId })
				.populate('user', '_id')
				.populate('products');
			if (!order) {
				return res.status(404).json({
					status: false,
					message: '訂單不存在',
				});
			}
			res.status(200).json({
				status: true,
				message: '訂單詳情獲取成功',
				order: order,
			});
		} catch (err) {
			res.status(500).json({
				status: false,
				message: '伺服器錯誤，請稍後再試',
			});
		}
	},

	async createReview(req, res) {
		const { orderId, productId } = req.params;
		const { rate } = req.body;
		const userId = req.user._id;

		try {
			// 檢查訂單是否存在且屬於該用戶
			const order = await Order.findOne({ _id: orderId, user: userId });
			if (!order) {
				return res.status(404).send({ message: '訂單不存在或不屬於該用戶' });
			}

			// 檢查訂單中是否存在該商品
			const productEntry = order.products.find(
				(p) => p.product.toString() === productId
			);
			if (!productEntry) {
				return res.status(404).send({ message: '訂單中不存在該商品' });
			}

			// 檢查是否已經評價過
			if (productEntry.review) {
				return res.status(400).send({ message: '此商品已評價過' });
			}

			// 創建評價並保存
			const review = new Review({
				userID: userId,
				rate: rate,
			});
			await review.save();

			// 更新訂單中商品的評價
			productEntry.review = review._id;
			await order.save();

			// 同步更新商品的評價
			await Product.findByIdAndUpdate(
				productId,
				{
					$push: { reviews: review._id },
				},
				{ new: true }
			);

			res.status(201).send({ message: '評價成功🏅', reviewId: review._id });
		} catch (error) {
			res.status(500).send({ message: '伺服器錯誤' });
		}
	},
};

module.exports = order;
