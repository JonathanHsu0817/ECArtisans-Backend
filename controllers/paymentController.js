/* eslint-disable no-tabs */
/* eslint-disable indent */
/* eslint-disable linebreak-style */
const handleErrorAsync = require('../service/handleErrorAsync');
const appError = require('../service/appError');
const Order = require('../models/order');
const paymentService = require('../service/payment');
const { config } = require('../service/payment');

// const orders = {};

const initiatePayment = handleErrorAsync(async (req, res, next) => {
	const { email, Amt, ItemDesc } = req.body;
	// console.log(email, Amt, ItemDesc);

	if (!email || !Amt || !ItemDesc) {
		return next(appError(400, '所有字段都是必需的'));
	}

	const paymentData = {
		MerchantID: config.MerchantID,
		RespondType: 'JSON',
		TimeStamp: Date.now(),
		Version: config.Version,
		MerchantOrderNo: `${Date.now()}`,
		Amt,
		ItemDesc,
		Email: email,
		ReturnURL: config.ReturnUrl,
		NotifyURL: config.NotifyUrl,
	};

	console.log('付款資料格式:', paymentData);

	const paymentInfo = await paymentService.initiatePayment(paymentData);
	console.log(paymentInfo);

	res.status(200).json({
		status: true,
		message: '支付請求成功',
		paymentInfo,
	});
});

const initiateOrderPayment = handleErrorAsync(async (req, res, next) => {
	const userId = req.user._id;
	const { orderId } = req.body;

	const order = await Order.findOne({ _id: orderId, user: userId });
	// const order = await Order.findById(orderId);
	console.log('order', order);
	if (!order) {
		return next(appError(404, '訂單不存在'));
	}

	const Amt = order.totalPrice + order.fare;

	const paymentData = {
		MerchantID: config.MerchantID,
		RespondType: 'JSON',
		TimeStamp: Date.now(),
		Version: config.Version,
		MerchantOrderNo: `${Date.now()}`,
		Amt,
		ItemDesc: `訂單${Date.now()}`,
		Email: req.user.mail,
		ReturnURL: config.ReturnUrl,
		NotifyURL: config.NotifyUrl,
	};
	console.log('付款資料格式:', paymentData);

	const paymentInfo = await paymentService.initiatePayment(paymentData);
	console.log(paymentInfo);

	res.status(200).json({
		status: true,
		message: '支付請求成功',
		paymentInfo,
	});
});

const handlePaymentReturnUrl = handleErrorAsync(async (req, res, next) => {
	console.log('req.body return data', req.body);
	res.render('success', { title: 'Express' });
});

const handlePaymentResult = handleErrorAsync(async (req, res, next) => {
	// console.log('req.body notify data', req.body);
	const { TradeInfo } = req.body;
	const decryptedInfo = paymentService.createSesDecrypt(TradeInfo);
	console.log('data:', decryptedInfo);

	const { TradeNo, MerchantOrderNo, PayTime } = decryptedInfo.Result;

	res.status(200).json({
		status: true,
		message: '支付結果回傳',
		paymentResult: decryptedInfo.Result,
	});

	const updatedOrder = await Order.findOneAndUpdate(
		{ _id: MerchantOrderNo },
		{
			TradeNo,
			PayTime,
			state: 1, // 已付
		},
		{ new: true }
	);

	console.log('寫入後:', updatedOrder);

	if (!updatedOrder) {
		return next(appError(404, '找不到訂單 ( ˘•ω•˘ )'));
	}

	return res.end();
});

module.exports = {
	initiatePayment,
	initiateOrderPayment,
	handlePaymentReturnUrl,
	handlePaymentResult,
};
