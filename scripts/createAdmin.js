
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

dotenv.config();

async function createAdmin() {
    try {
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
        }

        if (password.length < 12) {
            throw new Error("Admin password must be at least 12 characters.");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            if (existingUser.role === "admin") {
                console.log("Admin account already exists.");
                return;
            }

            throw new Error(
                "This email already belongs to a user. Use a different admin email."
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await User.create({
            name: "Homiva Admin",
            email,
            password: hashedPassword,
            role: "admin"
        });

        console.log("Admin account created successfully.");
        console.log("Admin email:", email);
    } catch (error) {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();