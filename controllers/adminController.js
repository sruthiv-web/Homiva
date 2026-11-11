
const authService = require("../services/authService");
const adminService = require("../services/adminService");
const Order = require("../models/Order");
const mongoose = require("mongoose");
const Product = require("../models/product");
// Admin Login

const jwt = require("jsonwebtoken");

// Admin Login
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const user = await authService.loginUser({
            email,
            password
        });

        if (user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin account required."
            });
        }

        const token = jwt.sign(
            {
                userId: user.id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );

        res.cookie("adminToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Admin login successful.",
            redirectUrl: "/admin/dashboard"
        });

    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
}


// Get registered users and search users
async function getUsers(req, res) {
    try {
        const search =
            typeof req.query.search === "string"
                ? req.query.search
                : "";

        const users = await adminService.getUsers(search);

        return res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch users."
        });
    }
}

// Get individual user details
async function getUserById(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        const user = await adminService.getUserById(
            req.params.id
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to fetch user details."
        });
    }
}

// Block a customer
async function blockUser(req, res) {
    return updateBlockStatus(req, res, true);
}

// Unblock a customer
async function unblockUser(req, res) {
    return updateBlockStatus(req, res, false);
}

// Update customer block status
async function updateBlockStatus(req, res, isBlocked) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        const user = await adminService.setUserBlockedStatus(
            req.params.id,
            isBlocked
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Customer not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: isBlocked
                ? "User blocked successfully."
                : "User unblocked successfully.",
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Unable to update user status."
        });
    }
}

// Get latest 5 orders for admin dashboard
async function getRecentOrders(req, res) {
    try {
        const orders = await Order.find()
            .populate("user", "name")
            .sort({ createdAt: -1 })
            .limit(5)
            .select("user items subtotal totalAmount orderStatus createdAt");

        return res.status(200).json({
            success: true,
            data: orders
        });

    } catch (error) {
        console.error("Recent orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch recent orders."
        });
    }
}
function logout(req, res) {
    res.clearCookie("adminToken", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    });

    return res.status(200).json({
        success: true,
        message: "Admin logout successful.",
        redirectUrl: "/admin/login"
    });
}
// Get dashboard analytics


async function getDashboardStats(req, res) {
    try {
        const totalUsers = await adminService.getTotalUsers();

        const totalOrders = await Order.countDocuments();

        const totalProducts = await Product.countDocuments({
            isActive: true
        });

        // Calculate total revenue
        const revenueResult = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "Paid",
                    orderStatus: {
                        $nin: ["Cancelled", "Returned", "Refunded"]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$totalAmount"
                    }
                }
            }
        ]);

        const totalRevenue = revenueResult.length > 0
            ? revenueResult[0].totalRevenue
            : 0;

        return res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalOrders,
                totalProducts,
                totalRevenue
            }
        });

    } catch (error) {
        console.error("Dashboard stats error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to load dashboard statistics."
        });
    }
}


async function getDashboardAnalytics(req, res) {
    try {
        
        const revenueTimeline = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "Paid",
                    orderStatus: {
                        $nin: ["Cancelled", "Returned", "Refunded"]
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                            timezone: "Asia/Kolkata"
                        }
                    },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. Sales by Category
        const salesByCategory = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "Paid",
                    orderStatus: {
                        $nin: ["Cancelled", "Returned", "Refunded"]
                    }
                }
            },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: Product.collection.name,
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$productDetails.category",
                    totalSales: {
                        $sum: {
                            $multiply: [
                                "$items.price",
                                "$items.quantity"
                            ]
                        }
                    }
                }
            },
            { $sort: { totalSales: -1 } }
        ]);

        // 3. Top 5 Products
        const topProducts = await Order.aggregate([
            {
                $match: {
                    paymentStatus: "Paid",
                    orderStatus: {
                        $nin: ["Cancelled", "Returned", "Refunded"]
                    }
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    productName: { $first: "$items.name" },
                    unitsSold: { $sum: "$items.quantity" }
                }
            },
            { $sort: { unitsSold: -1 } },
            { $limit: 5 }
        ]);

        // 4. Order Status Distribution
        const orderStatusDistribution = await Order.aggregate([
            {
                $group: {
                    _id: "$orderStatus",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                revenueTimeline,
                salesByCategory,
                topProducts,
                orderStatusDistribution
            }
        });

    } catch (error) {
        console.error("Dashboard analytics error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load dashboard analytics."
        });
    }
}

module.exports = {
    login,
    logout,
    getUsers,
    getUserById,
    blockUser,
    unblockUser,
    getDashboardStats,
    getRecentOrders,
    getDashboardAnalytics
}
