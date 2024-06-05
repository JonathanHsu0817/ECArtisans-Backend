const Products = require('../models/product');
const Coupons = require('../models/coupon');
const Seller = require('../models/seller');

const appError = require('../service/appError');

//商品相關
const products = {
	async getProductsAll(req, res) {
		const sellerID = req.params.seller_id;
		const allProducts = await Products.find({
			sellerOwned: sellerID,
		}).populate({
			path: 'sellerOwned',
			select: 'brand product',
		});
		res.status(200).json({
			status: true,
			message: '商品抓出來啦~ ( ﾉ>ω<)ﾉ',
			products: allProducts,
		});
	},
	async getProducts(req, res) {
		try {
			const sellerID = req.params.seller_id;
			const page = parseInt(req.query.page, 10) || 1;
			const qty = parseInt(req.query.qty, 12) || 12;
			const category = req.query.category; //指定自訂分類

			let query = { sellerOwned: sellerID };
			if (category) {
				query.category = category; //附加搜尋條件
			}

			const skip = (page - 1) * qty;
			const totalProducts = await Products.countDocuments({
				sellerOwned: sellerID,
			});
			const totalPages = Math.ceil(totalProducts / qty);

			const products = await Products.find(query)
				.skip(skip)
				.limit(qty)
				.populate({
					path: 'sellerOwned',
					select: 'brand discount',
				});

			const pagination = {
				totalPages: totalPages,
				currentPage: page,
				hasPrev: page > 1,
				hasNext: page < totalPages,
			};

			res.status(200).json({
				status: true,
				message: '商品抓出來啦~ ( ﾉ>ω<)ﾉ',
				products: products,
				pagination: pagination,
			});
		} catch (err) {
			return res.status(404).json({
				status: false,
				message: '找不到此商品 ( ˘•ω•˘ )',
			});
		}
	},
	async getProduct(req, res) {
		const sellerID = req.params.seller_id;
		const productID = req.params.product_id;
		const thisProduct = await Products.find({
			_id: productID,
			sellerOwned: sellerID,
		}).populate({
			path: 'sellerOwned',
			select: 'brand product',
		});

		if (!thisProduct) {
			return appError(404, '找不到此商品 ( ˘•ω•˘ )', next);
		}

		res.status(200).json({
			status: true,
			message: '商品抓出來啦~ ( ﾉ>ω<)ﾉ',
			products: thisProduct,
		});
	},
	async createProduct(req, res) {
		try {
			const sellerOwned = req.user._id;

			const {
				productName,
				sellerCategory,
				category,
				origin,
				ingredient,
				format,
				introduction,
				production,
				isOnShelf,
				fare,
				pay,
				keyword,
				image,
			} = req.body;

			if (req.body) {
				const newProduct = await Products.create({
					sellerOwned,
					productName,
					sellerCategory,
					category,
					origin,
					ingredient,
					format,
					introduction,
					production,
					isOnShelf,
					fare,
					pay,
					keyword,
					image,
				});
				// 更新賣家的產品列表
				await Seller.findByIdAndUpdate(sellerOwned, {
					$push: { product: newProduct._id },
				});
				res.status(200).json({
					status: true,
					message: '建立好商品啦~ ( ﾉ>ω<)ﾉ',
					products: newProduct,
				});
			}
		} catch (err) {
			return res.status(500).json({
				status: false,
				message: '建立商品失敗呢 ( ˘•ω•˘ )',
			});
		}
	},
	async updateProduct(req, res) {
		try {
			const productID = req.params.product_id;
			const sellerOwned = req.user._id;
			//console.log(sellerOwned);
			const {
				productName,
				sellerCategory,
				category,
				origin,
				ingredient,
				format,
				introduction,
				production,
				isOnShelf,
				fare,
				pay,
				keyword,
				image,
			} = req.body;

			if (req.body) {
				const updatedProduct = await Products.findByIdAndUpdate(productID, {
					sellerOwned,
					productName,
					sellerCategory,
					category,
					origin,
					ingredient,
					format,
					introduction,
					production,
					isOnShelf,
					fare,
					pay,
					keyword,
					image,
				});

				if (!updatedProduct) {
					return appError(404, '更新商品失敗了 ( ˘•ω•˘ )', next);
				}

				res.status(200).json({
					status: true,
					message: '更新好商品啦~ ( ﾉ>ω<)ﾉ',
					products: newProduct,
				});
			}
		} catch (err) {
			return res.status(500).json({
				status: false,
				message: '更新商品失敗了 ( ˘•ω•˘ )',
			});
		}
	},
	async deleteProduct(req, res) {
		const { seller_id, product_id } = req.params;
		try {
			const product = await Product.findOne({
				_id: product_id,
				sellerOwned: seller_id,
			});
			if (!product) {
				return appError(
					404,
					'此商品沒被找到或您無權刪除此商品喔 ( ˘•ω•˘ )',
					next
				);
			}

			await Products.deleteOne({ _id: product_id });

			await Seller.findByIdAndUpdate(seller_id, {
				$pull: { product: product_id },
			});

			res.status(200).json({
				status: true,
				message: '此商品成功被刪除啦 ( ﾉ>ω<)ﾉ',
			});
		} catch (error) {
			console.error(error);
			res.status(500).json({
				status: false,
				message: '刪除失敗，請重新嘗試喔 ( ˘•ω•˘ ) ',
			});
		}
	},
};

