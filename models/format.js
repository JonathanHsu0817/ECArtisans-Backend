const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const formatSchema = new Schema(
	{
		title: {
			type: String,
			required: [true, '請輸入品項名稱'],
		},
		price: {
			type: Number,
			required: [true, '請輸入價格'],
		},
		cost: {
			type: Number,
			required: [true, '請輸入成本'],
		},
		stock: {
			type: Number,
		},
		color: [String],
	},
	{
		versionKey: false,
	}
);

module.exports = formatSchema;
