
const User = require("../models/User");
const Product = require("../models/product");

// Get wishlist products
async function getWishlist(req, res) {
    try {
       const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to view your wishlist."
            });
        }

        const user = await User.findById(userId)
            .populate({
                path: "wishlist",
                match: { isActive: true }
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: user.wishlist.filter(Boolean)
        });

    } catch (error) {
        console.error("Get wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load wishlist."
        });
    }
}

// Add product to wishlist
async function addToWishlist(req, res) {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to add wishlist items."
            });
        }

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required."
            });
        }

        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }
 if (!user.wishlist) {
    user.wishlist = [];
}
        const alreadyExists = user.wishlist.some(
            id => id.toString() === productId
        );

        if (alreadyExists) {
            return res.status(200).json({
                success: true,
                message: "Product is already in your wishlist."
            });
        }
        

        user.wishlist.push(product._id);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Product added to wishlist."
        });

    } catch (error) {
        console.error("Add wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add product to wishlist."
        });
    }
}


async function removeFromWishlist(req, res) {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to manage your wishlist."
            });
        }

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required."
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { wishlist: productId } },
          { returnDocument: "after" }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Removed from wishlist!"
        });

    } catch (error) {
        console.error("Remove wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove product from wishlist."
        });
    }
}


module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
};
