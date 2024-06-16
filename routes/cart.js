let express = require('express');
let router = express.Router();
const { isAuth } = require('../middlewares/isAuth');
const cartController = require('../controllers/user/cartControllers');

//加入購物車
router.post('/', isAuth, cartController.addToCart);

router.post('/select', isAuth, cartController.chooseSelectedCart);

router.get('/', isAuth, cartController.getCart);

router.put('/:productId/:formatId', isAuth, cartController.updateCart);

router.delete('/:productId/:formatId', isAuth, cartController.deleteCart);

router.delete('/', isAuth, cartController.deleteCartAll);

module.exports = router;
