const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 定義折價券 Schema
const couponSchema = new Schema(
	{
		couponName: String,
		startDate: {
			type: Date,
			default: Date.now,
		},
		endDate: {
			type: Date,
			required: true,
		},
		type: {
			type: Number,
			enum: [0, 1], // 0: 免運, 1: 折抵
			required: true,
		},
		discountConditions: {
			type: Number,
			validate: {
				validator: function (value) {
					return this.type !== 1 || (this.type === 1 && value !== undefined);
				},
				message: '折價券類型的優惠券必須填寫折扣條件',
			},
		},
		percentage: {
			type: Number,
			validate: {
				validator: function (value) {
					return this.type !== 1 || (this.type === 1 && value !== undefined);
				},
				message: '折價券類型的優惠券必須填寫折扣百分比',
			},
		},
		productType: {
			type: Number,
			enum: [0, 1, 2], // 0: 全館,1: 指定商家 2: 指定商品
			required: true,
		},
		productChoose: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Products',
			},
		],
		isEnabled: {
			type: Boolean,
			default: true,
		},
		seller: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Sellers',
		},
	},
	{
		versionKey: false,
	}
);

const Coupon = mongoose.model('Coupons', couponSchema);

module.exports = Coupon;
