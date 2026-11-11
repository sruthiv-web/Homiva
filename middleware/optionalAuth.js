const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function optionalAuth(req, res, next) {
    try {
        const token = req.cookies.userToken;

        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);

        if (!user) {
            res.clearCookie("userToken");
            req.user = null;
            return next();
        }

        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        };

        next();

    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            res.clearCookie("token");
            req.user = null;
            return next();
        }

        next(error);
    }
}

module.exports = optionalAuth;