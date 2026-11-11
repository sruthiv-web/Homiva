
const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");

router.get("/product",productController.getAllProducts);
router.get("/featured", productController.getFeaturedProducts);
router.get("/:id", productController.getProductById);
module.exports = router;
