const { instance } = require("../utils/razorpayconfig");

exports.createOrder = async (req, res) => {
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
  });
};

// exports.ver
