/* eslint-disable no-tabs */
/* eslint-disable indent */
/* eslint-disable linebreak-style */
const handleErrorAsync = require('../service/handleErrorAsync');
const appError = require('../service/appError');
const paymentService = require('../service/payment');
const { config } = require('../service/payment');

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

const handlePaymentResult = handleErrorAsync(async (req, res, next) => {
	const { TradeInfo } = req.body;
	const decryptedInfo = paymentService.createSesDecrypt(TradeInfo);
	const paymentResult = JSON.parse(decryptedInfo);

	console.log('付款完成，訂單：', paymentResult);

	res.status(200).json({
		status: true,
		message: '支付結果回傳',
		paymentResult,
	});

	res.end();
});

module.exports = {
	initiatePayment,
	handlePaymentResult,
};
