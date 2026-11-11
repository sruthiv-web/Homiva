const jwt = require("jsonwebtoken");
const authService = require("../services/authService");

// Signup
async function signup(req, res) {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });
        }

        const user = await authService.registerUser({
            name,
            email,
            password
        });

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            data: { user }
        });

    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        console.error("Signup error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
}
// Login
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
                message: "Email and password are required"
            });
        }

        const user = await authService.loginUser({
            email,
            password
        });

        // Generate JWT
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

        // Store JWT in HTTP-only cookie
res.cookie("userToken", token, {            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            redirectUrl: "/",
            data: { user }
        });

    } catch (error) {
        if (error.statusCode === 401) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (error.statusCode === 403) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked. Please contact support."
            });
        }

        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
}



// Logout
function logout(req, res) {
res.clearCookie("userToken", {        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production"
    });

    return res.status(200).json({
        success: true,
        message: "Logout successful",
        redirectUrl: "/login"
    });
}

module.exports = { signup, login, logout };