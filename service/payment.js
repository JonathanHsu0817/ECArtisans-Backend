const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const crypto = require('crypto');

const config = {
	MerchantID: process.env.MerchantID,
	HASHKEY: process.env.HASHKEY,
	HASHIV: process.env.HASHIV,
	Version: process.env.Version,
	ReturnUrl: process.env.ReturnUrl,
	NotifyUrl: process.env.NotifyUrl,
	PayGateWay: process.env.PayGateWay,
};

const genDataChain = (order) =>
	`MerchantID=${config.MerchantID}&TimeStamp=${order.TimeStamp}&Version=${
		config.Version
	}&RespondType=JSON&MerchantOrderNo=${order.MerchantOrderNo}&Amt=${
		order.Amt
	}&NotifyURL=${encodeURIComponent(
		config.NotifyUrl
	)}&ReturnURL=${encodeURIComponent(
		config.ReturnUrl
	)}&ItemDesc=${encodeURIComponent(order.ItemDesc)}&Email=${encodeURIComponent(
		order.Email
	)}`;

const createSesEncrypt = (TradeInfo) => {
	const encrypt = crypto.createCipheriv(
		'aes256',
		config.HASHKEY,
		config.HASHIV
	);
	const enc = encrypt.update(genDataChain(TradeInfo), 'utf8', 'hex');
	return enc + encrypt.final('hex');
};

const createShaEncrypt = (aesEncrypt) => {
	const sha = crypto.createHash('sha256');
	const plainText = `HashKey=${config.HASHKEY}&${aesEncrypt}&HashIV=${config.HASHIV}`;
	return sha.update(plainText).digest('hex').toUpperCase();
};

const createSesDecrypt = (TradeInfo) => {
	const decrypt = crypto.createDecipheriv(
		'aes256',
		config.HASHKEY,
		config.HASHIV
	);
	decrypt.setAutoPadding(false);
	const text = decrypt.update(TradeInfo, 'hex', 'utf8');
	const plainText = text + decrypt.final('utf8');
	const result = plainText.replace(/[\x00-\x20]+/g, '');
	return JSON.parse(result);
};

// 發起payment

const initiatePayment = async (paymentData) => {
	const tradeInfo = createSesEncrypt(paymentData);
	const tradeSha = createShaEncrypt(tradeInfo);

	return {
		MerchantID: config.MerchantID,
		TradeInfo: tradeInfo,
		TradeSha: tradeSha,
		Version: config.Version,
		PayGateWay: config.PayGateWay,
		ReturnUrl: config.ReturnUrl,
		NotifyUrl: config.NotifyUrl,
	};
};

module.exports = {
	initiatePayment,
	createSesDecrypt,
	config,
};
