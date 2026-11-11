
const Cart = require("../models/Cart");
const Product = require("../models/product");
const User = require("../models/User");
const Order = require("../models/Order");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Coupon = require("../models/Coupon");
// Place Cash on Delivery order
async function placeOrder(req, res) {
    const updatedProducts = [];
    let savedOrderId = null;
    let couponUsageIncremented = false;
    let couponId = null;

    try {
        const userId = req.user.id;
        const { addressId, mode, productId, quantity } = req.body;

        const isBuyNow = mode === "buyNow";

        // Validate address ID
        if (!addressId || !require("mongoose").Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid delivery address."
            });
        }

        // Find selected saved address
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(400).json({
                success: false,
                message: "Selected address not found."
            });
        }

        let cart = null;
        let checkoutItems = [];

        // Get Buy Now product or cart products
        if (isBuyNow) {
            if (
                !productId ||
                !require("mongoose").Types.ObjectId.isValid(productId) ||
                !Number.isInteger(quantity) ||
                quantity < 1
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
                throw new Error("Product is no longer available.");
            }

            checkoutItems = [{ product, quantity }];

        } else {
            cart = await Cart.findOne({ user: userId })
                .populate("items.product");

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Your cart is empty."
                });
            }

            checkoutItems = cart.items;
        }

        // Calculate subtotal and validate products
        let subtotal = 0;
        const orderItems = [];

        for (const item of checkoutItems) {
            const product = item.product;

            if (!product || !product.isActive) {
                throw new Error("A product is no longer available.");
            }

            if (product.stock < item.quantity) {
                throw new Error(
                    `Insufficient stock for ${product.name}. Available stock: ${product.stock}.`
                );
            }

            subtotal += product.price * item.quantity;

            orderItems.push({
                product: product._id,
                name: product.name,
                image: product.image,
                price: product.price,
                quantity: item.quantity
            });
        }

        // Calculate coupon discount
        let coupon = null;
        let discount = 0;

        if (!isBuyNow && cart.appliedCoupon) {
            coupon = await Coupon.findOne({
                code: cart.appliedCoupon,
                isActive: true
            });

            if (
                !coupon ||
                new Date() > coupon.expiryDate ||
                coupon.usedCount >= coupon.usageLimit
            ) {
                throw new Error("This coupon is no longer valid.");
            }

            if (subtotal < coupon.minPurchase) {
                throw new Error(
                    `Minimum purchase of ₹${coupon.minPurchase} required.`
                );
            }

            if (coupon.discountType === "FLAT") {
                discount = coupon.discountValue;
            } else if (coupon.discountType === "PERCENTAGE") {
                discount = subtotal * coupon.discountValue / 100;

                if (coupon.maxDiscountAmount !== null) {
                    discount = Math.min(
                        discount,
                        coupon.maxDiscountAmount
                    );
                }
            }

            discount = Math.min(discount, subtotal);
        }

        const shippingCharge = 90;
        const totalAmount = subtotal + shippingCharge - discount;
        // Reduce stock safely
        for (const item of checkoutItems) {
            const updatedProduct = await Product.findOneAndUpdate(
                {
                    _id: item.product._id,
                    isActive: true,
                    stock: { $gte: item.quantity }
                },
                {
                    $inc: { stock: -item.quantity }
                },
                { returnDocument: "after" });

            if (!updatedProduct) {
                throw new Error(
                    `Stock is no longer available for ${item.product.name}.`
                );
            }

            updatedProducts.push({
                productId: item.product._id,
                quantity: item.quantity
            });
        }

        // Create order
        const order = new Order({
            user: userId,
            items: orderItems,
            shippingAddress: {
                fullName: address.fullName,
                phone: address.phone,
                houseName: address.houseName,
                street: address.street,
                city: address.city,
                state: address.state,
                pincode: address.pincode
            },
            subtotal,
            shippingCharge,
            discount,
            totalAmount,
            couponCode: discount > 0 ? cart.appliedCoupon : null,
            paymentMethod: "COD",
            paymentStatus: "Pending",
            orderStatus: "Pending",

        });

        await order.save();
        savedOrderId = order._id;
        // Increment coupon usage after successful order creation
        if (coupon) {
            const updatedCoupon = await Coupon.findOneAndUpdate(
                {
                    _id: coupon._id,
                    isActive: true,
                    expiryDate: { $gt: new Date() },
                    usedCount: { $lt: coupon.usageLimit }
                },
                {
                    $inc: { usedCount: 1 }
                },
                { returnDocument: "after" }
            );

            if (!updatedCoupon) {
                throw new Error("Coupon is no longer available.");
            }
            couponUsageIncremented = true;
            couponId = coupon._id;
        }

        // Clear cart only for normal cart checkout
        if (!isBuyNow) {
            cart.items = [];
            cart.appliedCoupon = null;
            await cart.save();
        }

        return res.status(201).json({
            success: true,
            message: "Order placed successfully!",
            orderId: order._id
        });

    } catch (error) {
        console.error("Place order error:", error);

        try {
            if (savedOrderId) {
                await Order.deleteOne({ _id: savedOrderId });
            }
            if (couponUsageIncremented && couponId) {
                await Coupon.updateOne(
                    { _id: couponId, usedCount: { $gt: 0 } },
                    { $inc: { usedCount: -1 } }
                );
            }
            for (const item of updatedProducts) {
                await Product.updateOne(
                    { _id: item.productId },
                    { $inc: { stock: item.quantity } }
                );
            }

        } catch (rollbackError) {
            console.error("Order rollback error:", rollbackError);
        }

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to place your order."
        });
    }
}
// Create Razorpay order
async function createRazorpayOrder(req, res) {
    try {
        const userId = req.user.id;
        const { addressId, mode, productId, quantity } = req.body;

        const isBuyNow = mode === "buyNow";

        // Validate address
        if (!addressId || !require("mongoose").Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid address."
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const address = user.addresses.id(addressId);

        if (!address) {
            return res.status(400).json({
                success: false,
                message: "Selected address not found."
            });
        }

        let cart = null;
        let checkoutItems = [];

        // Get checkout products
        if (isBuyNow) {
            if (
                !productId ||
                !require("mongoose").Types.ObjectId.isValid(productId) ||
                !Number.isInteger(quantity) ||
                quantity < 1
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
                throw new Error("Product is no longer available.");
            }

            checkoutItems = [{ product, quantity }];

        } else {
            cart = await Cart.findOne({ user: userId })
                .populate("items.product");

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Your cart is empty."
                });
            }

            checkoutItems = cart.items;
        }

        // Calculate subtotal
        let subtotal = 0;

        for (const item of checkoutItems) {
            const product = item.product;

            if (!product || !product.isActive) {
                throw new Error("A product is no longer available.");
            }

            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}.`);
            }

            subtotal += product.price * item.quantity;
        }

        // Calculate coupon discount
        let coupon = null;
        let discount = 0;

        if (!isBuyNow && cart.appliedCoupon) {
            coupon = await Coupon.findOne({
                code: cart.appliedCoupon,
                isActive: true
            });

            if (
                !coupon ||
                new Date() > coupon.expiryDate ||
                coupon.usedCount >= coupon.usageLimit
            ) {
                throw new Error("This coupon is no longer valid.");
            }

            if (subtotal < coupon.minPurchase) {
                throw new Error(
                    `Minimum purchase of ₹${coupon.minPurchase} required.`
                );
            }

            if (coupon.discountType === "FLAT") {
                discount = coupon.discountValue;
            } else if (coupon.discountType === "PERCENTAGE") {
                discount = subtotal * coupon.discountValue / 100;

                if (coupon.maxDiscountAmount !== null) {
                    discount = Math.min(
                        discount,
                        coupon.maxDiscountAmount
                    );
                }
            }

            discount = Math.min(discount, subtotal);
        }

        const shippingCharge = 90;
        const totalAmount = subtotal + shippingCharge - discount;

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100),
            currency: "INR",
            receipt: `homiva_${Date.now()}`
        });

        return res.status(200).json({
            success: true,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Create Razorpay order error:", error);

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to create payment order."
        });
    }
}
// Verify Razorpay payment
async function verifyRazorpayPayment(req, res) {
    const updatedProducts = [];
    let savedOrderId = null;
    let couponUsageIncremented = false;
    let couponId = null;

    try {
        const userId = req.user.id;

        const {
            addressId,
            mode,
            productId,
            quantity,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const isBuyNow = mode === "buyNow";

        // Verify required payment details
        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment details are missing."
            });
        }

        // Verify Razorpay signature
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const signatureBuffer = Buffer.from(razorpay_signature);
        const expectedBuffer = Buffer.from(expectedSignature);

        if (
            signatureBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed."
            });
        }

        // Confirm payment details with Razorpay
        const payment = await razorpay.payments.fetch(
            razorpay_payment_id
        );

        if (
            payment.order_id !== razorpay_order_id ||
            payment.status !== "captured"
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment is not completed."
            });
        }

        // Validate address
        if (
            !addressId ||
            !require("mongoose").Types.ObjectId.isValid(addressId)
        ) {
            throw new Error("Invalid delivery address.");
        }

        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found.");
        }

        const address = user.addresses.id(addressId);

        if (!address) {
            throw new Error("Selected address not found.");
        }

        let cart = null;
        let checkoutItems = [];

        // Get Buy Now product or cart products
        if (isBuyNow) {
            if (
                !productId ||
                !require("mongoose").Types.ObjectId.isValid(productId) ||
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {
                throw new Error("Invalid product or quantity.");
            }

            const product = await Product.findOne({
                _id: productId,
                isActive: true
            });

            if (!product) {
                throw new Error("Product is no longer available.");
            }

            checkoutItems = [{ product, quantity }];

        } else {
            cart = await Cart.findOne({ user: userId })
                .populate("items.product");

            if (!cart || cart.items.length === 0) {
                throw new Error("Your cart is empty.");
            }

            checkoutItems = cart.items;
        }

        // Calculate subtotal and prepare order items
        let subtotal = 0;
        const orderItems = [];

        for (const item of checkoutItems) {
            const product = item.product;

            if (!product || !product.isActive) {
                throw new Error("A product is no longer available.");
            }

            if (product.stock < item.quantity) {
                throw new Error(
                    `Insufficient stock for ${product.name}.`
                );
            }

            subtotal += product.price * item.quantity;

            orderItems.push({
                product: product._id,
                name: product.name,
                image: product.image,
                price: product.price,
                quantity: item.quantity
            });
        }
        // Calculate coupon discount
        let coupon = null;
        let discount = 0;

        if (!isBuyNow && cart.appliedCoupon) {
            coupon = await Coupon.findOne({
                code: cart.appliedCoupon,
                isActive: true
            });

            if (
                !coupon ||
                new Date() > coupon.expiryDate ||
                coupon.usedCount >= coupon.usageLimit
            ) {
                throw new Error("This coupon is no longer valid.");
            }

            if (subtotal < coupon.minPurchase) {
                throw new Error(
                    `Minimum purchase of ₹${coupon.minPurchase} required.`
                );
            }

            if (coupon.discountType === "FLAT") {
                discount = coupon.discountValue;
            } else if (coupon.discountType === "PERCENTAGE") {
                discount = subtotal * coupon.discountValue / 100;

                if (coupon.maxDiscountAmount !== null) {
                    discount = Math.min(
                        discount,
                        coupon.maxDiscountAmount
                    );
                }
            }

            discount = Math.min(discount, subtotal);
        }

        const shippingCharge = 90;
        const totalAmount = subtotal + shippingCharge - discount;

        // Verify the amount against Razorpay order
        const razorpayOrder = await razorpay.orders.fetch(
            razorpay_order_id
        );

        if (
            razorpayOrder.amount !== Math.round(totalAmount * 100) ||
            payment.amount !== Math.round(totalAmount * 100) ||
            payment.currency !== "INR"
        ) {
            throw new Error("Payment amount verification failed.");
        }

        // Reduce stock safely
        for (const item of checkoutItems) {
            const updatedProduct = await Product.findOneAndUpdate(
                {
                    _id: item.product._id,
                    isActive: true,
                    stock: { $gte: item.quantity }
                },
                {
                    $inc: { stock: -item.quantity }
                },
                { returnDocument: "after" }
            );

            if (!updatedProduct) {
                throw new Error(
                    `Stock is no longer available for ${item.product.name}.`
                );
            }

            updatedProducts.push({
                productId: item.product._id,
                quantity: item.quantity
            });
        }

        // Create paid order
        const order = new Order({
            user: userId,
            items: orderItems,
            shippingAddress: {
                fullName: address.fullName,
                phone: address.phone,
                houseName: address.houseName,
                street: address.street,
                city: address.city,
                state: address.state,
                pincode: address.pincode
            },
            subtotal,
            shippingCharge,
            discount,
            totalAmount,
            couponCode: discount > 0 ? cart.appliedCoupon : null,
            paymentMethod: "ONLINE",
            paymentStatus: "Paid",
            orderStatus: "Pending",
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature
        });
        await order.save();
        savedOrderId = order._id;

        // Increment coupon usage after successful payment
        if (coupon) {
            const updatedCoupon = await Coupon.findOneAndUpdate(
                {
                    _id: coupon._id,
                    isActive: true,
                    expiryDate: { $gt: new Date() },
                    usedCount: { $lt: coupon.usageLimit }
                },
                {
                    $inc: { usedCount: 1 }
                },
                { returnDocument: "after" }
            );

            if (!updatedCoupon) {
                throw new Error("Coupon is no longer available.");
            }

            // Track successful coupon usage increment
            couponUsageIncremented = true;
            couponId = coupon._id;
        }

        // Clear cart only for normal checkout
        if (!isBuyNow) {
            cart.items = [];
            cart.appliedCoupon = null;
            await cart.save();
        }

        return res.status(201).json({
            success: true,
            message: "Payment verified and order placed successfully!",
            orderId: order._id
        });

    } catch (error) {
        console.error("Payment verification error:", error);

        try {
            if (savedOrderId) {
                await Order.deleteOne({ _id: savedOrderId });
            }
            // Rollback coupon usage if payment order processing fails
            if (couponUsageIncremented && couponId) {
                await Coupon.updateOne(
                    {
                        _id: couponId,
                        usedCount: { $gt: 0 }
                    },
                    {
                        $inc: { usedCount: -1 }
                    }
                );
            }

            for (const item of updatedProducts) {
                await Product.updateOne(
                    { _id: item.productId },
                    { $inc: { stock: item.quantity } }
                );
            }

        } catch (rollbackError) {
            console.error("Payment rollback error:", rollbackError);
        }

        return res.status(400).json({
            success: false,
            message: error.message || "Payment verification failed."
        });
    }
}
// Get logged-in user's orders
async function getMyOrders(req, res) {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .select(
                "items subtotal shippingCharge discount totalAmount couponCode paymentMethod paymentStatus orderStatus createdAt"
            );

        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });

    } catch (error) {
        console.error("Get my orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch your orders."
        });
    }
}
// Cancel pending order
async function cancelOrder(req, res) {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;

        if (!require("mongoose").Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID."
            });
        }

        // Find the order belonging to the logged-in user
        const order = await Order.findOne({
            _id: orderId,
            user: userId
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        if (order.orderStatus !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending orders can be cancelled."
            });
        }

        // Update only if the order is still pending
        const cancelledOrder = await Order.findOneAndUpdate(
            {
                _id: orderId,
                user: userId,
                orderStatus: "Pending"
            },
            {
                $set: { orderStatus: "Cancelled" }
            },
            { returnDocument: "after" });

        if (!cancelledOrder) {
            return res.status(400).json({
                success: false,
                message: "This order can no longer be cancelled."
            });
        }

        // Restore product stock
        for (const item of cancelledOrder.items) {
            await Product.updateOne(
                { _id: item.product },
                { $inc: { stock: item.quantity } }
            );
        }

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully."
        });

    } catch (error) {
        console.error("Cancel order error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to cancel your order."
        });
    }
}
// Get all orders for admin
async function getAllOrders(req, res) {
    try {
        const orders = await Order.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .select(
                "user items shippingAddress subtotal shippingCharge discount totalAmount couponCode paymentMethod paymentStatus orderStatus createdAt"
            );
        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error("Get all orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch orders."
        });
    }
}
async function updateOrderStatus(req, res) {
    try {
        const { orderId } = req.params;
        const { orderStatus } = req.body;

        const allowedTransitions = {
            Pending: ["Confirmed", "Cancelled"],
            Confirmed: ["Shipped", "Cancelled"],
            Shipped: ["Out for Delivery"],
            "Out for Delivery": ["Delivered"],
            Delivered: ["Returned"],
            Returned: ["Refunded"],
            Refunded: [],
            Cancelled: []
        };

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        const nextStatuses = allowedTransitions[order.orderStatus];

        if (!nextStatuses || !nextStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${order.orderStatus} to ${orderStatus}.`
            });
        }

        order.orderStatus = orderStatus;

        if (
            orderStatus === "Delivered" &&
            order.paymentMethod === "COD"
        ) {
            order.paymentStatus = "Paid";
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully.",
            data: order
        });

    } catch (error) {
        console.error("Update order status error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update order status."
        });
    }
}
module.exports = {
    placeOrder, getMyOrders, cancelOrder, getAllOrders,
    updateOrderStatus, createRazorpayOrder, verifyRazorpayPayment
};