//折價券相關
const coupons = {
	async getCoupons(req, res) {
		try {
			const sellerID = req.params.seller_id;
			const page = parseInt(req.query.page, 10) || 1;
			const qty = parseInt(req.query.qty, 12) || 12;

			let query = { seller: sellerID };

			const skip = (page - 1) * qty;
			const totalCoupons = await Coupons.countDocuments({
				seller: sellerID,
			});
			const totalPages = Math.ceil(totalCoupons / qty);

			const coupons = await Coupons.find(query).skip(skip).limit(qty).populate({
				path: 'seller',
				select: 'brand discount',
			});

			const pagination = {
				totalPages: totalPages,
				currentPage: page,
				hasPrev: page > 1,
				hasNext: page < totalPages,
			};

			res.status(200).json({
				status: true,
				message: '折價券抓出來啦 ( ﾉ>ω<)ﾉ',
				Coupons: coupons,
				pagination: pagination,
			});
		} catch (err) {
			res.status(500).json({
				status: false,
				message: '折價券抓取失敗，請重新嘗試喔 ( ˘•ω•˘ ) ',
			});
		}
	},
	async getCoupon(req, res) {
		const sellerID = req.params.seller_id;
		const couponID = req.params.coupon_id;
		const thisCoupon = await Coupons.find({
			_id: couponID,
			seller: sellerID,
		}).populate({
			path: 'seller',
			select: 'brand coupon',
		});

		if (!thisCoupon) {
			return appError(404, '找不到此折價券，請在嘗試一次 ( ˘•ω•˘ )', next);
		}

		res.status(200).json({
			status: true,
			message: '折價券抓出來啦 ( ﾉ>ω<)ﾉ',
			Coupons: thisCoupon,
		});
	},
	async createCoupon(req, res) {
		try {
			const seller = req.user._id;
			const {
				couponName,
				startDate,
				endDate,
				type,
				discountConditions,
				percentage,
				discountScope,
				isEnabled,
			} = req.body;

			const newCoupon = await Coupons.create({
				couponName,
				startDate,
				endDate,
				type,
				discountConditions,
				percentage,
				discountScope,
				isEnabled,
				seller,
			});
			// 更新卖家的折价券列表
			await Seller.findByIdAndUpdate(seller, {
				$push: { discount: newCoupon._id },
			});
			res.status(200).json({
				status: true,
				message: '折價券建立成功啦 ( ﾉ>ω<)ﾉ',
				Coupons: thisCoupon,
			});
		} catch (err) {
			return res.status(500).json({
				status: false,
				message: '折價券建立失敗，請在嘗試一次 ( ˘•ω•˘ )',
			});
		}
	},
	async updateCoupon(req, res) {
		try {
			const couponID = req.params.coupon_id;
			const seller = req.user._id;
			const {
				couponName,
				startDate,
				endDate,
				type,
				discountConditions,
				percentage,
				discountScope,
				isEnabled,
			} = req.body;

			const updatedCoupon = await Coupons.findByIdAndUpdate(couponID, {
				couponName,
				startDate,
				endDate,
				type,
				discountConditions,
				percentage,
				discountScope,
				isEnabled,
				seller,
			});

			if (!updatedCoupon) {
				return appError(404, '找不到折價券，請再嘗試一次( ˘•ω•˘ )', next);
			}

			res.status(200).json({
				status: true,
				message: '折價券更新成功啦 ( ﾉ>ω<)ﾉ',
				Coupons: updatedCoupon,
			});
		} catch (err) {
			return res.status(500).json({
				status: false,
				message: '找不到折價券，請再嘗試一次( ˘•ω•˘ )',
			});
		}
	},
	async deleteCoupon(req, res) {
		const { seller_id, coupon_id } = req.params;
		try {
			const coupon = await coupon.findOne({
				_id: coupon_id,
				sellerOwned: seller_id,
			});
			if (!coupon) {
				return appError(
					404,
					'此折價券沒被找到或您無權刪除此折價券喔 ( ˘•ω•˘ )',
					next
				);
			}

			await Coupon.deleteOne({ _id: coupon_id });

			await Seller.findByIdAndUpdate(seller_id, {
				$pull: { product: product_id },
			});

			res.status(200).json({
				status: true,
				message: '此折價券成功被刪除啦 ( ﾉ>ω<)ﾉ',
			});
		} catch (error) {
			console.error(error);
			res.status(500).json({
				status: false,
				message: '刪除失敗，請重新嘗試喔 ( ˘•ω•˘ )',
			});
		}
	},
};

module.exports = {
	products,
	coupons,
};
