const Products = require('../../models/product');
const Coupons = require('../../models/coupon');
const Seller = require('../../models/seller');

const appError = require('../../service/appError');

//商品相關
const products = {
	async getProductsAll(req, res) {
		const sellerID = req.user._id;
		const allProducts = await Products.find({
			sellerOwned: sellerID,
		}).populate({
			path: 'sellerOwned',
			select: 'brand',
		});
		res.status(200).json({
			status: true,
			message: '商品抓出來啦~ ( ﾉ>ω<)ﾉ',
			products: allProducts,
		});
	},
	async getProducts(req, res) {
		try {
			const sellerID = req.user._id;
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
					select: 'brand',
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
		const sellerID = req.user._id;
		const productID = req.params.product_id;
		const thisProduct = await Products.find({
			_id: productID,
			sellerOwned: sellerID,
		}).populate({
			path: 'sellerOwned',
			select: 'brand',
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

			const updatedFormats = format.map((format, index) => ({
				...format,
				image: image[index % image.length],
			}));

			if (req.body) {
				const newProduct = await Products.create({
					sellerOwned,
					productName,
					sellerCategory,
					category,
					origin,
					ingredient,
					format: updatedFormats,
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
				const updatedFormat = format.map((format, index) => ({
					...format,
					image: image[index % image.length],
				}));

				const updatedProduct = await Products.findByIdAndUpdate(
					productID,
					{
						sellerOwned,
						productName,
						sellerCategory,
						category,
						origin,
						ingredient,
						format: updatedFormat,
						introduction,
						production,
						isOnShelf,
						fare,
						pay,
						keyword,
						image,
					},
					{ new: true, runValidators: true }
				);

				if (!updatedProduct) {
					return appError(404, '更新商品失敗了 ( ˘•ω•˘ )', next);
				}

				res.status(200).json({
					status: true,
					message: '更新好商品啦~ ( ﾉ>ω<)ﾉ',
					products: updatedProduct,
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
		const productID = req.params.product_id;
		const sellerID = req.user._id;
		try {
			const product = await Products.findOne({
				_id: productID,
				sellerOwned: sellerID,
			});
			if (!product) {
				return appError(
					404,
					'此商品沒被找到或您無權刪除此商品喔 ( ˘•ω•˘ )',
					next
				);
			}
			await Products.deleteOne({ _id: productID });

			await Seller.findByIdAndUpdate(sellerID, {
				$pull: { product: productID },
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
	async getCouponsAll(req, res) {
		try {
			const sellerID = req.user._id;
			const allProducts = await Coupons.find({
				seller: sellerID,
			}).populate({
				path: 'seller',
				select: 'brand',
			});

			res.status(200).json({
				status: true,
				message: '折價券抓出來啦 ( ﾉ>ω<)ﾉ',
				Coupons: allProducts,
			});
		} catch (err) {
			res.status(500).json({
				status: false,
				message: '折價券抓取失敗，請重新嘗試喔 ( ˘•ω•˘ ) ',
			});
		}
	},
	async getCoupons(req, res) {
		try {
			const sellerID = req.user._id;
			const page = parseInt(req.query.page, 10) || 1;
			const qty = parseInt(req.query.qty, 12) || 12;

			let query = { seller: sellerID };

			//未啟用
			if (req.query.disabled === 'true') {
				query.isEnabled = false;
			} else if (req.query.disabled === 'false') {
				query.isEnabled = true;
			}

			//失效
			if (req.query.invalid === 'true') {
				query.endDate = { $lt: new Date() };
			} else if (req.query.invalid === 'false') {
				query.endDate = { $gte: new Date() };
			}

			const skip = (page - 1) * qty;
			const totalCoupons = await Coupons.countDocuments({
				seller: sellerID,
			});
			const totalPages = Math.ceil(totalCoupons / qty);

			const coupons = await Coupons.find(query).skip(skip).limit(qty).populate({
				path: 'seller',
				select: 'brand',
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
		const sellerID = req.user._id;
		const couponID = req.params.coupon_id;
		const thisCoupon = await Coupons.find({
			_id: couponID,
			seller: sellerID,
		}).populate({
			path: 'seller',
			select: 'brand',
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
				productType,
				productChoose,
				isEnabled,
			} = req.body;

			if (new Date(startDate) > new Date(endDate)) {
				return appError(400, '結束日期必須在開始日期之後', next);
			}

			const newCoupon = await Coupons.create({
				couponName,
				startDate,
				endDate,
				type,
				discountConditions,
				percentage,
				productType,
				productChoose,
				isEnabled,
				seller,
			});

			// 更新商品標籤
			let updateQuery;
			if (productType === 1) {
				// 指定商家所有商品
				updateQuery = { sellerOwned: seller };
			} else if (productType === 2) {
				// 指定商品
				updateQuery = { _id: { $in: productChoose } };
			}

			if (updateQuery) {
				const tag = type === 0 ? 0 : 1; // 0: 免運券, 1: 折抵券
				await Products.updateMany(updateQuery, { $addToSet: { tags: tag } });
			}

			// 更新賣家的折價券列表
			await Seller.findByIdAndUpdate(seller, {
				$push: { discount: newCoupon._id },
			});
			res.status(200).json({
				status: true,
				message: '折價券建立成功啦 ( ﾉ>ω<)ﾉ',
				Coupons: newCoupon,
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
				productType,
				productChoose,
				isEnabled,
			} = req.body;

			if (new Date(startDate) > new Date(endDate)) {
				return appError(400, '結束日期必須在開始日期之後', next);
			}

			const coupon = await Coupons.findOne({ _id: couponID, seller });
			if (!coupon) {
				return appError(
					404,
					'找不到折價券或您無權修改此折價券 ( ˘•ω•˘ )',
					next
				);
			}

			// 更新標籤前，先移除原本的
			let removeQuery;
			if (coupon.productType === 1) {
				// 移除該賣家所有商品的舊標籤
				removeQuery = { sellerOwned: seller };
			} else if (coupon.productType === 2) {
				// 移除指定商品的舊標籤
				removeQuery = { _id: { $in: coupon.productChoose } };
			}
			if (removeQuery) {
				const oldTag = coupon.type === 0 ? 0 : 1;
				await Products.updateMany(removeQuery, { $pull: { tags: oldTag } });
			}

			const updatedCoupon = await Coupons.findByIdAndUpdate(
				couponID,
				{
					couponName,
					startDate,
					endDate,
					type,
					discountConditions,
					percentage,
					productType,
					productChoose,
					isEnabled,
					seller,
				},
				{ new: true, runValidators: true }
			);

			// 更新商品標籤
			let updateQuery;
			if (productType === 1) {
				// 指定商家所有商品
				updateQuery = { sellerOwned: seller };
			} else if (productType === 2) {
				// 指定商品
				updateQuery = { _id: { $in: productChoose } };
			}

			if (updateQuery) {
				const tag = type === 0 ? 0 : 1; // 0: 免運券, 1: 折抵券
				await Products.updateMany(updateQuery, { $addToSet: { tags: tag } });
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
		const couponID = req.params.coupon_id;
		const seller = req.user._id;
		try {
			const coupon = await Coupons.findOne({
				_id: couponID,
				seller,
			});

			if (!coupon) {
				return appError(
					404,
					'此折價券沒被找到或您無權刪除此折價券喔 ( ˘•ω•˘ )',
					next
				);
			}

			await Coupons.deleteOne({ _id: couponID });

			await Seller.findByIdAndUpdate(seller, {
				$pull: { discount: couponID },
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
