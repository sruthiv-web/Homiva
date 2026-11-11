
const express = require("express");
const router = express.Router();

const orderController = require("../controllers/orderController");
const requireAuth = require("../middleware/authMiddleware");
const checkUserNotBlocked = require("../middleware/checkUserNotBlocked");

// Place COD order
router.post(
    "/place",
    requireAuth,
    checkUserNotBlocked,
    orderController.placeOrder
);
// Get logged-in user's orders
router.get(
    "/my-orders",
    requireAuth,
    checkUserNotBlocked,
    orderController.getMyOrders
);
// Cancel pending order
router.patch(
    "/cancel/:orderId",
    requireAuth,
    checkUserNotBlocked,
    orderController.cancelOrder
);
// Create Razorpay order
router.post(
    "/create-razorpay-order",
    requireAuth,
    checkUserNotBlocked,
    orderController.createRazorpayOrder
);
// Verify Razorpay payment
router.post(
    "/verify-razorpay-payment",
    requireAuth,
    checkUserNotBlocked,
    orderController.verifyRazorpayPayment
);

module.exports = router;
