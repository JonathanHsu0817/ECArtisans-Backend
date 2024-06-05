const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const formatSchema = require('../models/format');

const cartItemSchema = new Schema(
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
	},
	{
		versionKey: false,
	}
);

const cartSchema = new Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Users',
			required: true,
		},
		items: [cartItemSchema],
		totalPrice: {
			type: Number,
			required: true,
			default: 0,
		},
		createdAt: {
			type: Date,
			default: Date.now,
		},
		updatedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		versionKey: false,
	}
);

const Cart = mongoose.model('Carts', cartSchema);

module.exports = Cart;
