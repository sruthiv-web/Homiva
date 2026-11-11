
const bcrypt = require("bcrypt");
const User = require("../models/User");

async function registerUser({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
        email: normalizedEmail
    });

    if (existingUser) {
        const error = new Error("Email already registered");
        error.statusCode = 409;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword
    });

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };
}

async function loginUser({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
        email: normalizedEmail
    });

    if (!user) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    // Blocked customers cannot log in
    if (user.role === "user" && user.isBlocked === true) {
        const error = new Error(
            "Your account has been blocked. Please contact support."
        );
        error.statusCode = 403;
        throw error;
        
    }

    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    };
}

module.exports = {
    registerUser,
    loginUser
};
