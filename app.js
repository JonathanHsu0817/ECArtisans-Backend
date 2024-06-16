let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
//郵件套件
let nodemailer = require('nodemailer');

//routes
let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let activitiesRouter = require('./routes/activities');
let authRouter = require('./routes/auth');
let cartsRouter = require('./routes/cart');
let detailRouter = require('./routes/detail');
let discountsRouter = require('./routes/discounts');
let homeRouter = require('./routes/home');
let ordersRouter = require('./routes/order');
let productsRouter = require('./routes/products');
let searchRouter = require('./routes/search');
let sellersRouter = require('./routes/sellers');
let shopRouter = require('./routes/shop');
let uploadRouter = require('./routes/upload');

let app = express();
// 防範程式碼出大錯誤
process.on('uncaughtException', (err) => {
	// 記錄錯誤下來，等到服務都處理完後，停掉該 process
	console.error('Uncaughted Exception！');
	console.error(err);
	process.exit(1);
});

// mongodb
dotenv.config({ path: './config.env' });
const mongoose = require('mongoose');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use('/', indexRouter); //預設(目前無用)
//data
app.use('/users', usersRouter);
app.use('/sellers', sellersRouter);
app.use('/products', productsRouter);
app.use('/order', ordersRouter);
app.use('/activities', activitiesRouter);
app.use('/discounts', discountsRouter);
app.use('/cart', cartsRouter);
//view
app.use('/home', homeRouter);
app.use('/shop', shopRouter);
app.use('/detail', detailRouter);
//Function
app.use('/auth', authRouter);
app.use('/search', searchRouter);
app.use('/upload', uploadRouter);

mongoose
	.connect(process.env.DATABASE)
	.then(() => {
		console.log('資料庫連線成功');
	})
	.catch((error) => {
		console.log(error);
	});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// const resErrorProd = (err,res) =>{
//   if(err.isOperational){
//     res.status(err.statusCode).json({
//       message:err.message
//     })
//   }else{
//     console.error("出現重大錯誤",err)
//     res.status(500).json({
//       status: 'error',
//       message: '系統錯誤～～'
//     })
//   }
// }
const resErrorDev = (err, res) => {
	res.status(err.statusCode).json({
		message: err.message,
		error: err,
		stack: err.stack,
	});
};

// error handler
app.use(function (err, req, res, next) {
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
