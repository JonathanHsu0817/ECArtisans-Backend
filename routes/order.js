let express = require('express');
let router = express.Router();
const { isAuth } = require('../middlewares/isAuth');
const orderController = require('../controllers/user/orderControllers');

//買家新增訂單
router.post('/', isAuth, orderController.createOrder);


// 買家查詢所有訂單紀錄
router.get('/', isAuth, orderController.getOrders);
module.exports = router;

// 買家查詢單張訂單詳情
router.get('/:orderId', isAuth, orderController.getSpecificOrder);