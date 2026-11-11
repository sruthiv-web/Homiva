
const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const productController = require("../controllers/productController");
const adminController = require("../controllers/adminController");
const orderController = require("../controllers/orderController");
const couponController = require("../controllers/couponController");
const requireAdmin = require("../middleware/adminMiddleware");
const requireAuth = require("../middleware/authMiddleware");

// Admin Login
router.get("/login", (req, res) => {
    res.render("admin/login");
});

router.post("/login", adminController.login);

// Protect all routes below this point
router.use(requireAuth, requireAdmin);

// Dashboard
router.get("/dashboard", (req, res) => {
    res.render("admin/dashboard");
});

router.get("/users-page", (req, res) => {
    res.render("admin/users");
});

// Admin User Management APIs
router.get("/users", adminController.getUsers);

router.get("/users/:id", adminController.getUserById);

router.patch("/users/:id/block", adminController.blockUser);

router.patch("/users/:id/unblock", adminController.unblockUser);

router.get("/dashboard-stats", adminController.getDashboardStats);
router.get("/dashboard-analytics", adminController.getDashboardAnalytics);
// Admin Order Management
router.get("/orders/data", orderController.getAllOrders);
router.patch("/orders/:orderId/status", orderController.updateOrderStatus);
// Admin Logout
router.post("/logout", adminController.logout);
// Product Management
router.get("/products/search", productController.searchAdminProducts);

router.get("/products", productController.getAdminProducts);
router.post(
    "/products",
    upload.array("images", 5),
    productController.addProduct
);
router.get("/products/new", (req, res) => {
    res.render("admin/add-product");
});

router.post(
    "/products/:id/edit",
    upload.array("images", 5),
    productController.updateProduct
);
// Admin Orders Page
router.get("/orders", (req, res) => {
    res.render("admin/orders");
});
router.get("/products/:id/edit", productController.getEditProduct);

router.post("/products/:id/delete", productController.deleteProduct);

router.get("/recent-orders", adminController.getRecentOrders);

router.get("/coupons", (req, res) => {
    res.render("admin/coupons");
});
router.post("/coupons", couponController.createCoupon);
router.get("/coupons/list", couponController.getAllCoupons);
router.put("/coupons/:id", couponController.updateCoupon);
router.patch("/coupons/:id/toggle",couponController.toggleCoupon);
module.exports = router;
