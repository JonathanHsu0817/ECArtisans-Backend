const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Products',
			required: true,
		},
		format: {
			type: Object,
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
		createAt: {
			type: Date,
			default: Date.now,
		},
		updateAt: {
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
			enum: [0, 1], // 0:刷卡, 1:現金
		},
	},
	{
		versionKey: false,
	}
);

const Order = mongoose.model('Orders', orderSchema);

module.exports = Order;
