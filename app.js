const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
// 郵件套件
const nodemailer = require('nodemailer');

// routes
const mongoose = require('mongoose');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const activitiesRouter = require('./routes/activities');
const authRouter = require('./routes/auth');
const cartsRouter = require('./routes/cart');
const detailRouter = require('./routes/detail');
const discountsRouter = require('./routes/discounts');
const homeRouter = require('./routes/home');
const ordersRouter = require('./routes/order');
const productsRouter = require('./routes/products');
const searchRouter = require('./routes/search');
const sellersRouter = require('./routes/sellers');
const shopRouter = require('./routes/shop');
const uploadRouter = require('./routes/upload');
const paymentRouter = require('./routes/payment');

const app = express();
// 防範程式碼出大錯誤
process.on('uncaughtException', (err) => {
	// 記錄錯誤下來，等到服務都處理完後，停掉該 process
	console.error('Uncaughted Exception！');
	console.error(err);
	process.exit(1);
});

// mongodb
dotenv.config({ path: './config.env' });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use('/', indexRouter); // 預設(目前無用)
// data
app.use('/users', usersRouter);
app.use('/sellers', sellersRouter);
app.use('/products', productsRouter);
app.use('/order', ordersRouter);
app.use('/activities', activitiesRouter);
app.use('/discounts', discountsRouter);
app.use('/cart', cartsRouter);
// view
app.use('/home', homeRouter);
app.use('/shop', shopRouter);
app.use('/detail', detailRouter);
// Function
app.use('/auth', authRouter);
app.use('/search', searchRouter);
app.use('/upload', uploadRouter);
app.use('/payment', paymentRouter);

mongoose
	.connect(process.env.DATABASE)
	.then(() => {
		console.log('資料庫連線成功');
	})
	.catch((error) => {
		console.log(error);
	});

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

const resErrorDev = (err, res) => {
	res.status(err.statusCode).json({
		message: err.message,
		error: err,
		stack: err.stack,
	});
};

// error handler
app.use((err, req, res, next) => {
	err.statusCode = err.statusCode || 500;
	if (process.env.NODE_ENV === 'dev') {
		return resErrorDev(err, res);
	}
	if (err.name === 'ValidationError') {
		err.messages = '資料不正確 請重新輸入';
		err.isOperational = true;
		return resErrorProd(err, res);
	}
	resErrorDev(err, res);
});

// 未捕捉到的 catch
process.on('unhandledRejection', (err, promise) => {
	console.error('未捕捉到的 rejection：', promise, '原因：', err);
});

module.exports = app;
