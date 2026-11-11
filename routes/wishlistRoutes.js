
const express = require("express");
const router = express.Router();
const checkUserNotBlocked = require("../middleware/checkUserNotBlocked");
const wishlistController = require("../controllers/wishlistController");
const requireAuth = require("../middleware/authMiddleware");
// Get wishlist
router.get("/items",requireAuth, checkUserNotBlocked, wishlistController.getWishlist);

// Add product to wishlist
router.post("/add", requireAuth,checkUserNotBlocked, wishlistController.addToWishlist);

// Remove product from wishlist
router.post("/remove",requireAuth, checkUserNotBlocked, wishlistController.removeFromWishlist);

module.exports = router;
