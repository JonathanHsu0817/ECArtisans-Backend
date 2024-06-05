let express = require('express');
let router = express.Router();
const { isAuth } = require('../middlewares/isAuth');
const cartController = require('../controllers/cartControllers');

//加入購物車
router.post('/addCart', isAuth, cartController.addToCart);

module.exports = router;
