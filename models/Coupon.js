const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        discountType: {
            type: String,
            enum: ["FLAT", "PERCENTAGE"],
            required: true
        },

        discountValue: {
            type: Number,
            required: true,
            min: 1
        },

        maxDiscountAmount: {
            type: Number,
            default: null
        },

        minPurchase: {
            type: Number,
            default: 0
        },

        expiryDate: {
            type: Date,
            required: true
        },

        usageLimit: {
            type: Number,
            required: true,
            min: 1
        },

        usedCount: {
            type: Number,
            default: 0
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Coupon", couponSchema);