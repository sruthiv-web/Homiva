
const express = require("express");
const profileController = require("../controllers/profileController");
const requireAuth = require("../middleware/authMiddleware");
const checkUserNotBlocked = require("../middleware/checkUserNotBlocked");
const router = express.Router();

// Get user profile
router.get("/", requireAuth,checkUserNotBlocked, profileController.getProfile);

// Update user profile
router.put("/", requireAuth,checkUserNotBlocked, profileController.updateProfile);

// Add new address
router.post("/addresses", requireAuth,checkUserNotBlocked, profileController.addAddress);

// Update existing address
router.put(
    "/addresses/:addressId",
    requireAuth,
    checkUserNotBlocked,
    profileController.updateAddress
);
// Delete existing address
router.delete(
    "/addresses/:addressId",
    requireAuth,
    checkUserNotBlocked,
    profileController.deleteAddress
);

module.exports = router;
