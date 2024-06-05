const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema(
	{
		orderNumber: String,
		date: String,
		products: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Products',
			},
		],
		state: Number,
		price: Number,
		pay: Number,
		discount: String,
	},
	{
		versionKey: false,
	}
);
const Order = mongoose.model('Orders', orderSchema);

module.exports = Order;
