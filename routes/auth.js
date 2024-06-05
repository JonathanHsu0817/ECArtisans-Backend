let express = require('express');
let router = express.Router();
const Seller = require('../models/seller.js');
const User = require('../models/user.js');

const bcrypt = require('bcrypt'); //加密套件
const generateSendJWT = require('../service/jwtToken.js');
const validator = require('validator'); //表單驗證

const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	auth: {
		user: 'ecnodeproject@gmail.com',
		pass: process.env.PASS,
	},
});

const appError = require('../service/appError.js');

//賣家註冊
router.post('/shop-signUp', async (req, res, next) => {
	try {
		let {
			bossName,
			gender,
			role,
			phone,
			mail,
			password,
			confirmPassword,
			brand,
			address,
			collection,
			salesType,
			introduce,
		} = req.body;
		//不能空的內容
		if (
			!mail ||
			!password ||
			!confirmPassword ||
			!gender ||
			!phone ||
			!brand ||
			!bossName
		) {
			return next(appError(400, '內容不能為空', next));
		}
		//確認密碼
		if (password != confirmPassword) {
			return next(appError(400, '前後密碼不對', next));
		}
		if (!validator.isLength(password, { min: 8 })) {
			return next(appError(400, '密碼小於8碼', next));
		}
		if (!validator.isLength(phone, { min: 10 })) {
			return next(appError(400, '電話小於10碼', next));
		}
		const numericRegex = /^\d+$/;
		if (!numericRegex.test(phone)) {
			return next(appError(400, '電話必須為數字', next));
		}
		if (!validator.isEmail(mail)) {
			return next(appError(400, '郵件格式錯誤', next));
		}

		//驗證是否被註冊過
		const used = await Seller.findOne({ mail: mail });
		if (used) {
			return next(appError(400, '此郵件已經被使用過了!'));
		}

		//加密
		password = await bcrypt.hash(req.body.password, 12);
		const newUser = await Seller.create({
			bossName,
			role,
			gender,
			phone,
			mail,
			password,
			confirmPassword,
			brand,
			address,
			collection,
			salesType,
			introduce,
		});

		res.status(200).json({
			status: true,
			message: '註冊成功~，來登入逛逛吧! ( ﾉ>ω<)ﾉ',
		});
	} catch (error) {
		next(error);
	}
});

//賣家登入
router.post('/shop-login', async (req, res, next) => {
	try {
		// res.setHeader('Access-Control-Allow-Origin', '*');
		const { mail, password } = req.body;
		if (!mail || !password) {
			return next(appError(400, '帳號密碼不能為空', next));
		}
		const seller = await Seller.findOne({ mail }).select('+password +role');
		if (!seller) {
			return next(appError(400, '用戶不存在', next));
		}
		const auth = await bcrypt.compare(password, seller.password);
		if (!auth) {
			return next(appError(400, '密碼錯誤', next));
		}
		generateSendJWT(seller, 200, res);
	} catch (error) {
		next(error);
	}
});

// //賣家登入
// router.post('/shop-login', async (req, res, next) => {
// 	try {
// 		// res.setHeader('Access-Control-Allow-Origin', '*');
// 		const { mail, password } = req.body;
// 		if (!mail || !password) {
// 			return next(appError(400, '帳號密碼不能為空', next));
// 		}
// 		const seller = await Seller.findOne({ mail }).select('+password +role');
// 		if (!seller) {
// 			return next(appError(400, '用戶不存在', next));
// 		}
// 		const auth = await bcrypt.compare(password, seller.password);
// 		if (!auth) {
// 			return next(appError(400, '密碼錯誤', next));
// 		}
// 		let authSecondPassword = false;  後續有空再修改
// 		if (!auth) {
// 			authSecondPassword = password === seller.otherPassword; // 比較明文密碼
// 		}
// 		if (!auth && !authSecondPassword) {
// 			return next(appError(400, '密碼不正確', next));
// 		}
// 		generateSendJWT(seller, 200, res);
// 	} catch (error) {
// 		next(error);
// 	}
// });

//買方註冊
router.post('/signup', async (req, res, next) => {
	try {
		const {
			name,
			gender,
			password,
			confirmPassword,
			birthday,
			mail,
			address,
			phone,
		} = req.body;

		// 檢查是否有空的欄位
		if (
			!name ||
			!mail ||
			!password ||
			!confirmPassword ||
			!gender ||
			!birthday ||
			!address ||
			!phone
		) {
			return next(appError(400, '欄位不得為空', next));
		}

		// 驗證密碼是否一致
		if (password !== confirmPassword) {
			return next(appError(400, '前後密碼不一致', next));
		}
		if (!validator.isLength(password, { min: 8 })) {
			return next(appError(400, '密碼長度不得小於8', next));
		}

		// 驗證郵件格式
		if (!validator.isEmail(mail)) {
			return next(appError(400, '信箱格式錯誤', next));
		}

		// 檢查郵件是否已經被使用
		const existingUser = await User.findOne({ mail: mail });
		if (existingUser) {
			return next(appError(400, '信箱已被使用', next));
		}

		// 密碼加密
		const hashedPassword = await bcrypt.hash(password, 12);

		// 建立新用戶
		const newUser = await User.create({
			name,
			gender,
			role,
			password: hashedPassword,
			birthday,
			mail,
			address,
			phone,
		});

		res.status(200).json({
			status: true,
			message: '註冊成功~，來登入逛逛吧! ( ﾉ>ω<)ﾉ',
		});
	} catch (error) {
		next(error);
	}
});

//買方登入
router.post('/login', async (req, res, next) => {
	try {
		const { mail, password } = req.body;

		if (!mail || !password) {
			return next(appError(400, '帳號密碼不能為空', next));
		}

		const user = await User.findOne({ mail }).select('+password');
		if (!user) {
			return next(appError(400, '用戶不存在', next));
		}
		const auth = await bcrypt.compare(password, user.password);
		if (!auth) {
			return next(appError(400, '密碼不正確', next));
		}

		generateSendJWT(user, 200, res);
	} catch (error) {
		next(error);
	}
});

//忘記密碼

// 	router.post('/shopForget', async (req, res, next) => {
// 	try {
// 		const { mail } = req.body;
// 		const user = await Seller.findOne({ mail: mail });
// 		if (!mail) {
// 			return next(appError(400, '信箱不得為空', next));
// 		}
// 		if (!user) {
// 			return next(appError(400, '此信箱尚未註冊', next));
// 		}
// 		transporter.sendMail({
// 			from: 'ecnodeproject@gmail.com',
// 			to: mail,
// 			subject: 'ECArtisans 備用密碼通知信',
// 			html: `<h1>您的備用密碼為：${user.otherPassword}</h1>`,
// 		});
// 		res.status(200).json({
// 			status: 'success',
// 			message: '已寄出備用密碼，請至信箱查看',
// 		});
// 	} catch (err) {
// 		next(err);
// 	}
// });

module.exports = router;

// {
//   "bossName":"text",
//   "mail":"text@gmail.com",
//   "password":"12345678",
//   "confirmPassword":"12345678",
//   "gender":"男",
//   "phone":"123456789",
//   "brand":"測試一下"
// }

// {
//   "name":"test",
//   "gender":"女",
//   "mail": "test@gmail.com",
//   "password":"12345678",
//   "confirmPassword":"12345678",
//   "address":"台北市",
//   "phone":"123456789",
//   "birthday":"2021-01-01"
// }
