const User = require("../models/User");

async function checkUserNotBlocked(req, res, next) {
    try {
        if (!req.user?.id) {
            if (!req.originalUrl.startsWith("/api/")) {
                return res.redirect("/login");
            }

            return res.status(401).json({
                success: false,
                message: "Please login to continue.",
                redirectUrl: "/login"
            });
        }

        const user = await User.findById(req.user.id)
            .select("isBlocked");

        if (!user) {
            res.clearCookie("userToken");

            if (req.originalUrl.startsWith("/api/")) {
                return res.status(401).json({
                    success: false,
                    message: "User account not found. Please login again."
                });
            }

            return res.redirect("/login");
        }

        if (user.isBlocked) {

            // API request
            if (req.originalUrl.startsWith("/api/")) {
                return res.status(403).json({
                    success: false,
                    blocked: true,
                    message: "Your account has been blocked.",
                    redirectUrl: "/suspended"
                });
            }

            // Normal page request
            return res.redirect("/suspended");
        }

        next();

    } catch (error) {
        console.error("Check blocked user error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify your account."
        });
    }
}

module.exports = checkUserNotBlocked;