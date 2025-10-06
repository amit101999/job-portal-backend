const express = require("express");
const { isAuthenticated } = require("../middleware/isAuthenticated");
const {
  createOrder,
  verifyPayment,
} = require("../controllers/paymentController");

const router = express.Router();

router.route("/checkout").post(createOrder);
router.route("/verifyPayment").post(verifyPayment);

module.exports = router;
