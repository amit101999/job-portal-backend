const { instance } = require("../utils/razorpayconfig");
const crypto = require("crypto");

exports.createOrder = async (req, res) => {
  const { amount } = req.body;
  const orderRes = await instance.orders.create({
    amount: 50000,
    currency: "INR",
    receipt: "receipt#1",
    notes: {
      key1: "value3",
      key2: "value2",
    },
  });

  console.log("order created :  ", orderRes);

  res.json({
    success: true,
    order: orderRes,
  });
};

exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const generated_signature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) // use secret as key
    .update(razorpay_order_id + "|" + razorpay_payment_id) // message to hash
    .digest("hex");

  console.log("checksum", generated_signature);
  console.log("razorpay_signature", razorpay_signature);

  if (generated_signature !== razorpay_signature) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid signature" });
  }
  // store payment info in db

  return res.status(200).json({ success: true });

  res.status(200).json({ success: true });
};
