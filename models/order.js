const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const formatSchema = require('../models/format');

const orderItemSchema = new Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Products',
			required: true,
		},
		format: {
			type: formatSchema,
			required: true,
		},
		quantity: {
			type: Number,
			required: true,
			min: [1, '數量不能少於 1'],
		},
		price: {
			type: Number,
			required: true,
		},
		review: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Review',
			default: null, // 預設 null，代表尚未評價
		},
	},
	{
		versionKey: false,
	}
);

const orderSchema = new Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Users',
			required: true,
		},
		seller: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Sellers',
			required: true,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		updatedAt: {
			type: Date,
			default: Date.now,
		},
		products: [orderItemSchema],
		state: {
			type: Number,
			required: true,
			enum: [0, 1], // 0:未付, 1:已付
		},
		totalPrice: {
			type: Number,
			required: true,
		},
		pay: {
			type: Number,
			required: true,
			enum: [1, 2, 3], // 1:信用卡付款, 2:ATM匯款, 3:店到店付費
		},
		address: {
			type: String,
			required: true,
		},
		delivery: {
			type: Number,
			required: true,
			enum: [1, 2, 3], // 1:宅配 2:黑貓宅急便 3:店到店
		},
		fare: {
			type: Number,
			required: true,
		},
		MerchantOrderNo: {
			//當送貨編號
			type: String,
			required: true,
		},
		TradeNo: {
			//交易號碼
			type: String,
		},
		PayTime: {
			//付款時間
			type: String,
		},
	},
	{
		versionKey: false,
	}
);

const Order = mongoose.model('Orders', orderSchema);

module.exports = Order;
