const Coupon = require("../models/Coupon");

// Create new coupon
async function createCoupon(req, res) {
    try {
        const {
            code,
            discountType,
            discountValue,
            maxDiscountAmount,
            minPurchase,
            expiryDate,
            usageLimit
        } = req.body;

        // Validate required fields
        if (
            !code ||
            !discountType ||
            !discountValue ||
            !expiryDate ||
            !usageLimit
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        // Check duplicate coupon
        const existingCoupon = await Coupon.findOne({
            code: code.trim().toUpperCase()
        });

        if (existingCoupon) {
            return res.status(400).json({
                success: false,
                message: "Coupon code already exists."
            });
        }

        const coupon = await Coupon.create({
            code,
            discountType,
            discountValue,
            maxDiscountAmount:
                discountType === "PERCENTAGE"
                    ? maxDiscountAmount || null
                    : null,
            minPurchase: minPurchase || 0,
            expiryDate,
            usageLimit
        });

        return res.status(201).json({
            success: true,
            message: "Coupon created successfully.",
            data: coupon
        });

    } catch (error) {
        console.error("Create coupon error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create coupon."
        });
    }
}
// Get all coupons
async function getAllCoupons(req, res) {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: coupons
        });

    } catch (error) {
        console.error("Get coupons error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch coupons."
        });
    }
}
// Update existing coupon
async function updateCoupon(req, res) {
    try {
        const { id } = req.params;

        const {
            discountType,
            discountValue,
            maxDiscountAmount,
            minPurchase,
            expiryDate,
            usageLimit
        } = req.body;

        if (
            !discountType ||
            !discountValue ||
            !expiryDate ||
            !usageLimit
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found."
            });
        }

        if (Number(usageLimit) < coupon.usedCount) {
            return res.status(400).json({
                success: false,
                message: "Usage limit cannot be less than used count."
            });
        }

        coupon.discountType = discountType;
        coupon.discountValue = Number(discountValue);
        coupon.maxDiscountAmount =
            discountType === "PERCENTAGE"
                ? Number(maxDiscountAmount)
                : null;
        coupon.minPurchase = Number(minPurchase) || 0;
        coupon.expiryDate = expiryDate;
        coupon.usageLimit = Number(usageLimit);

        await coupon.save();

        return res.status(200).json({
            success: true,
            message: "Coupon updated successfully."
        });

    } catch (error) {
        console.error("Update coupon error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update coupon."
        });
    }
}
// Activate or deactivate coupon
async function toggleCoupon(req, res) {
    try {
        const { id } = req.params;

        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Coupon not found."
            });
        }

        coupon.isActive = !coupon.isActive;

        await coupon.save();

        return res.status(200).json({
            success: true,
            message: coupon.isActive
                ? "Coupon activated successfully."
                : "Coupon deactivated successfully."
        });

    } catch (error) {
        console.error("Toggle coupon error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update coupon status."
        });
    }
}


module.exports = {
    createCoupon,getAllCoupons,  updateCoupon,  toggleCoupon
};