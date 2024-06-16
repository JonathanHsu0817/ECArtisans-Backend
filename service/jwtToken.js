const jwt = require('jsonwebtoken');

//token
const generateSendJWT = (user, statusCode, res) => {
	const userName = user.name || user.bossName;
	const role = user.role;
	const token = jwt.sign(
		{
			id: user._id,
			name: userName,
			role,
		},
		process.env.JWT_SECRET,
		{
			expiresIn: process.env.JWT_EXPIRES_DAY,
		}
	);
	res.status(statusCode).json({
		status: true,
		message: `${userName}用戶登入成功~ ( ﾉ>ω<)ﾉ`,
		user: {
			token,
			userName: userName,
		},
	});
};

module.exports = generateSendJWT;
