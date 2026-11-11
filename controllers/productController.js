const productService = require("../services/productService");
const Product = require("../models/product");

async function getFeaturedProducts(req, res) {
    try {
        const products = await productService.getFeaturedProducts();

        return res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error("Error fetching featured products:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch featured products"
        });
    }
}
 async function getAllProducts(req,res){
    try{
        const products=await productService.getAllProducts();
        return res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    }
    catch(error){
        console.error("Error fetching products:",error);
        return res.status(500).json({
            success:false,
            message:"Failed to fetch products"
        });
    }
 }
 //product details
 
async function getProductById(req, res) {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error("Get product by ID error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
}


 //add product by admin

async function addProduct(req, res) {
    try {
        const { name, description, price, category, stock,isFeatured} = req.body;

        if (
            !name?.trim() ||
            !category?.trim() ||
            price === "" ||
            price === undefined ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            stock === "" ||
            stock === undefined ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0
        ) {
            return res.status(400).send("Please enter valid product details.");
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).send("Please upload at least one product image.");
        }

        const imageUrls = await Promise.all(
            req.files.map(file =>
                productService.uploadProductImage(file.buffer)
            )
        );

        await Product.create({
            name: name.trim(),
            description: description || "",
            price: Number(price),
            category: category.trim(),
            stock: Number(stock),
            isFeatured: isFeatured === "true",
            image: imageUrls[0],
            images: imageUrls
        });

        return res.redirect("/admin/products?success=1");
    } catch (error) {
        console.error("Add product error:", error);
        return res.status(500).send("Unable to add product.");
    }
}


/* Get product details for editing */
async function getEditProduct(req, res) {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).send("Product not found.");
        }

        return res.render("admin/edit-product", { product });
    } catch (error) {
        console.error("Get edit product error:", error);
        return res.status(500).send("Unable to load product.");
    }
}


/* Update product */
async function updateProduct(req, res) {
    try {
        const { name, description, price, category, stock, remainingImages,isFeatured} = req.body;

        if (
            !name?.trim() ||
            !category?.trim() ||
            price === "" ||
            price === undefined ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0 ||
            stock === "" ||
            stock === undefined ||
            !Number.isInteger(Number(stock)) ||
            Number(stock) < 0
        ) {
            return res.status(400).send("Please enter valid product details.");
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).send("Product not found.");
        }

        // Get existing images, including support for older products
        const currentImages = product.images?.length
            ? product.images
            : (product.image ? [product.image] : []);

        // Read the images kept by the admin
        let keptImages;

        try {
            keptImages = remainingImages !== undefined
                ? JSON.parse(remainingImages)
                : currentImages;
        } catch {
            return res.status(400).send("Invalid image selection.");
        }

        if (
            !Array.isArray(keptImages) ||
            !keptImages.every(
                image => typeof image === "string" && currentImages.includes(image)
            )
        ) {
            return res.status(400).send("Invalid image selection.");
        }

        // Upload newly selected images
        const newImageUrls = req.files?.length
            ? await Promise.all(
                req.files.map(file =>
                    productService.uploadProductImage(file.buffer)
                )
            )
            : [];

        const finalImages = [...keptImages, ...newImageUrls];

        if (finalImages.length === 0) {
            return res.status(400).send(
                "Please keep or upload at least one product image."
            );
        }

        product.name = name.trim();
        product.description = description || "";
        product.price = Number(price);
        product.category = category.trim();
        product.stock = Number(stock);
        product.isFeatured = isFeatured === "true";
        
        product.images = finalImages;
        product.image = finalImages[0];

        await product.save();

        return res.redirect(`/admin/products/${product._id}/edit?updated=1`);
    } catch (error) {
        console.error("Update product error:", error);
        return res.status(500).send("Unable to update product.");
    }
}



// Get all products for admin page
async function getAdminProducts(req, res) {
    try {
        const products = await Product.find().sort({ createdAt: -1 });

        return res.render("admin/products", {
            products,
            success: req.query.success || null
        });
    } catch (error) {
        console.error("Error loading admin products:", error);
        return res.status(500).send("Unable to load products.");
    }
}

// Search admin products
async function searchAdminProducts(req, res) {
    try {
        const searchText = req.query.search?.trim() || "";

        const products = await Product.find({
            $or: [
                { name: { $regex: searchText, $options: "i" } },
                { category: { $regex: searchText, $options: "i" } }
            ]
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error("Admin product search error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to search products"
        });
    }
}
// Delete product
async function deleteProduct(req, res) {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).send("Product not found.");
        }

        return res.redirect("/admin/products?deleted=1");
    } catch (error) {
        console.error("Delete product error:", error);
        return res.status(500).send("Unable to delete product.");
    }
}
module.exports = { getFeaturedProducts,getAllProducts,addProduct,getAdminProducts,searchAdminProducts,updateProduct,getEditProduct,deleteProduct,getProductById};