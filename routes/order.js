let express = require('express');
let router = express.Router();
const { isAuth } = require('../middlewares/isAuth');
const orderController = require('../controllers/user/orderControllers');

//單一訂單管理
router.post('/', isAuth, orderController.createOrder);

module.exports = router;
