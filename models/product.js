
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        image: {
            type: String,
            default: ""
        },
        images: {
    type: [String],
    default: []
},
        category: {
            type: String,
            required: true,
            trim: true
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true
        },
        stock: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Product", productSchema);
