const express = require("express");
const router = express.Router();

const cartController = require("../controllers/cartController");
const checkUserNotBlocked = require("../middleware/checkUserNotBlocked");
const requireAuth = require("../middleware/authMiddleware");

// Get cart
router.get("/", requireAuth, checkUserNotBlocked, cartController.getCart);

// Add product to cart
router.post("/add", requireAuth, checkUserNotBlocked, cartController.addToCart);

// Update product quantity
router.patch("/update", requireAuth, checkUserNotBlocked, cartController.updateQuantity);

// Remove product from cart
router.delete("/remove/:productId", requireAuth, checkUserNotBlocked, cartController.removeFromCart);

// Apply coupon
router.post("/apply-coupon", requireAuth, checkUserNotBlocked, cartController.applyCoupon);

// Get available coupons
router.get("/coupons/available", requireAuth, checkUserNotBlocked, cartController.getAvailableCoupons);

module.exports = router;