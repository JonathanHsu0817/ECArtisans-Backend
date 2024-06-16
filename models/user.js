const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		name: { type: String, default: '', required: [true] },
		gender: { type: String, default: '', required: [true] },
		avatar: { type: String, default: '' },
		role: {
			type: String,
			enum: ['admin', 'seller', 'user'],
			default: 'user',
			select: false,
		}, //判斷身分 平台端、賣家猜、買家端
		birthday: { type: String, default: '', required: [true] },
		phone: { type: String, default: '', required: [true] },
		mail: { type: String, default: '', required: [true] },
		address: { type: String, default: '', required: [true] },
		password: { type: String, default: '', required: [true], select: false },
		otherPassword: { type: String, select: false },
		discount: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Coupons',
			},
		],
		spHistory: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Orders',
			},
		],
		likeShop: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sellers' }],
		collect: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Products' }],
		chat: Array,
	},
	{
		versionKey: false,
	}
);

const User = mongoose.model('Users', userSchema);

module.exports = User;
