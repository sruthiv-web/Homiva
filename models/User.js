
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            trim: true,
            default: ""
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        wishlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            }
        ],

        addresses: [
            {
                fullName: {
                    type: String,
                    trim: true
                },
                phone: {
                    type: String,
                    trim: true
                },
                houseName: {
                    type: String,
                    trim: true
                },
                street: {
                    type: String,
                    trim: true
                },
                city: {
                    type: String,
                    trim: true
                },
                state: {
                    type: String,
                    trim: true
                },
                pincode: {
                    type: String,
                    trim: true
                },
                isDefault: {
                    type: Boolean,
                    default: false
                }
            }
        ],
        isBlocked: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
