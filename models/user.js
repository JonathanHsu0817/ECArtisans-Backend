const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		name: { type: String, default: '', require: [true] },
		gender: { type: String, default: '', require: [true] },
		avatar: { type: String, default: '' },
		role: {
			type: String,
			enum: ['admin', 'seller', 'user'],
			default: 'user',
			select: false,
		}, //判斷身分 平台端、賣家猜、買家端
		birthday: { type: String, default: '', require: [true] },
		phone: { type: String, default: '', require: [true] },
		mail: { type: String, default: '', require: [true] },
		address: { type: String, default: '', require: [true] },
		password: { type: String, default: '', require: [true], select: false },
		otherPassword: { type: String, select: false },
		discount: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Coupons',
			},
		],
		spHistory: Array,
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
