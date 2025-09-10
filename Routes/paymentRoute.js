const express = require("express");
const { isAuthenticated } = require("../middleware/isAuthenticated");
const { createOrder } = require("../controllers/paymentController");
const router = express.Router();

router.route("/checkout").post(isAuthenticated, createOrder);

module.exports = router;
