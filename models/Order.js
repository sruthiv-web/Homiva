
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: [orderItemSchema],
    shippingAddress: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        houseName: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true }
    },
    subtotal: {
        type: Number,
        required: true
    },
    shippingCharge: {
        type: Number,
        default: 90
    },
    discount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    couponCode: {
        type: String,
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ["COD", "ONLINE"],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending"
    },
    orderStatus: {
        type: String,
        enum: ["Pending", "Confirmed", "Shipped","Out for Delivery","Delivered","Returned","Refunded","Cancelled"],
        default: "Pending"
    },
    razorpayOrderId: {
    type: String,
    default: null
},
razorpayPaymentId: {
    type: String,
    default: null
},
razorpaySignature: {
    type: String,
    default: null
}
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);

