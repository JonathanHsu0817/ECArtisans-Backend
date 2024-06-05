const Cart = require('../models/cart');
const Product = require('../models/product');
const appError = require('../service/appError');

const carts = {
	async addToCart(req, res) {
		try {
			const { userId, productId, formatId, quantity } = req.body;

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

			res
				.status(200)
				.json({ message: '成功添加到購物車啦 ( ﾉ>ω<)ﾉ', cart: updatedCart });
		} catch (error) {
			res.status(500).json({ message: 'Internal Server Error' });
		}
	},
};

module.exports = carts;
