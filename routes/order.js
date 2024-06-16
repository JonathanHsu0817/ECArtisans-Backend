let express = require('express');
let router = express.Router();
const { isAuth } = require('../middlewares/isAuth');
const orderController = require('../controllers/user/orderControllers');

//單一訂單管理
router.post('/', isAuth, orderController.createOrder);


// 查询買家所有訂單紀錄
router.get('/', isAuth, orderController.getOrders);
module.exports = router;

// 查詢單張訂單詳情
router.get('/:orderId', isAuth, orderController.getSpecificOrder);
