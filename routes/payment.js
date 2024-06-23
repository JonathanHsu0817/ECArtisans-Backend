// eslint-disable-next-line linebreak-style
const express = require('express');

const router = express.Router();

const paymentController = require('../controllers/paymentController');

router.post('/', paymentController.initiatePayment);

router.post('/notify', paymentController.handlePaymentResult);

module.exports = router;
