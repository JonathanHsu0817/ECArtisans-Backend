const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SellerSchema = new Schema(
	{
		bossName: { type: String, default: '', require: [true] },
		gender: { type: String, default: '' },
		phone: { type: String, default: '', require: [true] },
		mail: { type: String, default: '', require: [true] },
		brand: { type: String, default: '', require: [true] },
		avatar: { type: String, default: '' },
		role: {
			type: String,
			enum: ['admin', 'seller', 'user'],
			default: 'seller',
			select: false,
		}, //判斷身分 平台端、賣家猜、買家端
		plan: { type: Number, default: 1 },
		planPeriod: {
			type: Date,
			default: () => {
				const currentDate = new Date();
				currentDate.setFullYear(currentDate.getFullYear() + 1);
				return currentDate;
			},
		},
		password: { type: String, require: [true], select: false },
		otherPassword: { type: String, select: false },
		address: { type: String, default: '' },
		introduce: { type: String, default: '' },
		salesType: [
			{
				type: Number,
				enum: [1, 2, 3, 4, 5, 6, 7, 8, 9], //1:娛樂 2:服飾 3:3C產品 4:食品 5:家具 6:運動用品 7:寵物用品 8:生活用品 9:清潔用品
				required: [true, '必須選擇其一總類別'],
			},
		],
		member: Array,
		discount: Array,
		activity: Array,
		order: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Orders',
			},
		],
		product: Array,
		collection: { type: String, default: '' },
		chat: Array,
	},
	{
		suppressReservedKeysWarning: true,
		versionKey: false,
	}
);

const Seller = mongoose.model('Sellers', SellerSchema);

module.exports = Seller;
