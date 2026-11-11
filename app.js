require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const noCache = require("./middleware/noCache");
const productRoutes = require("./routes/productRoutes");
const Product = require("./models/product");
const wishlistRoutes = require("./routes/wishlistRoutes");
const User = require("./models/User");
const cartRoutes = require("./routes/cartRoutes");
const cookieParser = require("cookie-parser");
const checkUserNotBlocked = require("./middleware/checkUserNotBlocked");
const requireAuth = require("./middleware/authMiddleware");
const optionalAuth = require("./middleware/optionalAuth");
const profileRoutes = require("./routes/profileRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use("/api/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/orders", orderRoutes);
// Static Files
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Page Routes
app.get("/signup", (req, res) => {
    res.render("auth/signup");
});

app.get("/login", noCache, (req, res) => {
    res.render("auth/login");
});

app.get("/", noCache, optionalAuth, (req, res) => {
    res.render("customer/home", {
        user: req.user || null
    });
});

app.get("/products", noCache, optionalAuth, async (req, res) => {
    try{ const search = req.query.search?.trim();

    const filter = {
        isActive: true
    };

    if (search) {
        const searchRegex = new RegExp(
    search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "i"
);

        filter.$or = [
            { name: searchRegex },
            { category: searchRegex },
            { description: searchRegex }
        ];
    }

    const products = await Product.find(filter);
    let wishlistIds = [];

    if (req.user) {
        const currentUser = await User.findById(
            req.user.id
        ).select("wishlist");

        wishlistIds = currentUser
            ? currentUser.wishlist.map(id => id.toString())
            : [];
    }

    res.render("customer/products", {
        products,
        user: req.user || null,
        wishlistIds
    });

} catch (error) {
    console.error("Product listing error:", error);
    res.status(500).send("Unable to load products.");
}
});

// Product Detail Page
app.get("/products/:id", noCache, optionalAuth, async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            isActive: true
        });

        if (!product) {
            return res.status(404).send("Product not found.");
        }

        const similarProducts = await Product.find({
            category: product.category,
            _id: { $ne: product._id },
            isActive: true
        }).limit(4);

        res.render("customer/product-detail", {
            product,
            similarProducts,
            user: req.user || null
        });

    } catch (error) {
        console.error("Product detail error:", error);
        res.status(500).send("Unable to load product details.");
    }
});
// Profile Page
app.get("/profile", noCache, requireAuth,
    checkUserNotBlocked, (req, res) => {
        res.render("customer/profile", {
            user: req.user
        });
    }
);
// Wishlist Page
app.get("/wishlist", noCache, requireAuth,
    checkUserNotBlocked, (req, res) => {
        res.render("customer/wishlist", {
            user: req.user
        });
    });

app.get("/cart", noCache, requireAuth,
    checkUserNotBlocked, (req, res) => {
        res.render("customer/cart", {
            user: req.user
        });
    });
app.get("/checkout", noCache, requireAuth,
    checkUserNotBlocked, (req, res) => {
        res.render("customer/checkout", {
            user: req.user
        });
    }
);
// Order Success Page
app.get("/order-success/:orderId", noCache, requireAuth,
    checkUserNotBlocked, (req, res) => {

        res.render("customer/order-success", {
            user: req.user,
            orderId: req.params.orderId
        });
    }
);
app.get("/suspended", (req, res) => {
    res.render("customer/suspended");
});

// Start Server
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Homiva running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
