/* eslint-disable no-tabs */
/* eslint-disable indent */
/* eslint-disable linebreak-style */
const handleErrorAsync = require('../service/handleErrorAsync');
const appError = require('../service/appError');
const paymentService = require('../service/payment');
const { config } = require('../service/payment');

const orders = {};

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

	const paymentInfo = await paymentService.initiatePayment(paymentData);

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
	console.log('req.body notify data', req.body);
	const { TradeInfo } = req.body;
	const decryptedInfo = paymentService.createSesDecrypt(TradeInfo);
	console.log('data:', decryptedInfo);

	const paymentResult1 = JSON.parse(decryptedInfo);

	console.log('付款完成1，訂單：', paymentResult1);

	const paymentResult2 = orders[data?.Result?.MerchantOrderNo];

	console.log('付款完成2，訂單：', paymentResult2);

	res.status(200).json({
		status: true,
		message: '支付結果回傳',
		paymentResult2,
	});

	res.end();
});

module.exports = {
	initiatePayment,
	handlePaymentReturnUrl,
	handlePaymentResult,
};
