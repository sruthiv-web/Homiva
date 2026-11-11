
const Cart = require("../models/Cart");
const Product = require("../models/product");
const Coupon = require("../models/Coupon");

// Get logged-in user's cart
async function getCart(req, res) {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to access your cart."
            });
        }

        let cart = await Cart.findOne({ user: userId })
            .populate("items.product");

        if (!cart) {
            cart = { items: [] };
        }

        return res.status(200).json({
            success: true,
            data: cart
        });

    } catch (error) {
        console.error("Get cart error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch cart."
        });
    }
}
// Apply coupon to cart
async function applyCoupon(req, res) {
    try {
        const userId = req.user.id;
        const { couponCode } = req.body;

        const coupon = await Coupon.findOne({
            code: couponCode?.trim().toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            return res.status(400).json({
                success: false,
                message: "Invalid coupon code."
            });
        }

        // Check expiry date
        if (new Date() > coupon.expiryDate) {
            return res.status(400).json({
                success: false,
                message: "This coupon has expired."
            });
        }

        // Check usage limit
        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: "Coupon usage limit has been reached."
            });
        }

        const cart = await Cart.findOne({ user: userId })
            .populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty."
            });
        }

        const subtotal = cart.items.reduce((total, item) => {
            if (!item.product || !item.product.isActive) {
                return total;
            }

            return total + item.product.price * item.quantity;
        }, 0);

        if (subtotal < coupon.minPurchase) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase of ₹${coupon.minPurchase} required.`
            });
        }

        // Calculate discount
        let discountAmount = 0;

        if (coupon.discountType === "FLAT") {
            discountAmount = coupon.discountValue;
        } else if (coupon.discountType === "PERCENTAGE") {
            discountAmount =
                subtotal * coupon.discountValue / 100;

            if (coupon.maxDiscountAmount !== null) {
                discountAmount = Math.min(
                    discountAmount,
                    coupon.maxDiscountAmount
                );
            }
        }

        // Discount cannot exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);

        cart.appliedCoupon = coupon.code;
        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully.",
            couponCode: coupon.code,
            subtotal,
            discountAmount
        });

    } catch (error) {
        console.error("Apply coupon error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to apply coupon."
        });
    }
}
// Get available coupons for the cart
async function getAvailableCoupons(req, res) {
    try {
        const userId = req.user.id;

        const cart = await Cart.findOne({ user: userId })
            .populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        const subtotal = cart.items.reduce((total, item) => {
            if (!item.product || !item.product.isActive) {
                return total;
            }

            return total + item.product.price * item.quantity;
        }, 0);

        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gt: new Date() },
            $expr: { $lt: ["$usedCount", "$usageLimit"] },
            minPurchase: { $lte: subtotal }
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: coupons
        });

    } catch (error) {
        console.error("Get available coupons error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch available coupons."
        });
    }
}
// Add product to cart
async function addToCart(req, res) {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to add products to your cart."
            });
        }

        const { productId, quantity = 1 } = req.body;

        if (
            !productId ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product or quantity."
            });
        }

        const product = await Product.findOne({
            _id: productId,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({
                user: userId,
                items: []
            });
        }

        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {

            const updatedQuantity =
                existingItem.quantity + Number(quantity);

            if (updatedQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: "Requested quantity exceeds available stock."
                });
            }

            existingItem.quantity = updatedQuantity;

        } else {

            if (Number(quantity) > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: "Requested quantity is not available."
                });
            }

            cart.items.push({
                product: productId,
                quantity: Number(quantity)
            });
        }

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Product added to cart."
        });

    } catch (error) {
        console.error("Add to cart error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to add product to cart."
        });
    }
}


// Update product quantity
async function updateQuantity(req, res) {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        if (
            !productId ||
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid product or quantity."
            });
        }

        const product = await Product.findOne({
            _id: productId,
            isActive: true
        });

        if (!product || Number(quantity) > product.stock) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity is not available."
            });
        }

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found."
            });
        }

        const item = cart.items.find(
            item => item.product.toString() === productId
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart."
            });
        }

        item.quantity = Number(quantity);

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Cart quantity updated."
        });

    } catch (error) {
        console.error("Update cart error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to update cart."
        });
    }
}


// Remove product from cart
async function removeFromCart(req, res) {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found."
            });
        }

        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Product removed from cart."
        });

    } catch (error) {
        console.error("Remove from cart error:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to remove product."
        });
    }
}


module.exports = {
    getCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    applyCoupon,
    getAvailableCoupons
};
