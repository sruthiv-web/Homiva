
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
    try {
        // 1. Get JWT token from cookie
        const isAdminRequest =
    req.originalUrl.startsWith("/admin") ||
    req.originalUrl.startsWith("/api/admin");

const cookieName = isAdminRequest ? "adminToken" : "userToken";
const token = req.cookies[cookieName];

        // 2. Check whether token exists
        if (!token) {

            // Admin pages
            if (req.originalUrl.startsWith("/admin")) {
                return res.redirect("/admin/login");
            }

            // API requests
            if (req.originalUrl.startsWith("/api/")) {
                return res.status(401).json({
                    success: false,
                    message: "Please login to continue.",
                    redirectUrl: "/login"
                });
            }

            // Wishlist page
            if (req.originalUrl.startsWith("/wishlist")) {
                return res.redirect("/login?from=wishlist");
            }

            // Cart page
            if (req.originalUrl.startsWith("/cart")) {
                return res.redirect("/login?from=cart");
            }

            return res.redirect("/login");
        }

        // 3. Verify JWT token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // 4. Find user in database
        const user = await User.findById(decoded.userId);

        if (!user) {
res.clearCookie(cookieName);
            if (req.originalUrl.startsWith("/admin")) {
                return res.redirect("/admin/login");
            }

            if (req.originalUrl.startsWith("/api/")) {
                return res.status(401).json({
                    success: false,
                    message: "User not found. Please login again."
                });
            }

            return res.redirect("/login");
        }
if (isAdminRequest && user.role !== "admin") {
    return res.status(403).json({
        success: false,
        message: "Admin access required."
    });
}

if (!isAdminRequest && user.role !== "user") {
    return res.status(403).json({
        success: false,
        message: "Customer access required."
    });
}
        // 5. Attach user details to request
        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        };

        // 6. Continue to next middleware/controller
        next();

    } catch (error) {

        // 7. Handle invalid or expired JWT
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            res.clearCookie(cookieName);

            if (req.originalUrl.startsWith("/admin")) {
                return res.redirect("/admin/login");
            }

            if (req.originalUrl.startsWith("/api/")) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid or expired token. Please login again.",
                    redirectUrl: "/login"
                });
            }

            return res.redirect("/login");
        }

        next(error);
    }
}

module.exports = requireAuth;
