
const Product = require("../models/product");
const cloudinary = require("../config/cloudinary");

function uploadProductImage(imageBuffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "homiva/products" },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result.secure_url);
            }
        );

        stream.end(imageBuffer);
    });
}

async function getFeaturedProducts() {
    return await Product.find({
        isFeatured: true,
        isActive: true
    }).select("name price image category description");
}

async function getAllProducts() {
    return await Product.find({
        isActive: true
    }).select("name price image category description")
    .limit(4);
}

module.exports = {
    uploadProductImage,
    getFeaturedProducts,
    getAllProducts
};
