const jwt = require('jsonwebtoken');
const Seller = require('../models/seller.js');
const handleErrorAsync = require('../service/handleErrorAsync.js');
const appError = require('../service/appError.js');

//驗證token
const isAuth = handleErrorAsync(async (req, res, next) => {
	let token;
	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith('Bearer')
	) {
		token = req.headers.authorization.split(' ')[1];
	}
	if (!token) {
		return next(appError(401, '你尚未登入! ( ˘•ω•˘ )', next));
	}

	//驗證 token 正確性
	const decoded = await new Promise((resolve, reject) => {
		jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
			if (err) {
				reject(err);
			} else {
				resolve(payload);
			}
		});
	});

	let currentUser;
	if (decoded.role === 'user') {
		currentUser = await User.findById(decoded.id);
	} else if (decoded.role === 'admin' || decoded.role === 'seller') {
		currentUser = await Seller.findById(decoded.id);
	} else {
		return next(appError(401, '你說你是誰!? ( ˘•ω•˘ )', next));
	}

	req.user = currentUser;
	req.user.role = decoded.role;
	next();
});

const restriction = (role) => {
	return (req, res, next) => {
		if (req.user.role !== role) {
			return next(appError(403, '想幹嘛，不能看喔! ( ˘•ω•˘ )', next));
		}
		next();
	};
};

module.exports = { isAuth, restriction };
