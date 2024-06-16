const Cart = require('../../models/cart');
const Product = require('../../models/product');
const appError = require('../../service/appError');

const cart = {
	async addToCart(req, res) {
		try {
			const userId = req.user._id;
			const { productId, formatId, quantity } = req.body;

			// 獲取產品及指定規格
			const product = await Product.findById(productId);
			if (!product) {
				return appError(404, '未找到指定產品 ( ˘•ω•˘ )', next);
			}

			const format = product.format.id(formatId);
			if (!format) {
				return appError(404, '未找到指定規格 ( ˘•ω•˘ )', next);
			}

			const price = format.price;

			// 查找用戶的購物車
			let cart = await Cart.findOne({ user: userId });

			if (!cart) {
				// 如果為空的則幫她新增
				cart = new Cart({ user: userId, items: [], totalPrice: 0 });
			}

			// 查找購物車是否有相同產品和同個規格
			const existingItem = cart.items.find(
				(item) =>
					item.product.toString() === productId &&
					item.format._id.toString() === formatId
			);

			if (existingItem) {
				// 如果存在就增加數量
				existingItem.quantity += quantity;
				existingItem.price = existingItem.quantity * price;
			} else {
				// 不存在則新增品項
				cart.items.push({
					product: productId,
					format: format,
					quantity: quantity,
					price: quantity * price,
				});
			}

			// 重新計算總價
			cart.totalPrice = cart.items.reduce(
				(total, item) => total + item.price,
				0
			);

			const updatedCart = await Cart.findOneAndUpdate(
				{ user: userId },
				cart,
				{ new: true, upsert: true } // `upsert` 此會再找不到就會創新的一個
			);

			res.status(200).json({
				status: true,
				message: '成功添加到購物車啦 ( ﾉ>ω<)ﾉ',
				cart: updatedCart,
			});
		} catch (error) {
			res.status(500).json({
				status: false,
				message: '出現錯誤捏，再試一次看看 ( ˘•ω•˘ )',
			});
		}
	},
	async getCart(req, res) {
		try {
			const userId = req.user._id;

			// 查找用戶的購物車
			const cart = await Cart.findOne({ user: userId }).populate({
				path: 'items.product',
				select: 'productName image price',
			});

			if (!cart) {
				return appError(404, '未找到购物车 ( ˘•ω•˘ )', next);
			}

			res.status(200).json({
				status: true,
				message: '成功获取购物车 ( ﾉ>ω<)ﾉ',
				cart: cart,
			});
		} catch (err) {
			res.status(500).json({
				status: false,
				message: '出現錯誤捏，再重新試一次看看 ( ˘•ω•˘ )',
			});
		}
	},
	async updateCart(req, res) {
		try {
			const userId = req.user._id;
			const { productId, formatId } = req.params;
			const { quantity } = req.body;

			const cart = await Cart.findOne({ user: userId });

			if (!cart) {
				return appError(404, '購物車為空 ( ˘•ω•˘ )', next);
			}

			// 查找購物車商品
			const item = cart.items.find(
				(item) =>
					item.product.toString() === productId &&
					item.format._id.toString() === formatId
			);

			if (!item) {
				return appError(404, '未找到指定的購物車項目 ( ˘•ω•˘ )', next);
			}

			// 更新商品數量及價格
			item.quantity = quantity;
			item.price = item.quantity * item.format.price;

			// 重新計算總價
			cart.totalPrice = cart.items.reduce(
				(total, item) => total + item.price,
				0
			);

			const updatedCart = await cart.save();

			res.status(200).json({
				status: true,
				message: '購物車商品更新成功 ( ﾉ>ω<)ﾉ',
				cart: updatedCart,
			});
		} catch (err) {
			res.status(500).json({
				status: false,
				message: '出現錯誤捏，再重新試一次看看 ( ˘•ω•˘ )',
			});
		}
	},
	async deleteCart(req, res) {
		try {
			const userId = req.user._id;
			const { productId, formatId } = req.params;

			const cart = await Cart.findOne({ user: userId });

			if (!cart) {
				return appError(404, '購物車為空的 ( ˘•ω•˘ )', next);
			}

			// 查找購物車商品
			const itemIndex = cart.items.findIndex(
				(item) =>
					item.product.toString() === productId &&
					item.format._id.toString() === formatId
			);

			if (itemIndex === -1) {
				return appError(404, '未找到指定的購物車商品 ( ˘•ω•˘ )', next);
			}

			// 移除商品
			cart.items.splice(itemIndex, 1);

			// 重新計算
			cart.totalPrice = cart.items.reduce(
				(total, item) => total + item.price,
				0
			);

			const updatedCart = await cart.save(); // 保存購物車

			res.status(200).json({
				status: true,
				message: '購物車商品删除成功 ( ﾉ>ω<)ﾉ',
				cart: updatedCart,
			});
		} catch (err) {
			res.status(500).json({
				status: false,
				message: '出現錯誤捏，再重新試一次看看 ( ˘•ω•˘ )',
			});
		}
	},
	async deleteCartAll(req, res) {
		try {
			const userId = req.user._id;

			const cart = await Cart.findOne({ user: userId });

			if (!cart) {
				return appError(404, '購物車为空 ( ˘•ω•˘ )', next);
			}

			// 清空購物中的所有商品
			cart.items = [];
			cart.totalPrice = 0;

			const updatedCart = await cart.save();

			res.status(200).json({
				status: true,
				message: '購物車已清空 ( ﾉ>ω<)ﾉ',
				cart: updatedCart,
			});
		} catch (err) {
			res.status(500).json({
				status: false,
				message: '出現錯誤捏，再重新試一次看看 ( ˘•ω•˘ )',
			});
		}
	},
};

module.exports = cart;
